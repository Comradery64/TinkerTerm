//! Listening test: ways to give Kokoro the warm, lifted delivery adults use with children.
//! cargo run --release --example kid_voice   (writes /tmp/tt_kid_*.wav)
use std::path::Path;
use tinkerterm_lib::tts::{wav, Kokoro};

/// Pitch up by `semis` without changing length: synthesize slower, then resample faster.
fn lifted(k: &Kokoro, text: &str, voice: &str, speed: f32, semis: f32) -> Vec<f32> {
    let r = 2f32.powf(semis / 12.0);
    let slow = k.synth(text, voice, speed / r).expect("synth");
    let n = (slow.len() as f32 / r) as usize;
    (0..n)
        .map(|i| {
            let x = i as f32 * r;
            let j = x as usize;
            let f = x - j as f32;
            slow[j] * (1.0 - f) + slow.get(j + 1).copied().unwrap_or(0.0) * f
        })
        .collect()
}

fn main() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/kokoro");
    let k = Kokoro::load(&dir, false).expect("load");
    let plain = "Hello Sam! So nice to see you! What do you want to make today?";
    let kid = "Hello, Sam! Oh, it is sooo nice to see you! ... What do you want to make today?";
    let blend = "af_heart*0.6+af_bella*0.4";
    let takes: [(&str, Vec<f32>); 6] = [
        ("a_plain", k.synth(plain, "af_heart", 1.0).unwrap()),
        ("b_words", k.synth(kid, "af_heart", 0.9).unwrap()),
        ("c_blend", k.synth(kid, blend, 0.9).unwrap()),
        ("d_lift1", lifted(&k, kid, "af_heart", 0.9, 1.0)),
        ("e_lift2", lifted(&k, kid, "af_heart", 0.9, 2.0)),
        ("f_blend_lift", lifted(&k, kid, blend, 0.9, 1.5)),
    ];
    for (name, audio) in takes {
        let path = format!("/tmp/tt_kid_{name}.wav");
        std::fs::write(&path, wav(&audio)).unwrap();
        println!("{path}");
    }
}
