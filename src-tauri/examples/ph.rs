use std::path::Path;
use tinkerterm_lib::tts::Kokoro;
fn main() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/kokoro");
    let k = Kokoro::load(&dir, false).expect("load");
    for t in std::env::args().skip(1) { println!("{t:?} -> {}", k.phonemize(&t)); }
}
