/**
 * Paint Studio (5-9): a wacky 1990s-style kids' paint program. White canvas in a chunky beveled
 * app frame, a tool palette down the left, a color well along the bottom, and Squeezy, a paint
 * tube with googly eyes. Typing makes the active tool leave marks in the canvas margins;
 * `clear` blows them all up with a cartoon stick of dynamite.
 */
import type { ThemeDef } from "../../theme-api";
import { noise, tone } from "../../fx";
import { prefs } from "../../prefs";
import "./style.css";

const ESC = "\x1b[";
const rgb = (hex: string) => `${ESC}38;2;${parseInt(hex.slice(1, 3), 16)};${parseInt(hex.slice(3, 5), 16)};${parseInt(hex.slice(5, 7), 16)}m`;
const RESET = `${ESC}0m`;
const PAL = ["#d81b7f", "#e05a00", "#1b8a2e", "#1f5fd6", "#7b2ff2", "#c41e1e", "#00838f"];
const loud = (s: string) => [...s].map((c, i) => rgb(PAL[i % PAL.length]) + c).join("") + RESET;

// ---- sound: the theme owns its own AudioContext so it can do pitch glides (fx.tone can't) ----
let ac: AudioContext | undefined;
/** A pitch slide from f0 to f1, optionally wobbling (vibrato) like a slide whistle or a boing. */
function glide(f0: number, f1: number, at: number, len: number, type: OscillatorType = "sine", vol = 0.15, wobble = 0, rate = 14) {
  ac ??= new AudioContext();
  const t = ac.currentTime + at;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + len);
  if (wobble) {
    const l = ac.createOscillator(), lg = ac.createGain();
    l.frequency.value = rate; lg.gain.value = wobble;
    l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + len + 0.05);
  }
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, t + len);
  o.connect(g).connect(ac.destination);
  o.start(t); o.stop(t + len + 0.05);
}

type Tool = "pencil" | "brush" | "spray" | "stamp" | "eraser" | "dynamite";
const CYCLE: Tool[] = ["pencil", "brush", "spray", "stamp", "eraser"];
let tool: Tool = "stamp";

/** Each tool has its own key sound, so the kid hears which one is "in their hand". */
const keySound: Record<Tool, () => void> = {
  pencil: () => noise(0, 0.05, 0.1, 5200),
  brush: () => noise(0, 0.1, 0.12, 900),
  spray: () => noise(0, 0.14, 0.07, 7500),
  stamp: () => { glide(170, 55, 0, 0.13, "sine", 0.4); noise(0, 0.035, 0.14, 380); },
  eraser: () => glide(950, 1250, 0, 0.07, "square", 0.035),
  dynamite: () => noise(0, 0.08, 0.06, 3200),
};

function boom() {
  noise(0, 0.9, 0.55, 160); noise(0, 0.35, 0.3, 900);
  glide(130, 35, 0, 0.7, "sawtooth", 0.18);
}

// ---- the frame ----
const icons: Record<Tool, string> = {
  pencil: `<path d="M10 38 L14 26 L34 6 L42 14 L22 34 Z" fill="#ffd23f" stroke="#1d1a3a" stroke-width="3" stroke-linejoin="round"/><path d="M10 38 L14 26 L22 34 Z" fill="#f6c89a" stroke="#1d1a3a" stroke-width="3" stroke-linejoin="round"/><path d="M10 38 l2-6 4 4z" fill="#1d1a3a"/><path d="M30 10 l8 8" stroke="#ff5c8a" stroke-width="5"/>`,
  brush: `<path d="M38 6 L22 24" stroke="#b5651d" stroke-width="7" stroke-linecap="round"/><path d="M22 22 l4 4 -6 6 -4 -4z" fill="#c0c0d0" stroke="#1d1a3a" stroke-width="2.5"/><path d="M16 28 l4 4 c-2 8 -8 10 -14 9 c2-3 2-11 10-13z" fill="#1f5fd6" stroke="#1d1a3a" stroke-width="2.5" stroke-linejoin="round"/>`,
  spray: `<rect x="16" y="14" width="16" height="28" rx="4" fill="#2ec4b6" stroke="#1d1a3a" stroke-width="3"/><rect x="20" y="8" width="8" height="7" fill="#c0c0d0" stroke="#1d1a3a" stroke-width="2.5"/><g fill="#d81b7f"><circle cx="8" cy="8" r="2"/><circle cx="12" cy="4" r="1.6"/><circle cx="5" cy="13" r="1.5"/><circle cx="13" cy="10" r="1.4"/><circle cx="4" cy="5" r="1.3"/></g><path d="M18 24h12" stroke="#fff" stroke-width="3"/>`,
  stamp: `<path d="M18 6h12v12l8 6v8H10v-8l8-6z" fill="#b5651d" stroke="#1d1a3a" stroke-width="3" stroke-linejoin="round"/><rect x="8" y="32" width="32" height="6" fill="#d81b7f" stroke="#1d1a3a" stroke-width="3"/><path d="M24 40 l2 4 4 0 -3 2 1 4 -4-2 -4 2 1-4 -3-2 4 0z" fill="#ffd23f" stroke="#1d1a3a" stroke-width="1.5"/>`,
  eraser: `<path d="M6 30 L26 10 L42 26 L26 42 H14 Z" fill="#ff9ebd" stroke="#1d1a3a" stroke-width="3" stroke-linejoin="round"/><path d="M6 30 L16 20 L32 36 L26 42 H14 Z" fill="#fff" stroke="#1d1a3a" stroke-width="3" stroke-linejoin="round"/>`,
  dynamite: `<rect x="10" y="18" width="28" height="22" rx="3" fill="#e53935" stroke="#1d1a3a" stroke-width="3"/><path d="M10 25h28M10 33h28" stroke="#1d1a3a" stroke-width="2"/><path d="M24 18 C24 10 32 12 34 6" fill="none" stroke="#1d1a3a" stroke-width="2.5"/><path d="M34 2 l2 4 4 0 -3 3 1 4 -4 -2 -4 2 1-4 -3-3 4 0z" fill="#ffd23f" stroke="#e05a00" stroke-width="1.5"/>`,
};
const TOOLS: Tool[] = ["pencil", "brush", "spray", "stamp", "eraser", "dynamite"];
const SWATCHES = ["#1d1a3a", "#ffffff", "#e53935", "#ff8a00", "#ffd23f", "#7ed321", "#1b8a2e", "#2ec4b6",
  "#1f9bff", "#1f5fd6", "#7b2ff2", "#d81b7f", "#ff9ebd", "#b5651d"];
/** Marks use the bright swatches only: no black, white or brown blobs. */
const INKS = SWATCHES.slice(2, 13).filter((c) => c !== "#ffd23f");

const chrome = `
  <div id="paint-title"><span>Paint Studio</span><i>&nbsp;-&nbsp;my-masterpiece.pnt</i></div>
  <div id="paint-tools">${TOOLS.map((t) => `<div class="ptool" data-tool="${t}"><svg viewBox="0 0 48 48">${icons[t]}</svg></div>`).join("")}</div>
  <div id="paint-canvas"><div id="paint-marks"></div></div>
  <div id="paint-well"><div id="paint-now"><b></b></div>${SWATCHES.map((c) => `<div class="pswatch" style="--c:${c}"></div>`).join("")}</div>
  <div id="paint-boom"><svg viewBox="0 0 300 200"><path d="M150 8 L176 62 L238 30 L214 88 L292 100 L218 122 L250 186 L176 146 L150 196 L124 146 L50 186 L82 122 L8 100 L86 88 L62 30 L124 62 Z" fill="#ffd23f" stroke="#e53935" stroke-width="8" stroke-linejoin="round"/></svg><b>KA-BOOM!</b></div>
  <div id="paint-stick"><svg viewBox="0 0 48 48">${icons.dynamite}</svg></div>`;

// ---- marks the tools leave in the margins ----
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const STAMPS = [
  `<path d="M24 3 l6 13 14 1 -11 9 4 14 -13-8 -13 8 4-14 -11-9 14-1z"/>`,
  `<path d="M24 42 C4 28 4 10 15 9 C20 9 23 12 24 16 C25 12 28 9 33 9 C44 10 44 28 24 42z"/>`,
  `<circle cx="24" cy="24" r="18"/><circle cx="18" cy="20" r="2.6" fill="#fff"/><circle cx="30" cy="20" r="2.6" fill="#fff"/><path d="M15 28 q9 9 18 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  `<circle cx="24" cy="12" r="7"/><circle cx="36" cy="22" r="7"/><circle cx="31" cy="36" r="7"/><circle cx="17" cy="36" r="7"/><circle cx="12" cy="22" r="7"/><circle cx="24" cy="25" r="6" fill="#ffd23f"/>`,
  `<path d="M6 24 C14 10 32 10 38 24 C32 38 14 38 6 24z M38 24 l8 -9 v18z"/><circle cx="15" cy="21" r="2.5" fill="#fff"/>`,
];
function markSvg(t: Tool, c: string): string {
  if (t === "spray") {
    let dots = "";
    for (let i = 0; i < 22; i++) { const a = rnd(0, 6.28), r = 20 * Math.sqrt(Math.random()); dots += `<circle cx="${(24 + r * Math.cos(a)).toFixed(1)}" cy="${(24 + r * Math.sin(a)).toFixed(1)}" r="${rnd(0.8, 2.2).toFixed(1)}"/>`; }
    return `<svg viewBox="0 0 48 48" fill="${c}">${dots}</svg>`;
  }
  if (t === "pencil") {
    let d = `M4 ${rnd(14, 34).toFixed(0)}`;
    for (let x = 10; x <= 44; x += 6) d += ` Q${x - 3} ${rnd(4, 44).toFixed(0)} ${x} ${rnd(14, 34).toFixed(0)}`;
    return `<svg viewBox="0 0 48 48"><path d="${d}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  }
  if (t === "brush") {
    const d = `M6 ${rnd(10, 38).toFixed(0)} C${rnd(10, 22).toFixed(0)} ${rnd(0, 48).toFixed(0)} ${rnd(26, 38).toFixed(0)} ${rnd(0, 48).toFixed(0)} 42 ${rnd(10, 38).toFixed(0)}`;
    return `<svg viewBox="0 0 48 48"><path d="${d}" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" opacity=".85"/></svg>`;
  }
  const s = STAMPS[Math.floor(Math.random() * STAMPS.length)];
  return `<svg viewBox="0 0 48 48" fill="${c}">${s}</svg>`;
}

/** Random spot in the canvas that is not under the text, the sidekick, or a spot already painted. */
function spot(canvas: DOMRect, keepOut: DOMRect[], size: number): [number, number] | null {
  for (let i = 0; i < 30; i++) {
    const x = rnd(canvas.left + 4, canvas.right - size - 4), y = rnd(canvas.top + 4, canvas.bottom - size - 4);
    if (!keepOut.some((r) => x + size > r.left && x < r.right && y + size > r.top && y < r.bottom)) return [x, y];
  }
  return null;
}

function mount(root: HTMLElement) {
  const marks = root.querySelector<HTMLElement>("#paint-marks")!;
  const canvas = root.querySelector<HTMLElement>("#paint-canvas")!;
  const now = root.querySelector<HTMLElement>("#paint-now")!;
  const swatches = Array.from(root.querySelectorAll<HTMLElement>(".pswatch"));
  const boomEl = root.querySelector<HTMLElement>("#paint-boom")!;
  const stick = root.querySelector<HTMLElement>("#paint-stick")!;
  let ink = INKS[3];
  const timers: number[] = [];
  const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

  const pickTool = (t: Tool) => {
    tool = t;
    root.querySelectorAll(".ptool").forEach((b) => b.classList.toggle("on", (b as HTMLElement).dataset.tool === t));
  };
  const pickInk = (c: string) => {
    ink = c;
    now.style.setProperty("--c", c);
    swatches.forEach((s) => s.classList.toggle("on", s.style.getPropertyValue("--c") === c));
  };
  pickTool("stamp"); pickInk(ink);

  const paint = () => {
    const box = canvas.getBoundingClientRect();
    const term = document.getElementById("term")!.getBoundingClientRect();
    const out = [new DOMRect(term.left - 2, term.top - 2, term.width + 4, term.height + 4),
      document.getElementById("mascot")!.getBoundingClientRect(),
      ...Array.from(marks.children).map((m) => m.getBoundingClientRect())];
    const size = tool === "stamp" ? 30 : tool === "spray" ? 32 : 28;
    const at = spot(box, out, size);
    if (!at) { marks.firstElementChild?.remove(); return; }   // margins full: the oldest mark makes room
    const m = document.createElement("div");
    m.className = `pmark ${tool}`;
    m.style.cssText = `left:${at[0] - box.left}px;top:${at[1] - box.top}px;width:${size}px;height:${size}px;--r:${rnd(-25, 25).toFixed(0)}deg`;
    m.innerHTML = markSvg(tool, ink);
    marks.append(m);
  };

  const onKey = () => {
    const btn = root.querySelector<HTMLElement>(".ptool.on");
    btn?.classList.remove("used"); void btn?.offsetWidth; btn?.classList.add("used");
    if (tool === "eraser") {
      const all = marks.querySelectorAll(".pmark:not(.gone)");
      const m = all[Math.floor(Math.random() * all.length)] as HTMLElement | undefined;
      if (m) { m.classList.add("gone"); later(() => m.remove(), 400); }
    } else paint();
  };

  const kaboom = () => {
    pickTool("dynamite");
    stick.classList.remove("lit"); void stick.offsetWidth; stick.classList.add("lit");
    if (prefs.sound) noise(0, 0.65, 0.08, 3200);
    later(() => {
      if (prefs.sound) boom();
      boomEl.classList.remove("on"); void boomEl.offsetWidth; boomEl.classList.add("on");
      root.classList.add("shook");
      marks.querySelectorAll<HTMLElement>(".pmark").forEach((m) => {
        m.style.setProperty("--dx", `${rnd(-400, 400).toFixed(0)}px`);
        m.style.setProperty("--dy", `${rnd(-300, 100).toFixed(0)}px`);
        m.classList.add("blast");
      });
      later(() => { marks.replaceChildren(); root.classList.remove("shook"); }, 800);
      later(() => { boomEl.classList.remove("on"); stick.classList.remove("lit"); pickTool("pencil"); }, 1300);
    }, 650);
  };

  const onEnter = (e: Event) => {
    const raw = String((e as CustomEvent).detail.raw ?? "").trim().toLowerCase();
    if (raw === "clear" || raw === "clean") return kaboom();
    pickTool(CYCLE[(CYCLE.indexOf(tool) + 1) % CYCLE.length]);
    pickInk(INKS.filter((c) => c !== ink)[Math.floor(Math.random() * (INKS.length - 1))]);
  };

  const onResult = (e: Event) => {
    const kind = (e as CustomEvent).detail.kind;
    if (kind === "unknown") return;
    // a happy result: three celebration stamps
    const keep = tool; tool = "stamp";
    for (let i = 0; i < 3; i++) paint();
    tool = keep;
  };

  window.addEventListener("tt:key", onKey);
  window.addEventListener("tt:enter", onEnter);
  window.addEventListener("tt:result", onResult);
  return () => {
    window.removeEventListener("tt:key", onKey);
    window.removeEventListener("tt:enter", onEnter);
    window.removeEventListener("tt:result", onResult);
    timers.forEach(clearTimeout);
  };
}

const theme: ThemeDef = {
  key: "paint",
  label: "Paint Studio",
  ages: "5-9",
  blurb: "a goofy paint program, stamps, spray cans and dynamite",
  order: 15,
  fontFamily: `"Paint Fantasque", "Comic Mono", monospace`,
  fontSize: 24,
  lineHeight: 1.3,
  cursorStyle: "block",
  palette: PAL,
  xterm: {
    background: "rgba(0,0,0,0)", foreground: "#1d1a3a", cursor: "#d81b7f", cursorAccent: "#fff", selectionBackground: "#ffe58a",
    black: "#1d1a3a", brightBlack: "#5a5675", red: "#c41e1e", brightRed: "#e53935", green: "#1b7a2a", brightGreen: "#1b8a2e",
    yellow: "#a86a00", brightYellow: "#c27c00", blue: "#1f5fd6", brightBlue: "#2f6ff0", magenta: "#b0156a", brightMagenta: "#d81b7f",
    cyan: "#00747f", brightCyan: "#00838f", white: "#5a5675", brightWhite: "#1d1a3a",
  },
  voice: { id: "am_puck", speed: 1.05, chatty: true },
  chrome,
  sidekick: `
    <svg viewBox="0 0 120 170">
      <g stroke="#1d1a3a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        <g class="parm l"><path d="M32 88 Q14 86 10 68" fill="none"/><circle cx="10" cy="64" r="7" fill="#fff"/></g>
        <g class="parm r"><path d="M88 88 Q106 86 110 68" fill="none"/><circle cx="110" cy="64" r="7" fill="#fff"/></g>
        <ellipse class="pfoot" cx="44" cy="156" rx="11" ry="6" fill="#d81b7f"/>
        <ellipse class="pfoot" cx="76" cy="156" rx="11" ry="6" fill="#d81b7f"/>
        <path d="M44 146v6M76 146v6" fill="none"/>
        <path d="M34 42 Q60 32 86 42 L94 132 H26 Z" fill="#f4f3fb"/>
        <path d="M33 60 H87 L91 116 H29 Z" fill="#ffd23f" stroke-width="3"/>
        <path d="M33 60 H87 L88 72 H32 Z" fill="#d81b7f" stroke-width="3"/>
        <rect x="20" y="130" width="80" height="16" rx="3" fill="#d6d3e8"/>
        <path d="M28 134v8M36 134v8M44 134v8M52 134v8M60 134v8M68 134v8M76 134v8M84 134v8M92 134v8" stroke-width="2"/>
        <rect x="49" y="28" width="22" height="12" fill="#d6d3e8"/>
        <g class="pcap"><rect x="44" y="6" width="32" height="24" rx="5" fill="#e53935"/><path d="M52 10v16M60 10v16M68 10v16" stroke-width="2.5"/></g>
        <path d="M40 41 c-6 6 -4 14 -1 16 c3 2 5 -4 3 -8 c4 2 8 -2 6 -8z" fill="#1f9bff" stroke-width="2.5"/>
      </g>
      <g class="peyes">
        <circle cx="47" cy="90" r="13" fill="#fff" stroke="#1d1a3a" stroke-width="3.5"/>
        <circle cx="73" cy="90" r="13" fill="#fff" stroke="#1d1a3a" stroke-width="3.5"/>
        <circle class="ppupil a" cx="49" cy="93" r="6" fill="#1d1a3a"/>
        <circle class="ppupil b" cx="71" cy="93" r="6" fill="#1d1a3a"/>
      </g>
      <path class="pshut" d="M36 92 q11 7 22 0 M62 92 q11 7 22 0" fill="none" stroke="#1d1a3a" stroke-width="4" stroke-linecap="round"/>
      <path class="pmouth smile" d="M48 106 Q60 118 72 106 Z" fill="#c41e1e" stroke="#1d1a3a" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse class="pmouth ooh" cx="60" cy="110" rx="7" ry="6" fill="#c41e1e" stroke="#1d1a3a" stroke-width="3.5"/>
      <path class="pmouth hmm" d="M50 110 q5 -5 10 0 t10 0" fill="none" stroke="#1d1a3a" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="38" cy="104" r="4" fill="#ff8a00" opacity=".55"/><circle cx="82" cy="104" r="4" fill="#ff8a00" opacity=".55"/>
    </svg>
    <div id="paint-zzz">z<span>z</span><span>z</span></div>`,
  sounds: {
    key: () => keySound[tool](),
    back: () => { glide(1300, 760, 0, 0.07, "sawtooth", 0.05); glide(1100, 700, 0.07, 0.08, "sawtooth", 0.04); },
    // a goofy "yee-haw" whoop: up, down, and a bell
    yay: () => { glide(280, 950, 0, 0.2, "square", 0.07, 18, 16); glide(950, 420, 0.2, 0.32, "square", 0.07, 30, 12); tone(1568, 0.5, 0.4, "triangle", 0.12); tone(2093, 0.56, 0.4, "triangle", 0.09); },
    hmm: () => glide(1500, 480, 0, 0.55, "sine", 0.14, 25, 7),          // slide whistle down
    sparkle: () => { glide(480, 1700, 0, 0.45, "sine", 0.13, 20, 7); tone(2093, 0.45, 0.3, "triangle", 0.08); },
    boing: () => glide(150, 230, 0, 0.6, "sine", 0.28, 70, 17),         // the cartoon "oh no!" boing
  },
  words: {
    intro: () => [
      `${loud("Welcome to Paint Studio!")} I'm ${rgb("#d81b7f")}Squeezy${RESET}, the paint tube! 🎨`,
      `Type a word and smash ${rgb("#1f5fd6")}Enter${RESET}. Try ${rgb("#1b8a2e")}cat${RESET} or ${rgb("#1b8a2e")}help${RESET}. Then try ${rgb("#c41e1e")}clear${RESET}... KABOOM!`,
    ],
    greet: (name) => name ? `Howdy, ${name}! Smocks on, let's get messy!` : "Howdy, artist! Smocks on, let's get messy!",
    prompt: (name) => `  ${name ? loud(name) + " " : ""}${rgb("#d81b7f")}✎ ${RESET}`,
    unknown: (raw, idea) => `Oh no! "${raw}" fell in the paint bucket! SPLOOSH!\nI couldn't fish it out. Try: ${idea}`,
    helpTitle: "Squeezy's Big Bag of Tricks:",
    tada: (label) => `Yee-haw! ${label} is open! Grab a brush! 🖌️`,
  },
  mount,
};
export default theme;
