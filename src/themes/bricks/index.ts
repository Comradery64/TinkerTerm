/**
 * Brick Manual (6-9): the page of a building-instruction booklet for interlocking plastic bricks.
 * Every command is a numbered build step; things you make show up in a "parts needed" callout.
 * Sidekick is Bolt, an original blocky builder with a hard hat and a hammer.
 */
import type { ThemeDef } from "../../theme-api";
import { tone, noise } from "../../fx";
import "./style.css";

const ESC = "\x1b[";
const RESET = `${ESC}0m`;
const rgb = (hex: string) => `${ESC}38;2;${parseInt(hex.slice(1, 3), 16)};${parseInt(hex.slice(3, 5), 16)};${parseInt(hex.slice(5, 7), 16)}m`;
const B = `${ESC}1m`;
const INK = "#1d2433", RED = "#c8141c", BLUE = "#0a55b8", GREEN = "#1f7a3e";

/** Plastic colors: [face, top highlight, shadow side]. */
const PLASTIC: Record<string, [string, string, string]> = {
  red: ["#d8232a", "#f2575b", "#9c1218"], blue: ["#1061c9", "#4b8ff0", "#073f8a"],
  yellow: ["#f8c81c", "#ffe36b", "#c4950a"], green: ["#1f9a4b", "#4fc576", "#11693a"],
  orange: ["#f37d1a", "#ffa65a", "#b85808"], white: ["#f4f4f0", "#ffffff", "#c9c8c0"],
};

const P = 28;   // stud pitch in px, so all strips line up

/** A side-view brick n studs long with its top-left stud at (x, 0); body is h tall. */
function sideBrick(x: number, n: number, c: string, h: number, y = 0): string {
  const [f, hi, sh] = PLASTIC[c];
  let s = "";
  for (let i = 0; i < n; i++) {
    const sx = x + i * P + 7;
    s += `<rect x="${sx}" y="${y + 1}" width="14" height="7" rx="1.5" fill="${f}"/>`
      + `<rect x="${sx + 9}" y="${y + 1}" width="5" height="7" fill="${sh}" opacity=".55"/>`
      + `<rect x="${sx + 2}" y="${y + 2}" width="3" height="5" rx="1" fill="${hi}" opacity=".8"/>`;
  }
  const w = n * P, by = y + 7;
  return s + `<rect x="${x + 0.5}" y="${by}" width="${w - 1}" height="${h}" rx="2" fill="${f}" stroke="${sh}"/>`
    + `<rect x="${x + 2}" y="${by + 1.5}" width="${w - 4}" height="3" rx="1.5" fill="${hi}" opacity=".85"/>`
    + `<rect x="${x + 2}" y="${by + h - 5}" width="${w - 4}" height="4" fill="${sh}" opacity=".6"/>`
    + `<rect x="${x + w - 6}" y="${by + 3}" width="4" height="${h - 7}" fill="${sh}" opacity=".35"/>`;
}

const svgUrl = (w: number, h: number, body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)}")`;

/** Horizontal course of bricks: repeats every 12 studs. */
const ROW = (() => {
  const run: [number, string][] = [[4, "red"], [2, "blue"], [3, "yellow"], [2, "green"], [1, "orange"]];
  let x = 0, s = "";
  for (const [n, c] of run) { s += sideBrick(x, n, c, 26); x += n * P; }
  return svgUrl(x, 34, s);
})();
/** Vertical column of 1x1 bricks stacked on each other. */
const COLUMN = (() => {
  const cs = ["blue", "yellow", "red", "green", "white", "orange"];
  return svgUrl(P, cs.length * 30, cs.map((c, i) => sideBrick(0, 1, c, 22, i * 30)).join(""));
})();

/** Isometric brick icon (n studs by 2), the kind drawn in a parts box. */
function isoBrick(n: number, c: string): string {
  const [f, hi, sh] = PLASTIC[c];
  const u = 9, h = 11;
  const ex = [u * 0.87, u * 0.5], ey = [-u * 0.87, u * 0.5];
  const pt = (a: number, b: number, d = 0) => [a * ex[0] + b * ey[0], a * ex[1] + b * ey[1] + d];
  const poly = (ps: number[][], fill: string) => `<polygon points="${ps.map((p) => p.join(",")).join(" ")}" fill="${fill}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
  let s = poly([pt(0, 0), pt(n, 0), pt(n, 2), pt(0, 2)], hi)
    + poly([pt(0, 2), pt(n, 2), pt(n, 2, h), pt(0, 2, h)], f)
    + poly([pt(n, 0), pt(n, 2), pt(n, 2, h), pt(n, 0, h)], sh);
  for (let j = 0; j < 2; j++) for (let i = 0; i < n; i++) {
    const [cx, cy] = pt(i + 0.5, j + 0.5);
    s += `<path d="M${cx - 3.4} ${cy} v-3 a3.4 1.9 0 0 1 6.8 0 v3 a3.4 1.9 0 0 1 -6.8 0z" fill="${f}" stroke="${INK}" stroke-width="1"/>`
      + `<ellipse cx="${cx}" cy="${cy - 3}" rx="3.4" ry="1.9" fill="${hi}" stroke="${INK}" stroke-width="1"/>`;
  }
  const minX = -2 * u * 0.87 - 2, w = (n + 2) * u * 0.87 + 4, top = -6, ht = (n + 2) * u * 0.5 + h + 8;
  return `<svg viewBox="${minX} ${top} ${w} ${ht}" width="${w * 1.4}" height="${ht * 1.4}">${s}</svg>`;
}

const COLORS = Object.keys(PLASTIC);
/** Same command, same parts: a tiny hash so "cat" always needs the same bricks. */
function partsFor(cmd: string): [number, string, number][] {
  let hsh = 7;
  for (const ch of cmd) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
  const k = 1 + (hsh % 3);
  return Array.from({ length: k }, (_, i) => {
    const v = (hsh >>> (i * 5)) & 1023;
    return [[1, 2, 3, 4][v % 4], COLORS[(v >> 2) % COLORS.length], 1 + ((v >> 5) % 3)];
  });
}

/** Snap: a hard plastic click (noise) with a short pitched knock under it. */
const click = (at: number, vol = 0.22, hz = 3800, pitch = 1700) => {
  noise(at, 0.022, vol, hz);
  tone(pitch, at, 0.03, "square", 0.035);
};

const theme: ThemeDef = {
  key: "bricks",
  label: "Brick Manual",
  ages: "6-9",
  blurb: "a building-instruction booklet: every command is a build step",
  order: 20,
  fontFamily: `"bricks-mono", "Menlo", monospace`,
  fontSize: 20,
  lineHeight: 1.3,
  cursorStyle: "block",
  palette: [RED, BLUE, GREEN, "#c25400", "#6a3d9a", "#00727a", "#946600"],
  xterm: {
    background: "rgba(0,0,0,0)", foreground: INK, cursor: RED, cursorAccent: "#fff", selectionBackground: "#ffe36b",
    black: INK, brightBlack: "#5a6273", red: RED, brightRed: "#e0301e", green: GREEN, brightGreen: "#268a47",
    yellow: "#946600", brightYellow: "#a87700", blue: BLUE, brightBlue: "#1c6fd8", magenta: "#6a3d9a", brightMagenta: "#8a4fbf",
    cyan: "#00727a", brightCyan: "#00808a", white: "#5a6273", brightWhite: INK,
  },
  voice: { id: "am_michael", speed: 1, chatty: false },
  words: {
    intro: (name) => [
      `${B}${rgb(RED)}BUILD MANUAL${RESET}${rgb("#5a6273")}  ·  set 6-9  ·  1 builder${name ? `: ${name}` : ""}`,
      `Each command is one step. Type it, press ${B}${rgb(BLUE)}Enter${RESET}, and it snaps on.`,
      `Start with ${B}${rgb(GREEN)}help${RESET} for the parts list, or try ${B}${rgb(GREEN)}cat${RESET}.`,
    ],
    greet: (name) => name ? `Hi ${name}! Bricks ready. Let's build.` : "Bricks ready. Let's build!",
    prompt: () => `${B}${rgb(RED)}▶ ${RESET}`,
    unknown: (raw, idea) => `"${raw}": that part isn't in the set yet.\nTry: ${idea}`,
    helpTitle: "PARTS LIST: commands in this set",
    tada: (label) => `${label} open. Step complete!`,
  },
  sounds: {
    key(ch) { click(0, 0.2, 3200 + (ch.charCodeAt(0) % 8) * 180, 1500 + (ch.charCodeAt(0) % 5) * 90); },
    back() { noise(0, 0.03, 0.18, 1600); tone(900, 0, 0.05, "square", 0.03); tone(600, 0.04, 0.05, "square", 0.025); },
    /** Two bricks snapping together, then a small proud chord. */
    yay() {
      click(0, 0.28, 2600, 700); click(0.07, 0.35, 4200, 1100);
      [0, 4, 7].forEach((s, i) => tone(392 * 2 ** (s / 12), 0.14 + i * 0.06, 0.18, "triangle", 0.1));
    },
    /** A bin of loose bricks given a shake: lots of uneven little clatters. */
    hmm() {
      for (let i = 0; i < 16; i++) noise(i * 0.028 + Math.random() * 0.02, 0.03, 0.08 + Math.random() * 0.12, 1800 + Math.random() * 3500);
      tone(220, 0.05, 0.25, "triangle", 0.05);
    },
    sparkle() { for (let i = 0; i < 7; i++) click(i * 0.05, 0.12, 4000 + i * 300, 1400 + i * 180); },
    boing() { tone(160, 0, 0.12, "square", 0.06); click(0.11, 0.3, 2400, 500); click(0.17, 0.15, 3000, 800); },
  },
  chrome: `
      <div class="bricks-row top" style='background-image:${ROW}'></div>
      <div class="bricks-row bottom" style='background-image:${ROW}'></div>
      <div class="bricks-col left" style='background-image:${COLUMN}'></div>
      <div class="bricks-col right" style='background-image:${COLUMN}'></div>
      <div id="bricks-title"><b>BUILD MANUAL</b><span>TinkerTerm set · 6-9</span></div>
      <div id="bricks-step"><small>STEP</small><b>1</b><i class="ok">✓</i><i class="no">?</i></div>
      <div id="bricks-parts"><small>PARTS NEEDED</small><div class="list"></div></div>
      <div id="bricks-pageno">1</div>
`,
  sidekick: `
        <svg viewBox="0 0 140 160">
          <g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
            <g class="legs">
              <rect x="50" y="128" width="19" height="24" rx="2" fill="#1061c9"/>
              <rect x="71" y="128" width="19" height="24" rx="2" fill="#1061c9"/>
              <rect x="47" y="148" width="23" height="8" rx="3" fill="#3a3f4b"/>
              <rect x="70" y="148" width="23" height="8" rx="3" fill="#3a3f4b"/>
            </g>
            <rect x="46" y="118" width="48" height="13" rx="2" fill="#073f8a"/>
            <g class="arm l"><rect x="33" y="82" width="13" height="32" rx="6" fill="#f37d1a"/><circle cx="39.5" cy="117" r="7" fill="#f6cf9f"/></g>
            <rect x="52" y="74" width="12" height="7" rx="1.5" fill="#f37d1a"/>
            <rect x="76" y="74" width="12" height="7" rx="1.5" fill="#f37d1a"/>
            <rect x="44" y="79" width="52" height="42" rx="4" fill="#f37d1a"/>
            <path d="M44 104 h52" fill="none" stroke-width="2"/>
            <rect x="50" y="104" width="40" height="8" fill="#8a5a2b" stroke-width="2"/>
            <rect x="54" y="88" width="10" height="13" rx="1" fill="#ffe36b" stroke-width="2"/>
            <g class="arm r">
              <rect x="97" y="106" width="5" height="28" rx="1.5" fill="#8a5a2b" stroke-width="2"/>
              <rect x="89" y="128" width="22" height="10" rx="2" fill="#9aa3ad"/>
              <rect x="94" y="82" width="13" height="32" rx="6" fill="#f37d1a"/>
              <circle cx="100.5" cy="117" r="7" fill="#f6cf9f"/>
            </g>
            <g class="head">
              <rect x="62" y="68" width="16" height="9" fill="#f6cf9f"/>
              <rect x="51" y="34" width="38" height="38" rx="9" fill="#f6cf9f"/>
              <g class="hat">
                <path d="M47 38 q0 -22 23 -22 q23 0 23 22 z" fill="#f8c81c"/>
                <path d="M70 17 v20" fill="none" stroke-width="2"/>
                <rect x="41" y="36" width="58" height="7" rx="3.5" fill="#f8c81c"/>
              </g>
              <g class="eyes"><circle cx="63" cy="54" r="3.3" fill="${INK}" stroke="none"/><circle cx="77" cy="54" r="3.3" fill="${INK}" stroke="none"/></g>
              <path class="closed" d="M59 55 q4 3 8 0 M73 55 q4 3 8 0" fill="none" stroke-width="2.5" stroke-linecap="round"/>
              <path class="mouth smile" d="M62 62 q8 7 16 0" fill="none" stroke-width="2.5" stroke-linecap="round"/>
              <ellipse class="mouth ooh" cx="70" cy="64" rx="4" ry="5" fill="#9c1218"/>
              <path class="mouth hmm" d="M63 64 h14" fill="none" stroke-width="2.5" stroke-linecap="round"/>
            </g>
          </g>
          <text class="q" x="18" y="40">?</text>
          <g class="chip"><rect x="104" y="146" width="22" height="10" fill="#d8232a" stroke="${INK}" stroke-width="2"/><rect x="108" y="142" width="6" height="4" fill="#d8232a" stroke="${INK}" stroke-width="1.5"/><rect x="117" y="142" width="6" height="4" fill="#d8232a" stroke="${INK}" stroke-width="1.5"/></g>
        </svg>
        <div id="bricks-zzz">z<span>z</span><span>z</span></div>`,
  mount(chrome) {
    const stepEl = chrome.querySelector<HTMLElement>("#bricks-step")!;
    const num = stepEl.querySelector("b")!;
    const parts = chrome.querySelector<HTMLElement>("#bricks-parts")!;
    const list = parts.querySelector<HTMLElement>(".list")!;
    const pageno = chrome.querySelector<HTMLElement>("#bricks-pageno")!;
    let step = 1;
    /** Restart a CSS animation by removing the class and forcing a reflow. */
    const pop = (el: HTMLElement, cls: string) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

    const onEnter = () => {
      step++;
      num.textContent = String(step);
      stepEl.classList.remove("ok", "no");
      pop(stepEl, "pop");
      const page = 1 + Math.floor((step - 1) / 6);   // six steps to a page, like a real booklet
      if (pageno.textContent !== String(page)) { pageno.textContent = String(page); pop(pageno, "turn"); }
    };
    const onResult = (e: Event) => {
      const { kind, cmd } = (e as CustomEvent<{ kind: string; cmd: string }>).detail;
      stepEl.classList.add(kind === "unknown" ? "no" : "ok");
      if (kind === "unknown") {
        list.innerHTML = `<span class="missing">part not found</span>`;
      } else {
        list.innerHTML = partsFor(cmd).map(([n, c, q], i) =>
          `<span class="part" style="animation-delay:${i * 90}ms">${isoBrick(n, c)}<em>${q}x</em></span>`).join("");
      }
      pop(parts, "show");
    };
    window.addEventListener("tt:enter", onEnter);
    window.addEventListener("tt:result", onResult);
    return () => { window.removeEventListener("tt:enter", onEnter); window.removeEventListener("tt:result", onResult); };
  },
};
export default theme;
