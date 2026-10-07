import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { invoke, Channel } from "@tauri-apps/api/core";
import "@xterm/xterm/css/xterm.css";
import { prefs, savePrefs } from "./prefs";
import { ToyShell } from "./toyshell";
import { openParent, type Changed } from "./parent";
import { burst, nap, sfx, mascot, say } from "./fx";
import { remapSgr } from "./sgr";
import { overlayScrollbar } from "./scrollbar";

const TAURI = "__TAURI_INTERNALS__" in window;
const FONT = `"Comic Mono", "Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif`;

const term = new Terminal({
  fontFamily: FONT,
  fontSize: prefs.fontSize,
  fontWeight: "bold",
  fontWeightBold: "bold",
  lineHeight: 1.35,
  allowTransparency: true,
  allowProposedApi: true,   // unicode11: emoji take two cells
  cursorBlink: true,
  cursorStyle: "block",
  scrollback: 2000,
  theme: {
    background: "rgba(0,0,0,0)",
    foreground: "#3b2a6b", cursor: "#ff5cc8", cursorAccent: "#fffaf0",
    selectionBackground: "#ffe58a",
    // bright crayons, each still dark enough to read on the cream page
    black: "#3b2a6b", brightBlack: "#6b5e8c",
    red: "#e53935", brightRed: "#ff4d4d",
    green: "#2e9d00", brightGreen: "#3ec300",
    yellow: "#c98a00", brightYellow: "#e6a100",
    blue: "#1279d6", brightBlue: "#1fa0ff",
    magenta: "#c2189b", brightMagenta: "#ff5cc8",
    cyan: "#00897b", brightCyan: "#00a99a",
    white: "#7a6f99", brightWhite: "#3b2a6b",
  },
});
const fit = new FitAddon();
term.loadAddon(fit);
term.loadAddon(new Unicode11Addon());
term.unicode.activeVersion = "11";
const el = document.getElementById("term")!;
const scrollbar = overlayScrollbar(el);

let mode: "kid" | "real" = "kid";
const toy = new ToyShell(term, grownUp);
let ptyReady = false;

async function main() {
  // both faces before xterm measures its cell, or it measures a fallback font
  await Promise.all(["", "bold "].map((w) => document.fonts.load(`${w}20px "Comic Mono"`).catch(() => [])));
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
  document.getElementById("mascot")!.addEventListener("click", () => {
    sfx.boing(); mascot("happy"); say("Hee hee, that tickles!", 2000);
  });
  showMute();
  toy.start();
  term.focus();
  if (TAURI) watchTrafficLights();
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

function grownUp() {
  openParent(mode === "real", (what: Changed) => {
    if (what === "mode") switchMode();
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
    mode = "kid"; ptyReady = false;
    document.body.classList.remove("real");
    if (TAURI) await invoke("kill");
    toy.start();
  } else {
    mode = "real";
    document.body.classList.add("real");
    if (!TAURI) { term.write("(no real shell in browser preview)\r\n"); return; }
    const onData = new Channel<Uint8Array>();
    const dec = new TextDecoder();
    onData.onmessage = (bytes) => term.write(dec.decode(new Uint8Array(bytes), { stream: true }).replace(/\x1b\[([0-9;]*)m/g, remapSgr));
    await invoke("spawn", { cols: term.cols, rows: term.rows, onData });
    ptyReady = true;
  }
  term.focus();
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
