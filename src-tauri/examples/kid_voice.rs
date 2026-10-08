//! Listening test: wording, pace and voice blends for the warm delivery adults use with children.
//! cargo run --release --example kid_voice   (writes /tmp/tt_kid_*.wav)
use std::path::Path;
use tinkerterm_lib::tts::{wav, Kokoro};

fn main() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/kokoro");
    let k = Kokoro::load(&dir, false).expect("load");
    let plain = "Hello Sam! So nice to see you! What do you want to make today?";
    let kid = "Hello, Sam! It's sooo nice to see you! What do you want to make today?";
    let takes: [(&str, Vec<f32>); 6] = [
        ("a_plain", k.synth(plain, "af_heart", 1.0).unwrap()),
        ("b_words", k.synth(kid, "af_heart", 0.9).unwrap()),
        ("c_heart_bella", k.synth(kid, "af_heart*0.6+af_bella*0.4", 0.9).unwrap()),
        ("d_bella", k.synth(kid, "af_bella", 0.92).unwrap()),
        ("e_sky", k.synth(kid, "af_sky", 0.92).unwrap()),
        ("f_three_way", k.synth(kid, "af_heart*0.5+af_bella*0.3+af_sky*0.2", 0.9).unwrap()),
    ];
    for (name, audio) in takes {
        let path = format!("/tmp/tt_kid_{name}.wav");
        std::fs::write(&path, wav(&audio)).unwrap();
        println!("{path}");
    }
}
