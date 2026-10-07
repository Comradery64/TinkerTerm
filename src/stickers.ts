/**
 * Stickers: each one is its own tiny transparent window attached to the main window, so a kid
 * can put it anywhere on the screen and it rides along when the main window moves.
 * Drag to move, scroll to resize, double-click to peel off. Remembered between launches.
 */
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { sfx } from "./fx";

export const STICKERS = ["⭐", "🌈", "🦄", "🦖", "🚀", "🐱", "🐶", "🍕", "🍩", "🌸", "🦋", "🐙",
  "🚒", "🏆", "💎", "👑", "🎈", "🐸", "🌻", "🍓", "⚽", "🎸", "🛸", "🐼"];

/** dx/dy: offset from the main window's top-left, logical px; s: size multiplier. */
type Sticker = { id: number; e: string; dx: number; dy: number; s: number };
const BASE = 110;
const TAURI = "__TAURI_INTERNALS__" in window;

// own key, not prefs: sticker windows write here too and must not clobber other settings
const load = (): Sticker[] => { try { return JSON.parse(localStorage.getItem("stickers") ?? "[]"); } catch { return []; } };
const save = (all: Sticker[]) => localStorage.setItem("stickers", JSON.stringify(all));
function update(id: number, f: (s: Sticker) => void) {
  const all = load(), st = all.find((s) => s.id === id);
  if (st) { f(st); save(all); }
}

async function open(st: Sticker) {
  const main = getCurrentWindow();
  const pos = (await main.outerPosition()).toLogical(await main.scaleFactor());
  new WebviewWindow(`sticker-${st.id}`, {
    url: `index.html?sticker=${st.id}`,
    parent: main,                  // macOS child window: moves with the main window
    x: pos.x + st.dx, y: pos.y + st.dy, width: BASE * st.s, height: BASE * st.s,
    transparent: true, decorations: false, shadow: false, resizable: false,
    focus: false, skipTaskbar: true, alwaysOnTop: false,
  });
}

/** Main window, at launch: put every saved sticker back. */
export function restoreStickers() { if (TAURI) load().forEach(open); }

export async function addSticker(e: string) {
  if (!TAURI) return;
  const main = getCurrentWindow();
  const size = (await main.innerSize()).toLogical(await main.scaleFactor());
  const st: Sticker = { id: Date.now(), e, s: 1,
    dx: size.width * (0.3 + Math.random() * 0.4) - BASE / 2, dy: size.height * (0.3 + Math.random() * 0.4) - BASE / 2 };
  save([...load(), st]);
  open(st);
  sfx.boing();
}

/** The tray of stickers to choose from. */
export function toggleTray(onClose: () => void) {
  const old = document.getElementById("tray");
  if (old) { old.remove(); onClose(); return; }
  const tray = document.createElement("div");
  tray.id = "tray";
  for (const e of STICKERS) {
    const b = document.createElement("button");
    b.textContent = e;
    b.addEventListener("click", () => addSticker(e));
    tray.appendChild(b);
  }
  document.getElementById("page")!.appendChild(tray);
}

/** Draw an emoji with a white die-cut edge, on canvas: no CSS filter, which streaks on transparent windows. */
function dieCut(e: string, px: number): HTMLCanvasElement {
  const dpr = devicePixelRatio, size = Math.round(px * dpr), edge = 5 * dpr;
  const mk = () => { const c = document.createElement("canvas"); c.width = c.height = size; return c; };
  const art = mk(), a = art.getContext("2d")!;
  a.font = `${size * 0.66}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  a.textAlign = "center"; a.textBaseline = "middle";
  a.fillText(e, size / 2, size / 2 + size * 0.04);
  const out = mk(), o = out.getContext("2d")!;
  for (let i = 0; i < 24; i++) {   // stamp the shape in a ring, then paint the ring white
    const t = (i / 24) * Math.PI * 2;
    o.drawImage(art, Math.cos(t) * edge, Math.sin(t) * edge);
  }
  o.globalCompositeOperation = "source-in";
  o.fillStyle = "#fff"; o.fillRect(0, 0, size, size);
  o.globalCompositeOperation = "source-over";
  o.drawImage(art, 0, 0);
  out.style.width = out.style.height = "100%";
  return out;
}

/** This webview is a sticker window: show the sticker and handle drag, resize, peel. */
export function runSticker(id: number) {
  const st = load().find((s) => s.id === id);
  const win = getCurrentWindow();
  if (!st) { win.close(); return; }
  document.body.className = "sticker-window";
  document.body.replaceChildren(dieCut(st.e, BASE * 3));   // draw big once, scale down crisply

  document.addEventListener("mousedown", (e) => { if (e.button === 0 && e.detail === 1) win.startDragging(); });
  document.addEventListener("dblclick", () => {
    save(load().filter((s) => s.id !== id));
    sfx.back();
    setTimeout(() => win.close(), 150);
  });
  document.addEventListener("wheel", (e) => {
    st.s = Math.min(3, Math.max(0.5, st.s - e.deltaY * 0.002));
    win.setSize(new LogicalSize(BASE * st.s, BASE * st.s));
    update(id, (s) => (s.s = st.s));
  });
  // remember where it was dropped, relative to the main window
  win.onMoved(async ({ payload }) => {
    const main = await WebviewWindow.getByLabel("main");
    if (!main) return;
    const k = await win.scaleFactor();
    const at = payload.toLogical(k), m = (await main.outerPosition()).toLogical(k);
    update(id, (s) => { s.dx = at.x - m.x; s.dy = at.y - m.y; });
  });
}
