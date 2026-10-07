/**
 * Toy Workshop (4-7): the whole window is a chunky molded-plastic activity board. The text lives
 * on a recessed drawing-board screen; around it are toy controls that react to typing: gears turn
 * with every key, the big button squishes and the dial spins on Enter, an abacus bead slides for
 * every thing tried, and a light bulb lights up (or wobbles) with the answer. Bolt, a wind-up
 * robot with a key in his back, is the sidekick.
 */
import type { ThemeDef } from "../../theme-api";
import { tone, noise, note } from "../../fx";
import "./style.css";

const ESC = "\x1b[";
const rgb = (hex: string) => `${ESC}38;2;${parseInt(hex.slice(1, 3), 16)};${parseInt(hex.slice(3, 5), 16)};${parseInt(hex.slice(5, 7), 16)}m`;
const RESET = `${ESC}0m`;
const BOLD = `${ESC}1m`;
const PALETTE = ["#d62828", "#d35f00", "#1f8a3b", "#1565c0", "#7b3fa0", "#9a6a00", "#c2185b"];
const [RED, ORANGE, GREEN, BLUE, PURPLE] = PALETTE;

/** A gear outline: n trapezoid teeth around a hub, in a 100x100 box. */
function gear(n: number, color: string, dark: string) {
  const R = 48, r = 39, pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, s = Math.PI / n;
    for (const [rad, off] of [[r, -s * 0.55], [R, -s * 0.3], [R, s * 0.3], [r, s * 0.55]] as const)
      pts.push(`${(50 + rad * Math.cos(a + off)).toFixed(1)},${(50 + rad * Math.sin(a + off)).toFixed(1)}`);
  }
  return `<svg viewBox="0 0 100 100"><polygon points="${pts.join(" ")}" fill="${color}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="50" cy="50" r="27" fill="${dark}" opacity=".25"/><circle cx="50" cy="50" r="22" fill="${color}"/>
    <path d="M30 40 a24 24 0 0 1 22 -16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55"/>
    <circle cx="50" cy="50" r="8" fill="#fff8e0" stroke="${dark}" stroke-width="3"/></svg>`;
}

const BEADS = ["#e63946", "#ff8c1a", "#ffd23f", "#2dbf4e", "#2f80ed", "#e63946", "#ff8c1a", "#ffd23f", "#2dbf4e", "#2f80ed"];

// ---- sounds: plastic clacks, ratchet clicks, xylophone, a music box ----
let ac: AudioContext | undefined;
/** A wooden-bar xylophone note: a bright attack and a soft overtone. */
const xylo = (semi: number, at = 0, vol = 0.16) => { tone(note(semi), at, 0.35, "sine", vol); tone(note(semi) * 4, at, 0.06, "sine", vol * 0.3); };
let tick = 0;

const theme: ThemeDef = {
  key: "workshop",
  label: "Toy Workshop",
  ages: "4-7",
  blurb: "gears, buttons, beads, and Bolt the wind-up robot",
  order: 5,
  fontFamily: `"workshop-Sono", "Comic Mono", ui-monospace, monospace`,
  fontSize: 26,
  lineHeight: 1.3,
  cursorStyle: "block",
  palette: PALETTE,
  xterm: {
    background: "rgba(0,0,0,0)", foreground: "#22304a", cursor: "#e63946", cursorAccent: "#fff", selectionBackground: "#ffe27a",
    black: "#22304a", brightBlack: "#5b6478", red: "#c62828", brightRed: RED, green: "#1b7a33", brightGreen: GREEN,
    yellow: "#8a5d00", brightYellow: "#9a6a00", blue: "#0d4fa8", brightBlue: BLUE, magenta: "#8e2a8a", brightMagenta: PURPLE,
    cyan: "#00796b", brightCyan: "#00897b", white: "#5b6478", brightWhite: "#22304a",
  },
  voice: { id: "af_bella", speed: 0.95, chatty: true },
  sounds: {
    // a ratchet: tick-tock pairs, a tiny pitch change so a run of keys sounds like winding up
    key() { tick++; noise(0, 0.03, 0.22, tick % 2 ? 3200 : 2400); tone(tick % 2 ? 1400 : 1150, 0, 0.025, "square", 0.03); },
    back() { noise(0, 0.05, 0.25, 900); tone(220, 0, 0.06, "triangle", 0.1); },
    yay() { [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => { tone(note(s + 12), i * 0.11, 0.9, "sine", 0.09); tone(note(s + 24), i * 0.11, 0.25, "sine", 0.025); }); },
    hmm() { xylo(4); xylo(0, 0.18); xylo(-3, 0.36); },
    sparkle() { [0, 2, 4, 7, 9, 12, 14, 16].forEach((s, i) => xylo(s, i * 0.06, 0.1)); },
    boing() {
      ac ??= new AudioContext();
      const o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain(), t = ac.currentTime;
      o.type = "triangle"; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(420, t + 0.5);
      lfo.frequency.value = 18; lg.gain.setValueAtTime(60, t); lg.gain.exponentialRampToValueAtTime(1, t + 0.6);
      lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      o.connect(g).connect(ac.destination); o.start(t); lfo.start(t); o.stop(t + 0.7); lfo.stop(t + 0.7);
    },
  },
  words: {
    intro: (name) => [
      `${BOLD}${rgb(RED)}Beep ${rgb(ORANGE)}boop! ${rgb(BLUE)}I'm ${rgb(GREEN)}Bolt${RESET}${rgb(BLUE)}, the wind-up robot!${RESET} 🤖`,
      `${name ? `Hi ${rgb(PURPLE)}${name}${RESET}! ` : ""}Type a word, then press the big ${rgb(RED)}Enter${RESET} button.`,
      `Try ${rgb(BLUE)}cat${RESET}, ${rgb(BLUE)}say hi${RESET}, or ${rgb(BLUE)}help${RESET}!`,
    ],
    greet: (name) => name ? `Beep boop! Hi ${name}! Wind me up and let's build!` : "Beep boop! Wind me up and let's build!",
    prompt: () => `  ${rgb(RED)}●${rgb("#e0a800")}●${rgb(BLUE)}● ${RESET}`,
    unknown: (raw, idea) => `Clunk! My gears don't know "${raw}" yet. 🔧\nLet's try this one: ${idea}`,
    helpTitle: "Buttons to press:",
    tada: (label) => `Click, clack, ta-da! ${label}! 🔩`,
  },
  chrome: `
      <div id="ws-board"></div>
      <div id="ws-screen"></div>
      <div id="ws-gears">
        <div class="g g1">${gear(12, "#ffcf33", "#b88600")}</div>
        <div class="g g2">${gear(8, "#36b24a", "#1d6e2b")}</div>
        <div class="g g3">${gear(10, "#2f80ed", "#16509c")}</div>
      </div>
      <div id="ws-bulb">
        <div class="glow"></div>
        <svg viewBox="0 0 60 90">
          <path class="glass" d="M30 4 C12 4 4 18 4 30 C4 42 14 48 17 58 L43 58 C46 48 56 42 56 30 C56 18 48 4 30 4Z" stroke="#7a8aa6" stroke-width="3"/>
          <path class="wire" d="M22 56 L24 36 Q30 28 36 36 L38 56" fill="none" stroke="#9a6a00" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M14 22 Q18 12 28 10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>
          <rect x="16" y="58" width="28" height="22" rx="5" fill="#b8c2d6" stroke="#6b7690" stroke-width="3"/>
          <path d="M16 66 h28 M16 73 h28" stroke="#6b7690" stroke-width="2.5"/>
          <rect x="23" y="80" width="14" height="7" rx="3" fill="#4a5470"/>
        </svg>
      </div>
      <div id="ws-dial">
        <div class="face"><div class="pointer"></div></div>
        <span class="n n1">1</span><span class="n n2">2</span><span class="n n3">3</span><span class="n n4">4</span>
      </div>
      <div id="ws-button"><div class="cap"></div></div>
      <div id="ws-abacus">
        <div class="rod">${BEADS.map((c, i) => `<i style="--i:${i};--c:${c}"></i>`).join("")}</div>
        <div class="rod">${BEADS.map((c, i) => `<i style="--i:${i};--c:${BEADS[(i + 2) % 10]}"></i>`).join("")}</div>
      </div>
      <div class="ws-screw s3"></div><div class="ws-screw s4"></div>
`,
  sidekick: `
        <svg viewBox="0 0 150 160">
          <g class="key">
            <rect x="128" y="86" width="12" height="8" fill="#9a6a00"/>
            <path d="M138 90 c0 -22 20 -22 12 -6 c8 16 -12 16 -12 6 c0 22 -20 22 -12 6 c-8 -16 12 -16 12 -6z" transform="translate(4 0)" fill="#ffcf33" stroke="#9a6a00" stroke-width="3"/>
          </g>
          <path class="arm l" d="M30 92 q-18 6 -20 26" fill="none" stroke="#8a97b0" stroke-width="9" stroke-linecap="round"/>
          <circle class="arm l" cx="10" cy="120" r="8" fill="#e63946" stroke="#8c1c26" stroke-width="3"/>
          <path class="arm r" d="M120 92 q18 6 20 26" fill="none" stroke="#8a97b0" stroke-width="9" stroke-linecap="round"/>
          <circle class="arm r" cx="140" cy="120" r="8" fill="#e63946" stroke="#8c1c26" stroke-width="3"/>
          <rect x="44" y="140" width="20" height="16" rx="5" fill="#4a5470"/><rect x="86" y="140" width="20" height="16" rx="5" fill="#4a5470"/>
          <rect x="30" y="78" width="90" height="66" rx="16" fill="#2f80ed" stroke="#16509c" stroke-width="4"/>
          <rect x="36" y="82" width="78" height="10" rx="5" fill="#fff" opacity=".35"/>
          <rect x="50" y="100" width="50" height="30" rx="8" fill="#ffcf33" stroke="#b88600" stroke-width="3"/>
          <circle class="led a" cx="62" cy="115" r="5" fill="#e63946"/><circle class="led b" cx="75" cy="115" r="5" fill="#2dbf4e"/><circle class="led c" cx="88" cy="115" r="5" fill="#2f80ed"/>
          <g class="head">
            <path d="M75 22 v-12" stroke="#8a97b0" stroke-width="5"/>
            <circle class="ant" cx="75" cy="10" r="8" fill="#e63946" stroke="#8c1c26" stroke-width="3"/>
            <rect x="34" y="20" width="82" height="60" rx="20" fill="#e63946" stroke="#8c1c26" stroke-width="4"/>
            <rect x="42" y="25" width="60" height="9" rx="4.5" fill="#fff" opacity=".4"/>
            <rect x="26" y="40" width="10" height="20" rx="4" fill="#ffcf33" stroke="#b88600" stroke-width="3"/>
            <rect x="114" y="40" width="10" height="20" rx="4" fill="#ffcf33" stroke="#b88600" stroke-width="3"/>
            <g class="eyes">
              <circle cx="58" cy="48" r="12" fill="#fff" stroke="#8c1c26" stroke-width="3"/><circle cx="92" cy="48" r="12" fill="#fff" stroke="#8c1c26" stroke-width="3"/>
              <circle class="pupil" cx="59" cy="49" r="6" fill="#22304a"/><circle class="pupil" cx="93" cy="49" r="6" fill="#22304a"/>
              <circle cx="61" cy="46" r="2" fill="#fff"/><circle cx="95" cy="46" r="2" fill="#fff"/>
            </g>
            <path class="closed" d="M47 50 q11 7 22 0 M81 50 q11 7 22 0" fill="none" stroke="#22304a" stroke-width="4" stroke-linecap="round"/>
            <path class="mouth smile" d="M62 64 q13 10 26 0" fill="#fff" stroke="#22304a" stroke-width="3.5" stroke-linejoin="round"/>
            <ellipse class="mouth ooh" cx="75" cy="67" rx="7" ry="8" fill="#22304a"/>
            <path class="mouth hmm" d="M64 67 h22" stroke="#22304a" stroke-width="4" stroke-linecap="round"/>
          </g>
        </svg>
        <div id="ws-zzz">z<span>z</span><span>z</span></div>`,

  mount(chrome) {
    const q = <T extends HTMLElement>(s: string) => chrome.querySelector<T>(s)!;
    const g1 = q(".g1"), g2 = q(".g2"), g3 = q(".g3"), dial = q("#ws-dial .face"), btn = q("#ws-button"), bulb = q("#ws-bulb");
    const beads = Array.from(chrome.querySelectorAll<HTMLElement>("#ws-abacus i"));
    let turn = 0, spin = 0, count = 0, bulbTimer = 0;
    // gear ratios from the tooth counts (12, 8, 10) so they look meshed
    const gears = () => {
      g1.style.transform = `rotate(${turn}deg)`;
      g2.style.transform = `rotate(${-turn * 12 / 8 + 11}deg)`;
      g3.style.transform = `rotate(${turn * 12 / 10}deg)`;
    };
    const restart = (el: HTMLElement, cls: string) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
    const on: [string, (e: Event) => void][] = [
      ["tt:key", () => { turn += 15; gears(); }],
      ["tt:back", () => { turn -= 15; gears(); }],
      ["tt:enter", () => {
        restart(btn, "squish");
        spin += 90 + 45 * Math.floor(Math.random() * 4);
        dial.style.transform = `rotate(${spin}deg)`;
      }],
      ["tt:result", (e) => {
        const kind = (e as CustomEvent<{ kind: string }>).detail.kind;
        clearTimeout(bulbTimer);
        bulb.classList.remove("lit");
        if (kind === "unknown") { restart(bulb, "wobble"); return; }
        bulb.classList.add("lit");
        bulbTimer = window.setTimeout(() => bulb.classList.remove("lit"), 2200);
        // a bead slides across for every thing that worked: the top rod is ones, the bottom is tens
        count = (count + 1) % 100;
        beads.forEach((b, i) => b.classList.toggle("over", i < 10 ? i >= 10 - (count % 10) : i - 10 >= 10 - Math.floor(count / 10)));
      }],
    ];
    on.forEach(([n, f]) => window.addEventListener(n, f));
    return () => { clearTimeout(bulbTimer); on.forEach(([n, f]) => window.removeEventListener(n, f)); };
  },
};
export default theme;
