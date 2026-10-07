//! Kokoro latency bench + listen-proxy check.
//! cargo run --release --example tts_bench [-- coreml]
use std::path::Path;
use std::time::Instant;
use tinkerterm_lib::tts::{wav, Kokoro, SAMPLE_RATE};

fn main() {
    let coreml = std::env::args().any(|a| a == "coreml");
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/kokoro");
    let t = Instant::now();
    let model = std::env::var("KOKORO_MODEL").map_or(dir.join("model.onnx"), Into::into);
    let k = Kokoro::load_model(&dir, &model, coreml).expect("load");
    println!("model: {}  provider: {}  load: {:?}", model.display(), if coreml { "CoreML" } else { "CPU" }, t.elapsed());

    let sentences = [
        "Hello Sam! So nice to see you!",
        "Let's build a tiny robot that waves hello, then teach it to draw a rainbow.",
        "Zara found 42 shiny pebbles near Kailani's sandcastle.",
    ];
    for round in ["first", "warm"] {
        for (i, s) in sentences.iter().enumerate() {
            let t = Instant::now();
            let audio = k.synth(s, "af_heart", 1.0).expect("synth");
            let dt = t.elapsed().as_secs_f64();
            let secs = audio.len() as f64 / SAMPLE_RATE as f64;
            let rms = (audio.iter().map(|x| x * x).sum::<f32>() / audio.len().max(1) as f32).sqrt();
            println!(
                "[{round}] #{i} {:.0} ms  audio {:.2}s  RTF {:.3}  {:.3}s/char  rms {:.3}",
                dt * 1000.0, secs, dt / secs, secs / s.len() as f64, rms
            );
            // the app speaks sentence by sentence, so audio starts after the first sentence/clause
            let head = s.split_inclusive(['.', '!', '?', ',']).next().unwrap_or(s);
            let t = Instant::now();
            k.synth(head, "af_heart", 1.0).expect("synth");
            println!("    time to audio start ({head:?}): {:.0} ms", t.elapsed().as_secs_f64() * 1000.0);
            if round == "first" {
                println!("    {}", k.phonemize(s));
                let path = format!("/tmp/tinkerterm_tts_{i}.wav");
                std::fs::write(&path, wav(&audio)).unwrap();
                println!("    -> {path}");
            }
        }
    }
}
