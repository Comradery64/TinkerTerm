/**
 * Retro Arcade (9-14): the window is a 1980s cabinet. Neon marquee, side art, a CRT screen with a
 * score HUD, a control panel, and Blip, a little pixel robot whose CRT face shows his mood.
 */
import type { ThemeDef } from "../../theme-api";
import { tone, noise } from "../../fx";
import { prefs } from "../../prefs";
import "./style.css";

const ESC = "\x1b[";
const c = (hex: string) => `${ESC}38;2;${parseInt(hex.slice(1, 3), 16)};${parseInt(hex.slice(3, 5), 16)};${parseInt(hex.slice(5, 7), 16)}m`;
const R = `${ESC}0m`;
const CYAN = "#3cf0ff", PINK = "#ff4fd8", YEL = "#ffe14a", GRN = "#52ff7a", ORG = "#ff9a3c";

/** Square-wave blip: every arcade sound is built from these. */
const sq = (f: number, at: number, len: number, vol = 0.07) => tone(f, at, len, "square", vol);
const on = () => prefs.sound;

// ---- Blip, the pixel robot: drawn from rects on a 16x16 grid so it stays crisp at any size ----
type Px = [number, number, number, number, string];
const rects = (cls: string, px: Px[]) =>
  `<g class="${cls}">${px.map(([x, y, w, h, f]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`).join("")}</g>`;
const SHELL = "#8a7dff", DARK = "#2a1f5c", SCREEN = "#0b1630", LED = GRN, TIP = PINK;
const body: Px[] = [
  [7, 0, 2, 1, TIP], [7.5, 1, 1, 1, "#c9c3ff"],                         // antenna
  [2, 2, 12, 7, DARK], [3, 3, 10, 5, SCREEN],                            // head + CRT face
  [4, 9, 8, 5, SHELL], [5, 9, 6, 1, DARK],                               // body, neck shadow
  [5, 11, 2, 1, YEL], [8, 11, 1, 1, PINK], [10, 11, 1, 1, CYAN],         // chest lights
];
const armL: Px[] = [[2, 10, 2, 1, SHELL], [2, 11, 1, 2, SHELL]];
const armR: Px[] = [[12, 10, 2, 1, SHELL], [13, 11, 1, 2, SHELL]];
const armUp: Px[] = [[12, 10, 2, 1, SHELL], [13, 7, 1, 3, SHELL], [14, 6, 1, 1, SHELL]];
const legsA: Px[] = [[5, 14, 2, 2, DARK], [9, 14, 2, 2, DARK]];
const legsB: Px[] = [[4, 14, 2, 1, DARK], [4, 15, 1, 1, DARK], [10, 14, 2, 1, DARK], [11, 15, 1, 1, DARK]];
const faces: Record<string, Px[]> = {
  idle: [[5, 4, 1, 2, LED], [10, 4, 1, 2, LED], [6, 6, 4, 1, LED]],
  blink: [[5, 5, 1, 1, LED], [10, 5, 1, 1, LED], [6, 6, 4, 1, LED]],
  happy: [[4, 5, 1, 1, LED], [5, 4, 1, 1, LED], [6, 5, 1, 1, LED], [9, 5, 1, 1, LED], [10, 4, 1, 1, LED], [11, 5, 1, 1, LED], [5, 6, 6, 1, LED], [6, 7, 4, 1, LED]],
  think: [[6, 3, 1, 2, LED], [11, 3, 1, 2, LED], [7, 7, 3, 1, LED]],
  wow: [[4, 3, 2, 2, LED], [10, 3, 2, 2, LED], [7, 5, 2, 3, LED]],
  sleep: [[4, 5, 2, 1, "#2f7f4a"], [10, 5, 2, 1, "#2f7f4a"], [7, 7, 2, 1, "#2f7f4a"]],
};
const sprite = `
  <svg viewBox="-1 -1 18 18" shape-rendering="crispEdges">
    ${rects("bot", body)}${rects("arm l", armL)}${rects("arm r down", armR)}${rects("arm r up", armUp)}
    ${rects("legs a", legsA)}${rects("legs b", legsB)}
    ${Object.entries(faces).map(([k, p]) => rects(`face ${k}`, p)).join("")}
  </svg>
  <div id="arcade-think">?</div><div id="arcade-zzz">Z<span>z</span></div>`;

// ---- side art: bold geometric 80s panel, repeated down each side ----
const sideArt = (side: string) => `
  <svg class="arcade-side ${side}" aria-hidden="true">
    <defs><pattern id="arcade-tri-${side}" width="34" height="68" patternUnits="userSpaceOnUse">
      <path d="M0 0L34 17L0 34Z" fill="${PINK}"/><path d="M34 34L0 51L34 68Z" fill="${CYAN}"/>
      <rect x="14" y="27" width="6" height="6" fill="${YEL}"/>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#arcade-tri-${side})"/>
  </svg>`;

const theme: ThemeDef = {
  key: "arcade",
  label: "Retro Arcade",
  ages: "9-14",
  blurb: "neon cabinet, high scores, and Blip the pixel bot",
  order: 40,
  fontFamily: `"arcade-VT323", "Menlo", monospace`,
  fontWeight: "normal",   // VT323 has one weight
  fontSize: 28,
  lineHeight: 1.05,
  cursorStyle: "block",
  palette: [PINK, ORG, YEL, GRN, CYAN, "#b28cff", "#ff6b8a"],
  xterm: {
    background: "rgba(0,0,0,0)", foreground: "#d8fff0", cursor: GRN, cursorAccent: "#05060f", selectionBackground: "#3a2a7a",
    black: "#5a6080", brightBlack: "#8890b0", red: "#ff5a6e", brightRed: "#ff7f8f", green: GRN, brightGreen: "#8dffa8",
    yellow: YEL, brightYellow: "#fff08a", blue: "#5aa8ff", brightBlue: "#8cc4ff", magenta: PINK, brightMagenta: "#ff8ae6",
    cyan: CYAN, brightCyan: "#9af8ff", white: "#c8d0e8", brightWhite: "#ffffff",
  },
  voice: { id: "am_puck", speed: 1.05, chatty: false },
  chrome: `
    <div class="arcade-cab"></div>
    ${sideArt("l")}${sideArt("r")}
    <div class="arcade-marquee"><span class="arcade-title">TINKERTERM</span></div>
    <div class="arcade-bezel"><div class="arcade-glass"></div></div>
    <div class="arcade-hud">
      <span class="arcade-1up">1UP</span><b class="arcade-score">000000</b>
      <span>HI-SCORE</span><b class="arcade-hi">000000</b>
      <span>CREDITS</span><b class="arcade-credits">01</b>
    </div>
    <div class="arcade-scan"></div><div class="arcade-vignette"></div>
    <div class="arcade-panel">
      <div class="arcade-stick"><i></i></div>
      <div class="arcade-btns"><i></i><i></i><i></i></div>
      <div class="arcade-coin">INSERT<br>COIN</div>
    </div>
    <div class="arcade-pops"></div>`,
  sidekick: sprite,
  sounds: {
    key(ch) { if (on()) sq(440 * 2 ** (((ch.charCodeAt(0) * 5) % 12) / 12), 0, 0.05, 0.04); },
    back() { if (on()) { sq(330, 0, 0.04, 0.04); sq(220, 0.04, 0.05, 0.04); } },
    /** power-up arpeggio */
    yay() { if (on()) [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => sq(523.25 * 2 ** (s / 12), i * 0.045, 0.09)); },
    /** descending wah-wah */
    hmm() { if (on()) [0, -1, -2, -6].forEach((s, i) => sq(311 * 2 ** (s / 12), i * 0.18, i === 3 ? 0.5 : 0.16, 0.06)); },
    sparkle() { if (on()) for (let i = 0; i < 10; i++) sq(1046 * 2 ** (((i * 7) % 12) / 12), i * 0.03, 0.05, 0.035); },
    boing() { if (on()) { for (let i = 0; i < 8; i++) sq(200 + i * 90, i * 0.02, 0.03, 0.05); noise(0.16, 0.08, 0.06, 3000); } },
  },
  words: {
    intro: (name) => [
      `${c(YEL)}*** PLAYER ${name ? name.toUpperCase() : "ONE"} READY ***${R}`,
      `${c(CYAN)}TYPE A COMMAND, PRESS ${c(PINK)}ENTER${c(CYAN)}. EVERY HIT SCORES.${R}`,
      `${c(GRN)}TRY ${c(YEL)}help${c(GRN)}, ${c(YEL)}joke${c(GRN)} OR ${c(YEL)}2 + 3${c(GRN)}. CHAIN THEM FOR COMBOS.${R}`,
    ],
    greet: (name) => name ? `PLAYER ${name.toUpperCase()}: GAME ON!` : "GAME ON! PRESS ENTER TO PLAY",
    prompt: (name) => `${c(PINK)}${name ? name.toUpperCase() : "P1"}${c(CYAN)} ▶ ${R}`,
    unknown: (raw, idea) => `MISS! "${raw}" IS NOT A COMMAND.\nCONTINUE? TRY: ${idea}`,
    helpTitle: "COMMAND LIST - SELECT YOUR MOVE:",
    tada: (label) => `${label.toUpperCase()} LOADED. INSERT COIN!`,
  },
  mount(chrome) {
    const $ = (s: string) => chrome.querySelector(s) as HTMLElement;
    const KEY = "tt-arcade-hiscore";
    let score = 0, combo = 0, credits = 1, beat = false, hi = Number(localStorage.getItem(KEY)) || 0;
    const pad = (n: number, w = 6) => String(n).padStart(w, "0");
    const draw = () => {
      $(".arcade-score").textContent = pad(score);
      $(".arcade-hi").textContent = pad(Math.max(hi, score));
      $(".arcade-credits").textContent = pad(credits, 2);
    };
    /** A popup word over the screen: "COMBO x3!", "MISS", "NEW HIGH SCORE!" */
    const pop = (text: string, cls: string) => {
      const el = document.createElement("div");
      el.className = `arcade-pop ${cls}`; el.textContent = text;
      $(".arcade-pops").append(el);
      setTimeout(() => el.remove(), 1400);
    };
    const flash = (sel: string, cls: string, ms: number) => {
      const el = $(sel); el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), ms);
    };

    const onResult = (e: Event) => {
      const { kind } = (e as CustomEvent<{ kind: string }>).detail;
      if (kind === "unknown") {
        if (combo >= 3) pop("COMBO BROKEN", "miss");
        else pop("MISS", "miss");
        combo = 0;
        return;
      }
      combo++;
      const before = score;
      score += 100 * Math.min(combo, 8);
      if (Math.floor(score / 2000) > Math.floor(before / 2000)) { credits = Math.min(99, credits + 1); pop("EXTRA CREDIT!", "credit"); }
      if (combo >= 3) pop(`COMBO x${combo}!`, "combo");
      else pop(`+${100 * combo}`, "pts");
      if (score > hi) {
        if (!beat && hi > 0) { beat = true; setTimeout(() => pop("NEW HIGH SCORE!", "hi"), 450); }
        hi = score; localStorage.setItem(KEY, String(hi));
      }
      flash(".arcade-score", "bump", 300);
      draw();
    };
    // typing lights the panel buttons in turn
    let b = 0;
    const onKey = () => { b = (b + 1) % 3; flash(`.arcade-btns i:nth-child(${b + 1})`, "lit", 110); };
    const onEnter = () => flash(".arcade-stick", "push", 220);

    // coin drop on start
    if (on()) { sq(988, 0, 0.07, 0.06); sq(1319, 0.07, 0.35, 0.06); }
    draw();
    window.addEventListener("tt:result", onResult);
    window.addEventListener("tt:key", onKey);
    window.addEventListener("tt:enter", onEnter);
    return () => {
      window.removeEventListener("tt:result", onResult);
      window.removeEventListener("tt:key", onKey);
      window.removeEventListener("tt:enter", onEnter);
    };
  },
};
export default theme;
