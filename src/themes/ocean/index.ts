/**
 * Deep Sea Lab (8-12): the inside of a research submarine. The text sits on a curved instrument
 * display in a riveted hull; a porthole shows the sea getting darker as every command dives deeper,
 * a sonar pings each command, and Dr. Squiggs, an octopus scientist, assists.
 */
import type { ThemeDef } from "../../theme-api";
import { prefs } from "../../prefs";
import { tone, noise } from "../../fx";
import "./style.css";

const ESC = "\x1b[";
const rgb = (hex: string) => `${ESC}38;2;${parseInt(hex.slice(1, 3), 16)};${parseInt(hex.slice(3, 5), 16)};${parseInt(hex.slice(5, 7), 16)}m`;
const RESET = `${ESC}0m`;
const AQUA = "#5ff2d6", AMBER = "#ffd166", CORAL = "#ff8fa3";

// ---- sound: pitch sweeps (bubbles, sonar, whale song) need a gliding oscillator fx.tone lacks ----
let ac: AudioContext | undefined;
function sweep(f0: number, f1: number, at: number, len: number, type: OscillatorType = "sine", vol = 0.14, mid?: number) {
  ac ??= new AudioContext();
  const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (mid) o.frequency.exponentialRampToValueAtTime(mid, t + len * 0.45);
  o.frequency.exponentialRampToValueAtTime(f1, t + len);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + Math.min(0.03, len / 4));
  g.gain.exponentialRampToValueAtTime(0.001, t + len);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + len + 0.02);
}
/** Sonar ping with a faint echo off the sea floor. */
function ping() {
  if (!prefs.sound) return;
  tone(1320, 0, 0.9, "sine", 0.12); tone(1320, 0.42, 0.7, "sine", 0.035);
}

// ---- porthole ring bolts, laid out once ----
const bolts = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return `<circle cx="${(100 + 93 * Math.cos(a)).toFixed(1)}" cy="${(100 + 93 * Math.sin(a)).toFixed(1)}" r="4.2" />`;
}).join("");

const fish = (x: number, y: number, s = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0 q6 -5 12 0 q-6 5 -12 0 z M12 0 l5 -4 v8 z" />`;

/** Depth zones real oceanographers use; shown on the depth gauge. */
const ZONES: [number, string][] = [[200, "SUNLIGHT ZONE"], [1000, "TWILIGHT ZONE"], [4000, "MIDNIGHT ZONE"], [6000, "THE ABYSS"], [Infinity, "HADAL TRENCH"]];
const MAX = 10900;   // about the bottom of the deepest trench on Earth

const theme: ThemeDef = {
  key: "ocean",
  label: "Deep Sea Lab",
  ages: "8-12",
  blurb: "pilot a research sub to the bottom of the sea with Dr. Squiggs",
  order: 50,
  fontFamily: `"ocean-ShareTech", "SF Mono", Menlo, monospace`,
  fontSize: 21,
  lineHeight: 1.3,
  cursorStyle: "block",
  palette: [AQUA, AMBER, CORAL, "#8fd3ff", "#b4f06b", "#d6a8ff", "#ffb067"],
  xterm: {
    background: "rgba(0,0,0,0)", foreground: "#d4fff4", cursor: AQUA, cursorAccent: "#04201f", selectionBackground: "#1f6f73",
    black: "#0b3a40", brightBlack: "#5f9a99", red: "#ff6b81", brightRed: CORAL, green: "#7fe07a", brightGreen: "#b4f06b",
    yellow: "#ffc94a", brightYellow: AMBER, blue: "#6cc4ff", brightBlue: "#8fd3ff", magenta: "#c992ff", brightMagenta: "#d6a8ff",
    cyan: "#3fe0c5", brightCyan: AQUA, white: "#b6e6dd", brightWhite: "#f0fffb",
  },
  voice: { id: "bf_emma", speed: 1.0, chatty: false },
  chrome: `
    <div class="oc-rv t"></div><div class="oc-rv b"></div><div class="oc-rv l"></div><div class="oc-rv r"></div>
    <div class="oc-pipe"></div>

    <div class="oc-depth">
      <div class="oc-lbl">DEPTH</div>
      <div class="oc-num"><span class="oc-m">0010</span><small>m</small></div>
      <div class="oc-bar"><i></i><b></b></div>
      <div class="oc-zone">SUNLIGHT ZONE</div>
    </div>

    <div class="oc-sonar"><div class="oc-sweep"></div><div class="oc-sonar-lbl">SONAR</div></div>

    <div class="oc-port oc-shallow">
      <div class="oc-glass">
        <div class="oc-rays"><i></i><i></i><i></i></div>
        <svg class="oc-whale" viewBox="0 0 120 50"><path d="M4 26c10-14 40-20 64-16 18 3 30 10 36 16l12-12-2 16 6 10-14-6c-10 8-30 12-52 11C24 44 8 36 4 26z" /><path d="M40 38l-6 10 14-8z" /></svg>
        <svg class="oc-school" viewBox="0 0 80 40">${fish(4, 10)}${fish(22, 4, .9)}${fish(30, 18)}${fish(48, 10, .8)}${fish(12, 26, .9)}${fish(40, 30, .85)}${fish(60, 22, .9)}</svg>
        <svg class="oc-jelly" viewBox="0 0 40 70"><circle class="halo" cx="20" cy="16" r="19" /><path class="bell" d="M3 20 Q3 2 20 2 Q37 2 37 20 Q31 17 26 21 Q20 17 14 21 Q9 17 3 20z" /><path class="legs" d="M9 21q-3 12 2 24t-1 22M17 21q3 14 -1 26M24 21q-3 14 1 30M31 21q3 12 -2 22" /></svg>
        <svg class="oc-angler" viewBox="0 0 80 50"><path class="body" d="M10 28c4-14 22-18 36-12 6 3 10 8 12 12l10-8-2 12 4 10-12-6c-6 8-22 12-34 8-10-3-16-8-14-16z" /><path class="rod" d="M22 16 q4 -14 -10 -14" /><circle class="lure-halo" cx="11" cy="3" r="7" /><circle class="lure" cx="11" cy="3" r="2.6" /><path class="teeth" d="M10 30l4 4 3-4 3 4 3-4" /></svg>
        <div class="oc-bio"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="oc-snow"></div>
        <div class="oc-dark"></div>
        <div class="oc-glare"></div>
      </div>
      <svg class="oc-ring" viewBox="0 0 200 200"><circle class="rim" cx="100" cy="100" r="93" /><circle class="lip" cx="100" cy="100" r="85" /><g class="bolts">${bolts}</g></svg>
    </div>

    <div class="oc-screen"><div class="oc-scan"></div><div class="oc-flash"></div><div class="oc-bubbles"></div></div>

    <div class="oc-panel">
      <div><span>PRESSURE</span><b class="oc-p">2 atm</b></div>
      <div><span>WATER</span><b class="oc-t">20 &deg;C</b></div>
      <div><span>SPECIMENS</span><b class="oc-s">000</b></div>
      <div class="oc-leds"><i></i><i></i><i></i></div>
    </div>`,
  sidekick: `
    <svg viewBox="0 0 140 150">
      <g class="ink"><circle cx="30" cy="70" r="16" /><circle cx="18" cy="52" r="12" /><circle cx="40" cy="48" r="10" /><circle cx="22" cy="88" r="11" /></g>
      <g class="arms skin-s" fill="none" stroke-width="11" stroke-linecap="round">
        <path class="arm a1" d="M42 86 q-18 10 -22 28 q-2 10 -12 10" />
        <path class="arm a2" d="M52 92 q-8 18 -6 32 q1 10 -8 14" />
        <path class="arm a3" d="M64 96 q-2 20 2 34 q2 8 -4 12" />
        <path class="arm a4" d="M78 96 q4 20 0 34 q-2 8 4 12" />
        <path class="arm a5" d="M90 92 q8 18 6 32 q-1 10 8 14" />
        <path class="arm wave" d="M98 84 q20 -2 26 -18 q4 -10 -2 -16" />
      </g>
      <path class="skin head" d="M70 8 C104 8 116 36 112 62 C109 82 96 96 70 96 C44 96 31 82 28 62 C24 36 36 8 70 8z" />
      <g class="spots"><circle cx="48" cy="34" r="4" /><circle cx="96" cy="40" r="3" /><circle cx="90" cy="24" r="2.5" /></g>
      <g class="goggles"><path d="M32 40 Q70 30 108 40" fill="none" stroke="#3d2a12" stroke-width="5" /><circle cx="56" cy="31" r="10" /><circle cx="84" cy="31" r="10" /><circle class="lens" cx="56" cy="31" r="6" /><circle class="lens" cx="84" cy="31" r="6" /></g>
      <g class="eyes"><ellipse cx="54" cy="60" rx="11" ry="12" fill="#fff" /><ellipse cx="86" cy="60" rx="11" ry="12" fill="#fff" /><circle class="pupil" cx="55" cy="62" r="6" /><circle class="pupil" cx="87" cy="62" r="6" /><circle cx="57" cy="59" r="2" fill="#fff" /><circle cx="89" cy="59" r="2" fill="#fff" /></g>
      <path class="closed" d="M44 62 q10 6 20 0 M76 62 q10 6 20 0" />
      <path class="mouth smile" d="M62 80 q8 7 16 0" />
      <ellipse class="mouth ooh" cx="70" cy="82" rx="5" ry="6" />
      <path class="mouth hmm" d="M62 82 q4 -3 8 0 t8 0" />
    </svg>
    <div class="oc-zzz"><i></i><i></i><i></i></div>`,
  sounds: {
    key() { const f = 500 + Math.random() * 500; sweep(f, f * 1.9, 0, 0.09, "sine", 0.09); },
    back() { sweep(700, 300, 0, 0.1, "sine", 0.08); },
    yay() { sweep(260, 380, 0, 1.1, "sine", 0.13, 620); sweep(390, 520, 0.25, 0.9, "triangle", 0.05, 760); },
    hmm() { sweep(70, 52, 0, 0.9, "sawtooth", 0.05); noise(0, 0.8, 0.07, 220); noise(0.3, 0.4, 0.04, 420); },
    sparkle() { for (let i = 0; i < 7; i++) tone(1500 + Math.random() * 1600, i * 0.06, 0.35, "sine", 0.05); },
    boing() { sweep(180, 900, 0, 0.18, "sine", 0.14); sweep(900, 1400, 0.16, 0.05, "sine", 0.08); },
  },
  words: {
    intro: (name) => [
      `${rgb(AQUA)}DEEP SEA LAB${RESET}  ${rgb("#5f9a99")}// all systems online${RESET}`,
      `${name ? `Welcome aboard, ${rgb(AMBER)}${name}${RESET}. ` : ""}Every command takes us deeper. Try ${rgb(AMBER)}help${RESET} or ${rgb(AMBER)}cat${RESET}.`,
    ],
    greet: (name) => name ? `Welcome aboard, ${name}! Ready to dive?` : "Welcome aboard, scientist! Ready to dive?",
    prompt: (name) => `  ${name ? rgb("#8fd3ff") + name + " " : ""}${rgb(AQUA)}▸ ${RESET}`,
    unknown: (raw, idea) => `Unknown signal: "${raw}"... nothing on the scanner.\nTry this frequency: ${idea}`,
    helpTitle: "Lab commands:",
    tada: (label) => `${label}: hatch sealed, ballast flooding. Dive, dive, dive!`,
  },
  mount(chrome) {
    const $ = <T extends HTMLElement>(s: string) => chrome.querySelector(s) as T;
    const port = $(".oc-port"), sonar = $(".oc-sonar"), bubbles = $(".oc-bubbles"), flash = $(".oc-flash");
    let depth = 10, specimens = 0;

    const show = () => {
      const zone = ZONES.find(([z]) => depth < z)![1];
      $(".oc-m").textContent = String(Math.round(depth)).padStart(4, "0");
      $(".oc-zone").textContent = zone;
      // log scale: the first few hundred metres change the light the most, like the real sea
      const f = Math.log10(1 + depth) / Math.log10(1 + MAX);
      $(".oc-bar").style.setProperty("--oc-f", String(f));
      port.style.setProperty("--oc-dark", Math.min(0.9, depth / 900).toFixed(2));
      port.classList.toggle("oc-shallow", depth < 200);
      port.classList.toggle("oc-glow", depth >= 200);
      port.classList.toggle("oc-abyss", depth >= 1000);
      $(".oc-p").textContent = `${Math.round(1 + depth / 10)} atm`;
      const temp = depth < 200 ? 20 - depth * 0.06 : Math.max(2, 8 - (depth - 200) * 0.004);
      $(".oc-t").innerHTML = `${temp.toFixed(depth < 200 ? 0 : 1)} &deg;C`;
      $(".oc-s").textContent = String(specimens).padStart(3, "0");
    };

    const blip = (cls: string) => {
      const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 30;
      const b = document.createElement("i");
      b.className = `oc-blip ${cls}`;
      b.style.left = `${50 + r * Math.cos(a)}%`; b.style.top = `${50 + r * Math.sin(a)}%`;
      sonar.append(b);
      b.addEventListener("animationend", () => b.remove());
    };

    const onKey = () => {
      if (bubbles.childElementCount > 14) return;
      const b = document.createElement("i");
      const s = 5 + Math.random() * 9;
      b.style.cssText = `left:${4 + Math.random() * 92}%;width:${s}px;height:${s}px;animation-duration:${2.2 + Math.random() * 1.6}s`;
      bubbles.append(b);
      b.addEventListener("animationend", () => b.remove());
    };
    const onEnter = () => {
      depth = Math.min(MAX, depth + (25 + Math.random() * 45) * (1 + depth / 600));
      ping();
      const ring = document.createElement("i");
      ring.className = "oc-ping";
      sonar.append(ring);
      ring.addEventListener("animationend", () => ring.remove());
      show();
    };
    const onResult = (e: Event) => {
      const kind = (e as CustomEvent<{ kind: string }>).detail.kind;
      if (kind === "unknown") {
        blip("odd");
        flash.classList.remove("on"); void flash.offsetWidth; flash.classList.add("on");
      } else { specimens++; blip("ok"); show(); }
    };

    show();
    window.addEventListener("tt:key", onKey);
    window.addEventListener("tt:enter", onEnter);
    window.addEventListener("tt:result", onResult);
    return () => {
      window.removeEventListener("tt:key", onKey);
      window.removeEventListener("tt:enter", onEnter);
      window.removeEventListener("tt:result", onResult);
    };
  },
};
export default theme;
