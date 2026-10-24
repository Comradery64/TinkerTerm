import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { invoke, Channel } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "@xterm/xterm/css/xterm.css";
import { prefs, savePrefs } from "./prefs";
import { ToyShell } from "./toyshell";
import { openParent, type Changed } from "./parent";
import { burst, nap, sfx, mascot, say } from "./fx";
import { remapSgr } from "./sgr";
import { overlayScrollbar } from "./scrollbar";
import { themeFor } from "./themes";
import { setActive } from "./theme-api";
import { restoreStickers, runSticker, toggleTray } from "./stickers";

const TAURI = "__TAURI_INTERNALS__" in window;
const term = new Terminal({
  fontSize: prefs.fontSize,
  fontWeight: "bold",
  fontWeightBold: "bold",
  lineHeight: 1.35,
  allowTransparency: true,
  allowProposedApi: true,   // unicode11: emoji take two cells
  cursorBlink: true,
  cursorStyle: "block",
  scrollback: 2000,
});
const fit = new FitAddon();
term.loadAddon(fit);
term.loadAddon(new Unicode11Addon());
term.unicode.activeVersion = "11";
const el = document.getElementById("term")!;
const scrollbar = overlayScrollbar(el);

let mode: "kid" | "real" = "kid";
const toy = new ToyShell(term, grownUp, (key) => setTheme(key, true));
let unmount: (() => void) | void;
let ptyReady = false;
let gateTimers: number[] = [];   // the real shell's typing gate; cleared on leaving real mode
const stopGate = () => { gateTimers.forEach(clearTimeout); gateTimers = []; };

async function main() {
  const sticker = new URLSearchParams(location.search).get("sticker");
  if (sticker) return runSticker(+sticker);   // this webview is one sticker window
  await setTheme(prefs.theme);
  term.open(el);
  scrollbar.refresh();
  applyLook();
  fit.fit();
  new ResizeObserver(() => fit.fit()).observe(el);
  term.onResize(({ cols, rows }) => { if (mode === "real") invoke("resize", { cols, rows }); });

  term.onData((s) => {
    if (mode === "real") { if (ptyReady) invoke("write", { data: Array.from(new TextEncoder().encode(s)) }); return; }
    nap();
    if (s.length === 1 && s >= " ") sparkAtCursor();
    toy.input(s);
  });
  term.attachCustomKeyEventHandler(keys);
  document.getElementById("grownup")!.addEventListener("click", grownUp);
  document.getElementById("mute")!.addEventListener("click", toggleMute);
  document.getElementById("stick")!.addEventListener("click", () => toggleTray(() => term.focus()));
  restoreStickers();
  document.getElementById("mascot")!.addEventListener("click", () => {
    sfx.boing(); mascot("happy"); say("Hee hee, that tickles!", 2000);
  });
  showMute();
  toy.start();
  term.focus();
  if (TAURI) { watchTrafficLights(); resizeGrips(); }
}

/** Stars puff out of the letter just typed. */
function sparkAtCursor() {
  const cell = (term as any)._core?._renderService?.dimensions?.css?.cell;
  if (!cell) return;
  const box = el.querySelector(".xterm-screen")!.getBoundingClientRect();
  const b = term.buffer.active;
  burst(box.left + (b.cursorX + 0.5) * cell.width, box.top + (b.cursorY + 0.5) * cell.height);
}

/** Cmd/Ctrl +/-/0: size. Cmd/Ctrl+, : grown-up corner. */
function keys(e: KeyboardEvent): boolean {
  if (e.type !== "keydown" || !(e.metaKey || e.ctrlKey)) return true;
  if (e.key === ",") { grownUp(); return false; }
  const step = e.key === "=" || e.key === "+" ? 2 : e.key === "-" ? -2 : e.key === "0" ? 0 : null;
  if (step === null) return true;
  prefs.fontSize = step ? Math.min(44, Math.max(16, prefs.fontSize + step)) : 26;
  applyLook();
  return false;
}

function applyLook() {
  term.options.fontSize = prefs.fontSize;
  document.body.classList.toggle("wobble", prefs.wobble);
  fit.fit();
}

/**
 * Switch theme: its CSS decorates from data-theme, its markup fills #chrome and #sidekick,
 * xterm gets its font and colors. fresh: a kid switched mid-session, so start a clean page.
 */
async function setTheme(key: string, fresh = false) {
  const t = themeFor(key);
  if (unmount) unmount();
  setActive(t);
  if (fresh) prefs.fontSize = t.fontSize ?? 26;
  prefs.theme = t.key; savePrefs();
  document.body.dataset.theme = t.key;
  document.getElementById("chrome")!.innerHTML = t.chrome;
  document.getElementById("sidekick")!.innerHTML = t.sidekick ?? "";
  // every face before xterm measures its cell, or it measures a fallback font
  const stack = prefs.font ? `"${prefs.font}", ${t.fontFamily}` : t.fontFamily;
  const family = stack.split(",")[0];
  await Promise.all(["", "bold "].map((w) => document.fonts.load(`${w}20px ${family}`).catch(() => [])));
  term.options.fontFamily = stack;
  term.options.theme = t.xterm;
  // OpenDyslexic's own line box is 1.75em, a third taller than the rest: tighten so a page keeps its rows
  term.options.lineHeight = Math.max(1, (t.lineHeight ?? 1.35) * (prefs.font === "OpenDyslexic Mono" ? 0.75 : 1));
  term.options.fontWeight = t.fontWeight ?? "bold";
  term.options.cursorStyle = t.cursorStyle ?? "block";
  term.options.fontSize = prefs.fontSize;
  unmount = t.mount?.(document.getElementById("chrome")!);
  fit.fit();
  if (fresh && mode === "kid") { term.reset(); toy.start(); }
}

function grownUp() {
  openParent(mode === "real", (what: Changed) => {
    if (what === "mode") switchMode();
    else if (what === "theme") setTheme(prefs.theme, true);
    else if (what === "buddy" || what === "font") setTheme(prefs.theme);
    else applyLook();
  }, () => term.focus());
}

function toggleMute() {
  prefs.sound = prefs.speech = !prefs.sound;
  savePrefs();
  if (!prefs.sound) speechSynthesis?.cancel();
  showMute();
  term.focus();
}
function showMute() { document.getElementById("mute")!.textContent = prefs.sound ? "🔊" : "🔇"; }

async function switchMode() {
  term.reset();
  if (mode === "real") {
    mode = "kid"; ptyReady = false; stopGate();
    document.body.classList.remove("real");
    if (TAURI) await invoke("kill");
    toy.start();
  } else {
    mode = "real";
    document.body.classList.add("real");
    if (!TAURI) { term.write("(no real shell in browser preview)\r\n"); return; }
    const onData = new Channel<Uint8Array>();
    const dec = new TextDecoder();
    // Typing gate: keys typed before the shell has drawn its prompt would be lost or echoed twice. Ready on the
    // OSC 133;A prompt mark, or ~1s after output goes quiet (no shell integration here), or 2s after spawn at most.
    stopGate();
    const ready = () => { stopGate(); ptyReady = true; };
    let quiet = 0;
    gateTimers = [window.setTimeout(ready, 2000)];
    onData.onmessage = (bytes) => {
      const text = dec.decode(new Uint8Array(bytes), { stream: true });
      term.write(text.replace(/\x1b\[([0-9;]*)m/g, remapSgr));
      if (ptyReady) return;
      if (text.includes("\x1b]133;A")) return ready();
      clearTimeout(quiet); quiet = window.setTimeout(ready, 1000); gateTimers = [gateTimers[0], quiet];
    };
    await invoke("spawn", { cols: term.cols, rows: term.rows, onData });
  }
  term.focus();
}

/** Edge and corner handles that start a native resize. */
function resizeGrips() {
  const dirs = { N: "North", S: "South", E: "East", W: "West", NE: "NorthEast", NW: "NorthWest", SE: "SouthEast", SW: "SouthWest" } as const;
  for (const [k, dir] of Object.entries(dirs)) {
    const g = document.createElement("div");
    g.className = `grip ${k}`;
    g.addEventListener("mousedown", (e) => { e.preventDefault(); getCurrentWindow().startResizeDragging(dir); });
    document.body.appendChild(g);
  }
}

/** macOS window buttons: hidden until the pointer is in the top-left corner. */
function watchTrafficLights() {
  let shown = true;
  const set = (v: boolean) => {
    if (v === shown) return;
    shown = v;
    invoke("traffic_lights", { visible: v, duration: v ? 0.25 : 0.45 });
  };
  document.addEventListener("mousemove", (e) => set(e.clientX <= innerWidth * 0.09 && e.clientY <= innerHeight * 0.09));
  document.addEventListener("mouseleave", () => set(false));
  invoke("traffic_lights", { visible: false, duration: 0 }); shown = false;
}

main();
