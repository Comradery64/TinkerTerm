/**
 * Stickers: big emoji a kid slaps anywhere, including hanging off the page into the window's
 * transparent margin. Drag to move, scroll to resize, drop on the bin to peel off. Remembered.
 */
import { prefs, savePrefs } from "./prefs";
import { sfx } from "./fx";

export const STICKERS = ["⭐", "🌈", "🦄", "🦖", "🚀", "🐱", "🐶", "🍕", "🍩", "🌸", "🦋", "🐙",
  "🚒", "🏆", "💎", "👑", "🎈", "🐸", "🌻", "🍓", "⚽", "🎸", "🛸", "🐼"];

export type Sticker = { e: string; x: number; y: number; s: number; r: number };   // x/y: fraction of the window

const layer = () => document.getElementById("stickers")!;
const bin = () => document.getElementById("bin")!;

export function drawStickers() {
  layer().replaceChildren(...prefs.stickers.map(make));
}

export function addSticker(e: string) {
  const st: Sticker = { e, x: 0.35 + Math.random() * 0.3, y: 0.3 + Math.random() * 0.3, s: 1, r: Math.round(Math.random() * 30 - 15) };
  prefs.stickers.push(st); savePrefs();
  const el = make(st);
  el.classList.add("slap");
  layer().appendChild(el);
  sfx.boing();
}

function place(el: HTMLElement, st: Sticker) {
  el.style.left = `${st.x * 100}%`; el.style.top = `${st.y * 100}%`;
  el.style.transform = `translate(-50%,-50%) rotate(${st.r}deg) scale(${st.s})`;
}

function make(st: Sticker): HTMLElement {
  const el = document.createElement("div");
  el.className = "sticker";
  el.textContent = st.e;
  place(el, st);

  el.addEventListener("pointerdown", (down) => {
    down.preventDefault();
    el.setPointerCapture(down.pointerId);
    el.classList.add("held");
    bin().classList.add("on");
    const move = (e: PointerEvent) => {
      st.x = Math.min(1, Math.max(0, e.clientX / innerWidth));
      st.y = Math.min(1, Math.max(0, e.clientY / innerHeight));
      place(el, st);
      bin().classList.toggle("hot", overBin(e));
    };
    const up = (e: PointerEvent) => {
      el.removeEventListener("pointermove", move);
      el.classList.remove("held");
      bin().classList.remove("on", "hot");
      if (overBin(e)) {
        prefs.stickers.splice(prefs.stickers.indexOf(st), 1);
        el.remove(); sfx.back();
      }
      savePrefs();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up, { once: true });
    el.addEventListener("lostpointercapture", () => bin().classList.remove("on", "hot"), { once: true });
  });
  el.addEventListener("wheel", (e) => {
    e.preventDefault();
    st.s = Math.min(3, Math.max(0.5, st.s - e.deltaY * 0.002));
    place(el, st); savePrefs();
  }, { passive: false });
  return el;
}

function overBin(e: PointerEvent) {
  const r = bin().getBoundingClientRect();
  return e.clientX >= r.left - 20 && e.clientX <= r.right + 20 && e.clientY >= r.top - 20 && e.clientY <= r.bottom + 20;
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
