//! On-device neural voice: Kokoro-82M (Apache-2.0) run natively with ONNX Runtime.
//! Grapheme-to-phoneme follows Kokoro's own "misaki" approach (Apache-2.0, no espeak/GPL):
//! the misaki US pronunciation dictionaries, plus a small rule-based fallback for unknown words.

use ort::session::Session;
use ort::value::Tensor;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

pub const SAMPLE_RATE: u32 = 24_000;
const MAX_TOKENS: usize = 510; // Kokoro's context, and the number of rows in a voice file
const STYLE_DIM: usize = 256;

pub struct Kokoro {
    session: Mutex<Session>,
    dir: PathBuf,
    lexicon: HashMap<String, String>,
    vocab: HashMap<char, i64>,
    voices: Mutex<HashMap<String, Arc<Vec<f32>>>>,
}

impl Kokoro {
    /// Load model, dictionaries and vocab from `dir` (the resources/kokoro folder).
    pub fn load(dir: &Path, coreml: bool) -> Result<Self, String> {
        Self::load_model(dir, &dir.join("model.onnx"), coreml)
    }

    /// Like load, with an explicit model file (the bench compares precisions).
    pub fn load_model(dir: &Path, model: &Path, coreml: bool) -> Result<Self, String> {
        let e = |e: ort::Error| e.to_string();
        let mut b = Session::builder().map_err(e)?;
        if coreml {
            #[cfg(target_os = "macos")]
            {
                b = b
                    .with_execution_providers([ort::ep::CoreML::default().build().error_on_failure()])
                    .map_err(|e| e.to_string())?;
            }
        }
        // about one thread per performance core: more (efficiency cores) measured slower
        let threads = std::thread::available_parallelism().map_or(4, |n| (n.get() / 2).clamp(2, 8));
        b = b.with_intra_threads(threads).map_err(|e| e.to_string())?;
        let session = b.commit_from_file(model).map_err(e)?;

        let mut lexicon = HashMap::new();
        for f in ["us_silver.json", "us_gold.json"] {
            // gold is loaded second so it wins over silver
            let text = std::fs::read_to_string(dir.join(f)).map_err(|e| format!("{f}: {e}"))?;
            let map: HashMap<String, serde_json::Value> = serde_json::from_str(&text).map_err(|e| format!("{f}: {e}"))?;
            for (k, v) in map {
                let p = match &v {
                    serde_json::Value::String(s) => Some(s.clone()),
                    serde_json::Value::Object(o) => o.get("DEFAULT").and_then(|d| d.as_str()).map(str::to_owned),
                    _ => None,
                };
                if let Some(p) = p {
                    lexicon.insert(k, p);
                }
            }
        }

        let tok: serde_json::Value = serde_json::from_str(
            &std::fs::read_to_string(dir.join("tokenizer.json")).map_err(|e| e.to_string())?,
        )
        .map_err(|e| e.to_string())?;
        let vocab = tok["model"]["vocab"]
            .as_object()
            .ok_or("tokenizer.json: no vocab")?
            .iter()
            .filter_map(|(k, v)| Some((k.chars().next()?, v.as_i64()?)))
            .collect();

        Ok(Self { session: Mutex::new(session), dir: dir.to_owned(), lexicon, vocab, voices: Mutex::default() })
    }

    fn voice(&self, id: &str) -> Result<Arc<Vec<f32>>, String> {
        if !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
            return Err(format!("bad voice id {id:?}"));
        }
        if let Some(v) = self.voices.lock().unwrap().get(id) {
            return Ok(v.clone());
        }
        let bytes = std::fs::read(self.dir.join("voices").join(format!("{id}.bin"))).map_err(|e| format!("voice {id}: {e}"))?;
        let v: Vec<f32> = bytes.chunks_exact(4).map(|c| f32::from_le_bytes([c[0], c[1], c[2], c[3]])).collect();
        if v.len() < STYLE_DIM {
            return Err(format!("voice {id}: too short"));
        }
        let v = Arc::new(v);
        self.voices.lock().unwrap().insert(id.to_owned(), v.clone());
        Ok(v)
    }

    /// Text to misaki-style IPA phonemes.
    pub fn phonemize(&self, text: &str) -> String {
        g2p(&self.lexicon, text)
    }

    /// Synthesize 24 kHz mono f32 samples.
    pub fn synth(&self, text: &str, voice: &str, speed: f32) -> Result<Vec<f32>, String> {
        let style = self.voice(voice)?;
        let ph = self.phonemize(text);
        let mut out = Vec::new();
        for chunk in chunks(&ph) {
            let ids: Vec<i64> = chunk.chars().filter_map(|c| self.vocab.get(&c).copied()).collect();
            if ids.is_empty() {
                continue;
            }
            // Kokoro picks the style row by token count (rows beyond the file clamp to the last)
            let rows = style.len() / STYLE_DIM;
            let row = ids.len().min(rows - 1);
            let s = style[row * STYLE_DIM..(row + 1) * STYLE_DIM].to_vec();
            let mut input = Vec::with_capacity(ids.len() + 2);
            input.push(0);
            input.extend(&ids);
            input.push(0);
            let e = |e: ort::Error| e.to_string();
            let n = input.len();
            let inputs = ort::inputs![
                "input_ids" => Tensor::from_array(([1usize, n], input)).map_err(e)?,
                "style" => Tensor::from_array(([1usize, STYLE_DIM], s)).map_err(e)?,
                "speed" => Tensor::from_array(([1usize], vec![speed.clamp(0.5, 2.0)])).map_err(e)?,
            ];
            let mut sess = self.session.lock().unwrap();
            let outputs = sess.run(inputs).map_err(e)?;
            let (_, wav) = outputs[0].try_extract_tensor::<f32>().map_err(e)?;
            out.extend_from_slice(wav);
        }
        Ok(out)
    }
}

/// 16-bit PCM mono WAV.
pub fn wav(samples: &[f32]) -> Vec<u8> {
    let data_len = (samples.len() * 2) as u32;
    let mut w = Vec::with_capacity(44 + data_len as usize);
    w.extend(b"RIFF");
    w.extend((36 + data_len).to_le_bytes());
    w.extend(b"WAVEfmt ");
    w.extend(16u32.to_le_bytes());
    w.extend(1u16.to_le_bytes()); // PCM
    w.extend(1u16.to_le_bytes()); // mono
    w.extend(SAMPLE_RATE.to_le_bytes());
    w.extend((SAMPLE_RATE * 2).to_le_bytes());
    w.extend(2u16.to_le_bytes());
    w.extend(16u16.to_le_bytes());
    w.extend(b"data");
    w.extend(data_len.to_le_bytes());
    for s in samples {
        w.extend(((s.clamp(-1.0, 1.0) * 32767.0) as i16).to_le_bytes());
    }
    w
}

/// Split a phoneme string into model-sized pieces, preferring sentence, then clause, then word breaks.
fn chunks(ph: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut rest: Vec<char> = ph.chars().collect();
    while rest.len() > MAX_TOKENS {
        let window = &rest[..MAX_TOKENS];
        let cut = [&['.', '!', '?'][..], &[',', ';', ':', '—', '…'][..], &[' '][..]]
            .iter()
            .find_map(|set| window.iter().rposition(|c| set.contains(c)))
            .map_or(MAX_TOKENS, |i| i + 1);
        out.push(rest[..cut].iter().collect::<String>().trim().to_owned());
        rest.drain(..cut);
    }
    out.push(rest.iter().collect::<String>().trim().to_owned());
    out
}

// ---------- text normalization ----------

const ONES: [&str; 20] = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
    "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS: [&str; 10] = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

fn number_words(n: u64) -> String {
    fn below_1000(n: u64) -> String {
        let mut s = String::new();
        if n >= 100 {
            s = format!("{} hundred", ONES[(n / 100) as usize]);
            if n % 100 == 0 {
                return s;
            }
            s.push(' ');
        }
        let r = n % 100;
        if r < 20 {
            s.push_str(ONES[r as usize]);
        } else {
            s.push_str(TENS[(r / 10) as usize]);
            if r % 10 != 0 {
                s.push(' ');
                s.push_str(ONES[(r % 10) as usize]);
            }
        }
        s
    }
    if n < 1000 {
        return below_1000(n);
    }
    let mut parts = Vec::new();
    let mut n = n;
    for (scale, name) in [(1_000_000_000_000u64, "trillion"), (1_000_000_000, "billion"), (1_000_000, "million"), (1000, "thousand")] {
        if n >= scale {
            parts.push(format!("{} {name}", number_words(n / scale)));
            n %= scale;
        }
    }
    if n > 0 {
        parts.push(below_1000(n));
    }
    parts.join(" ")
}

#[derive(Debug, PartialEq)]
enum Tok {
    Word(String),
    Punct(char),
}

fn tokenize(text: &str) -> Vec<Tok> {
    let mut toks = Vec::new();
    let chars: Vec<char> = text.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if c.is_ascii_digit() {
            let start = i;
            while i < chars.len() && (chars[i].is_ascii_digit() || (chars[i] == ',' && chars.get(i + 1).is_some_and(|d| d.is_ascii_digit()))) {
                i += 1;
            }
            let int: String = chars[start..i].iter().filter(|c| **c != ',').collect();
            let words = int.parse::<u64>().map(number_words).unwrap_or_else(|_| int.chars().map(|d| ONES[d as usize - '0' as usize]).collect::<Vec<_>>().join(" "));
            toks.extend(words.split(' ').map(|w| Tok::Word(w.into())));
            if chars.get(i) == Some(&'.') && chars.get(i + 1).is_some_and(|d| d.is_ascii_digit()) {
                toks.push(Tok::Word("point".into()));
                i += 1;
                while i < chars.len() && chars[i].is_ascii_digit() {
                    toks.push(Tok::Word(ONES[chars[i] as usize - '0' as usize].into()));
                    i += 1;
                }
            }
            if chars.get(i) == Some(&'%') {
                toks.push(Tok::Word("percent".into()));
                i += 1;
            }
            continue;
        }
        if c.is_alphabetic() {
            let start = i;
            while i < chars.len() && (chars[i].is_alphabetic() || (matches!(chars[i], '\'' | '’') && chars.get(i + 1).is_some_and(|c| c.is_alphabetic()))) {
                i += 1;
            }
            toks.push(Tok::Word(chars[start..i].iter().map(|c| if *c == '’' { '\'' } else { *c }).collect()));
            continue;
        }
        i += 1;
        match c {
            '.' | '!' | '?' | ',' | ';' | ':' | '—' | '…' | '(' | ')' => toks.push(Tok::Punct(c)),
            '-' | '–' if toks.last().is_some_and(|t| matches!(t, Tok::Word(_))) && chars.get(i).is_some_and(|c| c.is_alphanumeric()) => {}
            '-' | '–' => toks.push(Tok::Punct('—')),
            '"' | '“' | '”' => toks.push(Tok::Punct('"')),
            '&' => toks.push(Tok::Word("and".into())),
            '+' => toks.push(Tok::Word("plus".into())),
            '=' => toks.push(Tok::Word("equals".into())),
            '@' => toks.push(Tok::Word("at".into())),
            _ => {}
        }
    }
    toks
}

// ---------- grapheme to phoneme ----------

fn starts_with_vowel_sound(ph: &str) -> bool {
    ph.chars().find(|c| !matches!(c, 'ˈ' | 'ˌ')).is_some_and(|c| "aeiouAIOWYæɑɐɒɔəɚɛɜɪʊʌᵻ".contains(c))
}

fn g2p(lex: &HashMap<String, String>, text: &str) -> String {
    let toks = tokenize(text);
    // first pass: phonemes per word (articles depend on the next word, so resolve them in a second pass)
    let ph: Vec<Option<String>> = toks
        .iter()
        .map(|t| match t {
            Tok::Word(w) => Some(word(lex, w)),
            Tok::Punct(_) => None,
        })
        .collect();
    let mut out = String::new();
    for (i, t) in toks.iter().enumerate() {
        match t {
            Tok::Punct(c) => {
                if *c == '(' || *c == '"' && !out.ends_with(' ') && !out.is_empty() {
                    out.push(' ');
                }
                out.push(*c);
            }
            Tok::Word(w) => {
                if !out.is_empty() && !out.ends_with(['(', ' ']) && !(out.ends_with('"') && out.matches('"').count() % 2 == 1) {
                    out.push(' ');
                }
                let next_vowel = ph[i + 1..].iter().flatten().next().is_some_and(|p| starts_with_vowel_sound(p));
                let p = match w.to_lowercase().as_str() {
                    "the" => if next_vowel { "ði" } else { "ðə" }.to_owned(),
                    "a" if w != "A" || i + 1 < toks.len() => "ɐ".to_owned(),
                    "to" => if next_vowel { "tʊ" } else { "tə" }.to_owned(),
                    _ => ph[i].clone().unwrap_or_default(),
                };
                out.push_str(&p);
            }
        }
    }
    out.trim().to_owned()
}

fn lookup(lex: &HashMap<String, String>, w: &str) -> Option<String> {
    let lower = w.to_lowercase();
    let mut cap = lower.clone();
    if let Some(f) = cap.get_mut(0..1) {
        f.make_ascii_uppercase();
    }
    [w, &lower, &cap].iter().find_map(|k| lex.get(*k).cloned())
}

fn word(lex: &HashMap<String, String>, w: &str) -> String {
    if let Some(p) = lookup(lex, w) {
        return p;
    }
    let lower = w.to_lowercase();
    // possessives and simple suffixes on a known stem
    let suffix = |stem: &str, end: &str| lookup(lex, stem).map(|p| format!("{p}{end}"));
    let voiceless_end = |p: &str| p.ends_with(['p', 't', 'k', 'f', 'θ']);
    let sibilant_end = |p: &str| p.ends_with(['s', 'z', 'ʃ', 'ʒ', 'ʧ', 'ʤ']);
    for s in ["'s", "s", "es"] {
        if let Some(stem) = lower.strip_suffix(s) {
            if let Some(p) = lookup(lex, stem) {
                let end = if sibilant_end(&p) { "ᵻz" } else if voiceless_end(&p) { "s" } else { "z" };
                if s == "es" && !sibilant_end(&p) {
                    continue;
                }
                return format!("{p}{end}");
            }
        }
    }
    if let Some(stem) = lower.strip_suffix("'") {
        if let Some(p) = lookup(lex, stem) {
            return p;
        }
    }
    if let Some(stem) = lower.strip_suffix("ing") {
        if let Some(p) = suffix(stem, "ɪŋ").or_else(|| suffix(&format!("{stem}e"), "ɪŋ")) {
            return p;
        }
    }
    if let Some(stem) = lower.strip_suffix("ed") {
        for s in [stem.to_owned(), format!("{stem}e")] {
            if let Some(p) = lookup(lex, &s) {
                let end = if p.ends_with(['t', 'd']) { "ᵻd" } else if voiceless_end(&p) || sibilant_end(&p) && !p.ends_with(['z', 'ʒ', 'ʤ']) { "t" } else { "d" };
                return format!("{p}{end}");
            }
        }
    }
    if let Some(stem) = lower.strip_suffix("ly") {
        if let Some(p) = suffix(stem, "li") {
            return p;
        }
    }
    // compounds made of two dictionary words ("rainbowcat")
    for i in (2..lower.len().saturating_sub(1)).rev() {
        if !lower.is_char_boundary(i) {
            continue;
        }
        if let (Some(a), Some(b)) = (lookup(lex, &lower[..i]), lookup(lex, &lower[i..])) {
            if i >= 3 && lower.len() - i >= 3 {
                return format!("{a}{}", b.replace('ˈ', "ˌ"));
            }
        }
    }
    // short all-caps words are acronyms: spell them
    if w.len() <= 4 && w.len() > 1 && w.chars().all(|c| c.is_ascii_uppercase()) {
        return spell(w);
    }
    if !lower.chars().any(|c| "aeiouy".contains(c)) || !lower.is_ascii() {
        return spell(w);
    }
    letters_to_sound(&lower)
}

fn spell(w: &str) -> String {
    const NAMES: [&str; 26] = [
        "ˈA", "bˈi", "sˈi", "dˈi", "ˈi", "ˈɛf", "ʤˈi", "ˈAʧ", "ˈI", "ʤˈA", "kˈA", "ˈɛl", "ˈɛm", "ˈɛn", "ˈO", "pˈi",
        "kjˈu", "ˈɑɹ", "ˈɛs", "tˈi", "jˈu", "vˈi", "dˈʌbᵊlju", "ˈɛks", "wˈI", "zˈi",
    ];
    w.chars()
        .filter(|c| c.is_ascii_alphabetic())
        .map(|c| NAMES[(c.to_ascii_lowercase() as u8 - b'a') as usize])
        .collect::<Vec<_>>()
        .join(" ")
}

/// Rule-based letter-to-sound for words the dictionaries don't know (mostly names and made-up
/// words). Outputs misaki's US phoneme set; stress goes on the first vowel.
fn letters_to_sound(w: &str) -> String {
    let c: Vec<char> = w.chars().collect();
    let n = c.len();
    let is_v = |i: usize| i < n && "aeiouy".contains(c[i]);
    let at = |i: usize, s: &str| s.chars().enumerate().all(|(k, ch)| c.get(i + k) == Some(&ch));
    let mut out = String::new();
    let mut i = 0;
    while i < n {
        // magic e: vowel + one consonant + final e  ("kate", "pete", "mike", "jose", "luke")
        let magic = i + 3 == n && c[n - 1] == 'e' && !is_v(i + 1) && "aeiou".contains(c[i]);
        let (p, len): (&str, usize) = match c[i] {
            _ if magic => {
                out.push_str(match c[i] { 'a' => "A", 'e' => "i", 'i' => "I", 'o' => "O", _ => "u" });
                let cons = c[i + 1];
                out.push_str(&letters_to_sound(&cons.to_string()).replace('ˈ', ""));
                break;
            }
            _ if at(i, "tch") => ("ʧ", 3),
            _ if at(i, "sch") => ("sk", 3),
            _ if at(i, "igh") => ("I", 3),
            _ if at(i, "ch") => ("ʧ", 2),
            _ if at(i, "sh") => ("ʃ", 2),
            _ if at(i, "th") => ("θ", 2),
            _ if at(i, "ph") => ("f", 2),
            _ if at(i, "ng") => ("ŋ", 2),
            _ if at(i, "ck") => ("k", 2),
            _ if at(i, "qu") => ("kw", 2),
            _ if at(i, "wh") => ("w", 2),
            _ if i == 0 && at(i, "kn") => ("n", 2),
            _ if i == 0 && at(i, "wr") => ("ɹ", 2),
            _ if at(i, "gh") => ("", 2),
            _ if at(i, "ee") || at(i, "ea") => ("i", 2),
            _ if at(i, "oo") => ("u", 2),
            _ if at(i, "ou") => ("W", 2),
            _ if at(i, "ow") => ("O", 2),
            _ if at(i, "ai") || at(i, "ay") || at(i, "ei") => ("A", 2),
            _ if at(i, "oi") || at(i, "oy") => ("Y", 2),
            _ if at(i, "au") || at(i, "aw") => ("ɔ", 2),
            _ if at(i, "ie") => ("i", 2),
            _ if at(i, "ey") && i + 2 == n => ("i", 2),
            _ if at(i, "ar") && !is_v(i + 2) => ("ɑɹ", 2),
            _ if at(i, "or") && !is_v(i + 2) => ("ɔɹ", 2),
            _ if (at(i, "er") || at(i, "ir") || at(i, "ur")) && !is_v(i + 2) => (if out.chars().any(|c| "AIOWYaeiouæɑəɛɪʊʌɔ".contains(c)) { "ɚ" } else { "ɜɹ" }, 2),
            'a' if i + 1 == n => ("ə", 1),
            'a' => (if is_v(i + 2) && !is_v(i + 1) && i + 1 < n { "A" } else { "æ" }, 1),
            'e' if i + 1 == n && n > 2 => ("", 1),
            'e' => ("ɛ", 1),
            'i' if i + 1 == n => ("i", 1),
            'i' => ("ɪ", 1),
            'o' if i + 1 == n => ("O", 1),
            'o' => (if is_v(i + 2) && !is_v(i + 1) && i + 1 < n { "O" } else { "ɑ" }, 1),
            'u' => (if is_v(i + 2) && !is_v(i + 1) && i + 1 < n { "u" } else { "ʌ" }, 1),
            'y' if i == 0 => ("j", 1),
            'y' if i + 1 == n => ("i", 1),
            'y' => ("ɪ", 1),
            'c' if i + 1 < n && "eiy".contains(c[i + 1]) => ("s", 1),
            'c' | 'k' | 'q' => ("k", 1),
            'g' if i + 2 == n && c[i + 1] == 'e' => ("ʤ", 1),
            'g' => ("ɡ", 1),
            'j' => ("ʤ", 1),
            'x' if i == 0 => ("z", 1),
            'x' => ("ks", 1),
            'r' => ("ɹ", 1),
            's' if i > 0 && i + 1 == n && is_v(i - 1) => ("z", 1),
            ch @ ('b' | 'd' | 'f' | 'h' | 'l' | 'm' | 'n' | 'p' | 's' | 't' | 'v' | 'w' | 'z') => {
                // doubled consonants sound once
                let len = if c.get(i + 1) == Some(&ch) { 2 } else { 1 };
                out.push(ch);
                i += len;
                continue;
            }
            _ => ("", 1),
        };
        out.push_str(p);
        i += len;
    }
    // primary stress before the first vowel
    match out.char_indices().find(|(_, ch)| "AIOWYaeiouæɑəɛɪʊʌɔɚɜ".contains(*ch)) {
        Some((k, _)) => format!("{}ˈ{}", &out[..k], &out[k..]),
        None => out,
    }
}

// ---------- tauri glue ----------

#[derive(Default)]
pub struct TtsState(Mutex<Option<Arc<Kokoro>>>);

fn model_dir(app: &tauri::AppHandle) -> PathBuf {
    use tauri::Manager;
    let bundled = app.path().resource_dir().map(|d| d.join("kokoro"));
    match bundled {
        Ok(d) if d.join("model.onnx").exists() => d,
        _ => Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/kokoro"), // dev
    }
}

fn engine(app: &tauri::AppHandle, state: &TtsState) -> Result<Arc<Kokoro>, String> {
    // held across the load so a warm-up and a first say() don't load the model twice
    let mut slot = state.0.lock().unwrap();
    if let Some(k) = slot.as_ref() {
        return Ok(k.clone());
    }
    let k = Arc::new(Kokoro::load(&model_dir(app), USE_COREML)?);
    *slot = Some(k.clone());
    Ok(k)
}

/// CPU measured faster than CoreML for this model (see examples/tts_bench.rs).
pub const USE_COREML: bool = false;

#[tauri::command]
pub async fn tts(app: tauri::AppHandle, text: String, voice: String, speed: f32) -> Result<tauri::ipc::Response, String> {
    tauri::async_runtime::spawn_blocking(move || {
        use tauri::Manager;
        let k = engine(&app, &app.state::<TtsState>())?;
        let text: String = text.chars().take(1000).collect();
        Ok(tauri::ipc::Response::new(wav(&k.synth(&text, &voice, speed)?)))
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Load the model ahead of the first say() and run one tiny synthesis to warm the kernels.
#[tauri::command]
pub async fn tts_warm(app: tauri::AppHandle) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        use tauri::Manager;
        let k = engine(&app, &app.state::<TtsState>())?;
        k.synth("Hi.", "af_heart", 1.0).map(|_| ())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn numbers() {
        assert_eq!(number_words(42), "forty two");
        assert_eq!(number_words(1205), "one thousand two hundred five");
    }

    #[test]
    fn tokens() {
        assert_eq!(tokenize("Hi, Sam!"), vec![Tok::Word("Hi".into()), Tok::Punct(','), Tok::Word("Sam".into()), Tok::Punct('!')]);
    }
}
