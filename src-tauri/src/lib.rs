use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use std::io::{Read, Write};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use tauri::ipc::Channel;
use tauri::{Manager, State};

pub mod tts;

struct Pty {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    child: Box<dyn portable_pty::Child + Send + Sync>,
}

/// The live shell, and a count of shells spawned or killed so a replaced one can tell it was replaced.
#[derive(Default)]
struct PtyState(Mutex<Option<Pty>>, AtomicU64);

#[tauri::command]
fn spawn(window: tauri::WebviewWindow, state: State<PtyState>, cols: u16, rows: u16, on_data: Channel<Vec<u8>>) -> Result<(), String> {
    let pair = native_pty_system()
        .openpty(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| e.to_string())?;
    let generation = state.1.fetch_add(1, Ordering::SeqCst) + 1;

    let shell = std::env::var("SHELL").unwrap_or_else(|_| {
        if cfg!(windows) { "powershell.exe".into() } else { "/bin/sh".into() }
    });
    let mut cmd = CommandBuilder::new(&shell);
    cmd.env("TERM", "xterm-256color");
    cmd.env("TERM_PROGRAM", "TinkerTerm");
    // a dedicated folder so a kid's experiments don't land in $HOME (a starting point, not a jail)
    if let Some(home) = std::env::var_os("HOME") {
        let play = std::path::Path::new(&home).join("TinkerTerm Playground");
        let _ = std::fs::create_dir_all(&play);
        cmd.cwd(play);
    }
    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    drop(pair.slave);

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    std::thread::spawn(move || {
        let mut buf = [0u8; 8192];
        while let Ok(n) = reader.read(&mut buf) {
            if n == 0 || on_data.send(buf[..n].to_vec()).is_err() {
                break;
            }
        }
        // the shell exited (`exit`, ^D): close the window, like any terminal. A shell killed by a
        // reload or by switching back to kid mode is no longer current, so it leaves the window open.
        if window.state::<PtyState>().1.load(Ordering::SeqCst) == generation {
            let _ = window.close();
        }
    });

    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    // a frontend reload calls spawn again: end the previous shell instead of orphaning it
    if let Some(mut old) = state.0.lock().unwrap().take() {
        let _ = old.child.kill();
    }
    *state.0.lock().unwrap() = Some(Pty { master: pair.master, writer, child });
    Ok(())
}

#[tauri::command]
fn write(state: State<PtyState>, data: Vec<u8>) -> Result<(), String> {
    if let Some(p) = state.0.lock().unwrap().as_mut() {
        p.writer.write_all(&data).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn resize(state: State<PtyState>, cols: u16, rows: u16) -> Result<(), String> {
    if let Some(p) = state.0.lock().unwrap().as_ref() {
        p.master
            .resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// End the grown-up shell (switching back to kid mode).
#[tauri::command]
fn kill(state: State<PtyState>) {
    state.1.fetch_add(1, Ordering::SeqCst);
    if let Some(mut p) = state.0.lock().unwrap().take() {
        let _ = p.child.kill();
    }
}

/// Read text aloud with the system voice; the fallback when the webview has no speechSynthesis.
#[tauri::command]
fn speak(text: String) {
    let text: String = text.chars().take(200).collect();
    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("say").arg("--").arg(text).spawn();
    #[cfg(not(target_os = "macos"))]
    let _ = text;
}

/// Stickers live in a file, not localStorage: WebKit flushes localStorage lazily and a quick
/// quit can lose the last sticker moves. Every sticker window reads and writes this one file.
fn stickers_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("stickers.json"))
}

#[tauri::command]
fn stickers_load(app: tauri::AppHandle) -> String {
    stickers_path(&app).and_then(|p| std::fs::read_to_string(p).map_err(|e| e.to_string())).unwrap_or_else(|_| "[]".into())
}

#[tauri::command]
fn stickers_save(app: tauri::AppHandle, json: String) -> Result<(), String> {
    let path = stickers_path(&app)?;
    // write-then-rename so a crash mid-write never leaves a half file
    let tmp = path.with_extension("tmp");
    std::fs::write(&tmp, json).map_err(|e| e.to_string())?;
    std::fs::rename(tmp, path).map_err(|e| e.to_string())
}

/// Fade the macOS titlebar widgets (close/minimize/zoom) in or out.
/// Animates their container (NSTitlebarView) rather than the buttons: AppKit
/// resets button alpha on hover/focus changes, which made the fade snap back.
#[tauri::command]
fn traffic_lights(window: tauri::Window, visible: bool, duration: f64) {
    #[cfg(target_os = "macos")]
    {
        let w = window.clone();
        let _ = window.run_on_main_thread(move || {
            use objc2_app_kit::{NSAnimationContext, NSWindow, NSWindowButton};
            let Ok(ptr) = w.ns_window() else { return };
            let ns: &NSWindow = unsafe { &*(ptr as *const NSWindow) };
            let Some(btn) = ns.standardWindowButton(NSWindowButton::CloseButton) else { return };
            let Some(bar) = (unsafe { btn.superview() }) else { return };
            let alpha = if visible { 1.0 } else { 0.0 };
            NSAnimationContext::beginGrouping();
            NSAnimationContext::currentContext().setDuration(duration);
            unsafe {
                let anim: objc2::rc::Retained<objc2::runtime::AnyObject> = objc2::msg_send![&*bar, animator];
                let _: () = objc2::msg_send![&*anim, setAlphaValue: alpha];
            }
            NSAnimationContext::endGrouping();
        });
    }
    #[cfg(not(target_os = "macos"))]
    let _ = (window, visible, duration);
}

/// Show the app icon in the Dock even for a bare debug binary (a bundle gets it from its .icns).
fn dock_icon(app: &tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        let png: &'static [u8] = include_bytes!("../icons/dock/tinkerterm.png");
        let _ = app.run_on_main_thread(move || {
            use objc2::{AllocAnyThread, MainThreadMarker};
            use objc2_app_kit::{NSApplication, NSImage};
            let Some(mtm) = MainThreadMarker::new() else { return };
            let data = objc2_foundation::NSData::with_bytes(png);
            let Some(img) = NSImage::initWithData(NSImage::alloc(), &data) else { return };
            unsafe { NSApplication::sharedApplication(mtm).setApplicationIconImage(Some(&img)) };
        });
    }
    #[cfg(not(target_os = "macos"))]
    let _ = app;
}

pub fn run() {
    tauri::Builder::default()
        .manage(PtyState::default())
        .manage(tts::TtsState::default())
        .setup(|app| {
            // Default menu gives Cmd+C/V/X/A and Quit on macOS.
            app.set_menu(tauri::menu::Menu::default(app.handle())?)?;
            dock_icon(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![spawn, write, resize, kill, speak, stickers_load, stickers_save, traffic_lights, tts::tts, tts::tts_warm])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
