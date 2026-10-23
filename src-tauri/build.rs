fn main() {
    // The voice model is downloaded by scripts/fetch-voice.mjs, not stored in git. tauri-build wants the
    // bundled resource dir to exist, so a bare `cargo check` works; the app falls back to the system voice.
    let _ = std::fs::create_dir_all("resources/kokoro");
    tauri_build::build()
}
