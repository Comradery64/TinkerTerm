/**
 * Block World (6-9): a voxel sandbox seen through a window cut into the ground. Everything is drawn
 * on a pixel grid: block frame, square sun, pixel clouds, a day that slowly turns to night, and
 * Bloop the slime cube. Commands you run become items in a 9-slot hotbar (a collection to fill).
 */
import type { ThemeDef } from "../../theme-api";
import { tone, noise } from "../../fx";
import { prefs } from "../../prefs";
import "./style.css";

/** Pixel art from text rows: each char is a color key, "." is empty. Returns SVG rects. */
function pix(rows: string[], colors: Record<string, string>, s = 1, x0 = 0, y0 = 0) {
  let out = "";
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (colors[c]) out += `<rect x="${x0 + x * s}" y="${y0 + y * s}" width="${s}" height="${s}" fill="${colors[c]}"/>`;
  }));
  return out;
}

// 8x8 block textures, 3px per pixel = 24px blocks
const DIRT = { D: "#8a5a35", d: "#6b4426", k: "#a5703f" };
const TEX = {
  grass: pix(["GGGGGGGG", "GgGGgGGg", "gDgGDgGd", "DdDkDDdD", "DDDDdDkD", "kDdDDDDd", "DDDkDdDD", "dDDDDDkD"],
    { G: "#5fae3b", g: "#4a8f2c", ...DIRT }, 3),
  dirt: pix(["DDdDDkDD", "DkDDDDdD", "dDDDdDDD", "DDDkDDDk", "DdDDDdDD", "DDkDDDDD", "kDDDdDkD", "DDdDDDDd"], DIRT, 3),
  ore: pix(["SSsSSSSs", "SccSSsSS", "ScCSSSSS", "SSSSsSyS", "sSSSSyYS", "SSsSSSSS", "SSSScSSs", "sSSSCcSS"],
    { S: "#8d8d8d", s: "#707070", c: "#2e2e2e", C: "#4a4a4a", y: "#e5c04c", Y: "#b38a1e" }, 3),
};
const pattern = (id: string, body: string) =>
  `<pattern id="blocks-${id}" width="24" height="24" patternUnits="userSpaceOnUse">${body}<rect width="24" height="24" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1"/></pattern>`;

const CLOUD = pix(["..wwww....", ".wwwwwww..", "wwwwwwwwww", "ssssssssss"], { w: "#fff", s: "#dfe8f5" }, 8);

// Bloop: 16x14 slime cube. Faces are separate layers so each mood swaps them crisply.
const SLIME = { o: "#2d6a2a", b: "#6fd15b", l: "#a8f08f", d: "#4ea841" };
const BODY = pix([
  "..oooooooooooo..", ".oblllbbbbbbbbo.", "obllbbbbbbbbbbdo", "oblbbbbbbbbbbbdo", "obbbbbbbbbbbbbdo",
  "obbbbbbbbbbbbbdo", "obbbbbbbbbbbbbdo", "obbbbbbbbbbbbbdo", "obbbbbbbbbbbbbdo", "obbbbbbbbbbbbbdo",
  "obbbbbbbbbbbbbdo", "obddbbbbbbbbbddo", ".oddddddddddddo.", "..oooooooooooo..",
], SLIME, 1, 0, 2);
const FACE = { e: "#1d2b1d", w: "#fff", m: "#24401f", p: "#f28aa4", r: "#c94a5c" };
const face = (cls: string, rows: string[]) => `<g class="face ${cls}">${pix(rows, FACE, 1, 0, 2)}</g>`;
const SIDEKICK = `
  <svg viewBox="-2 -4 20 20" shape-rendering="crispEdges">
    <g class="blob">
      <g class="nub">${pix(["oo", "bo", "oo"], SLIME, 1, 15, 8)}</g>
      ${BODY}
      ${face("happy", ["", "", "", "", "", "....we....we....", "....ee....ee....", "....ee....ee....", "", "...p..m..m..p...", ".......mm......."])}
      ${face("wow", ["", "", "", "", "...www....www...", "...wee....wee...", "...wee....wee...", "", "", "......mmm.......", "......mrm.......", "......mmm......."])}
      ${face("think", ["", "", "", "", "", ".....we....we...", "....ww....ww....", "", "", "", "......mmmm......"])}
      ${face("sleep", ["", "", "", "", "", "", "", "....ee....ee....", "", "...p.......p....", ".......mm......."])}
    </g>
    <g class="ask">${pix(["yyy.", "...y", ".yy.", "....", ".y.."], { y: "#ffe14d" }, 1, 15, -4)}</g>
  </svg>
  <div id="blocks-zzz">Z<span>z</span><span>z</span></div>`;

/** Emoji for the hotbar. The shell's own table isn't exported, so the common ones live here. */
const ITEMS: Record<string, string> = {
  cat: "🐱", dog: "🐶", cow: "🐮", pig: "🐷", duck: "🦆", lion: "🦁", frog: "🐸", sheep: "🐑", horse: "🐴", owl: "🦉",
  bee: "🐝", monkey: "🐵", fish: "🐟", bird: "🐦", snake: "🐍", mouse: "🐭", dino: "🦖", dinosaur: "🦕", unicorn: "🦄",
  dragon: "🐉", bear: "🐻", elephant: "🐘", penguin: "🐧", bunny: "🐰", sun: "☀️", moon: "🌙", star: "⭐", rain: "🌧️",
  snow: "❄️", flower: "🌸", tree: "🌳", apple: "🍎", banana: "🍌", pizza: "🍕", cake: "🎂", icecream: "🍦", cookie: "🍪",
  car: "🚗", truck: "🚚", train: "🚂", plane: "✈️", rocket: "🚀", boat: "⛵", ball: "⚽", heart: "❤️", robot: "🤖",
  ghost: "👻", rainbow: "🌈", poop: "💩",
  help: "📖", "?": "📖", what: "📖", party: "🎉", confetti: "🎉", yay: "🎉", hooray: "🎉", dance: "🪩", boogie: "🪩",
  say: "💬", big: "💬", count: "🔢", abc: "🔤", alphabet: "🔤", joke: "🃏", roll: "🎲", dice: "🎲", time: "⏰",
  clock: "⏰", color: "🖍️", colour: "🖍️", crayon: "🖍️", theme: "🎨", look: "🎨", sticker: "⭐", stickers: "⭐",
  name: "📛", hi: "👋", hello: "👋", hey: "👋", hiya: "👋", bye: "🌙", goodbye: "🌙", night: "🌙", goodnight: "🌙",
  clear: "🧹", clean: "🧹", math: "🧮",
};

/** Draws an emoji tiny and hard-edged, then CSS scales it up with nearest-neighbour: instant pixel art. */
function pixelIcon(emoji: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 16;
  const g = c.getContext("2d")!;
  g.font = `13px "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(emoji, 8, 9);
  const img = g.getImageData(0, 0, 16, 16);
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] < 100 ? 0 : 255;
  g.putImageData(img, 0, 0);
  return c;
}

const on = () => prefs.sound;
const sq = (f: number, at: number, len: number, vol = 0.05) => tone(f, at, len, "square", vol);

const theme: ThemeDef = {
  key: "blocks",
  label: "Block World",
  ages: "6-9",
  blurb: "build in a pixel world, fill your hotbar with Bloop",
  order: 10,
  fontFamily: `"Blocks VT323", "Menlo", monospace`,
  fontWeight: "normal",   // VT323 has one weight
  fontSize: 30,
  lineHeight: 1.05,
  cursorStyle: "block",
  palette: ["#55ff55", "#ffff55", "#55ffff", "#ff55ff", "#ffaa00", "#ff7070", "#8fb8ff"],
  xterm: {
    background: "rgba(0,0,0,0)", foreground: "#ececec", cursor: "#ffff55", cursorAccent: "#1a1a1a", selectionBackground: "#4a6a2a",
    black: "#3a3a3a", brightBlack: "#9a9a9a", red: "#ff6060", brightRed: "#ff7070", green: "#55dd55", brightGreen: "#55ff55",
    yellow: "#ffcc33", brightYellow: "#ffff55", blue: "#7aa2ff", brightBlue: "#8fb8ff", magenta: "#ee66ee", brightMagenta: "#ff55ff",
    cyan: "#44dddd", brightCyan: "#55ffff", white: "#cfcfcf", brightWhite: "#ffffff",
  },
  voice: { id: "am_puck", speed: 1.05, chatty: false },
  chrome: `
    <div id="blocks-sky"><i class="stars"></i></div>
    <svg id="blocks-sun" viewBox="0 0 10 10" shape-rendering="crispEdges">${pix(
      ["..yyyyyy..", ".yYYYYYYy.", "yYYwwYYYYy", "yYwwYYYYYy", "yYYYYYYYYy", "yYYYYYYYYy", "yYYYYYYYYy", "yYYYYYYYYy", ".yYYYYYYy.", "..yyyyyy.."],
      { y: "#ffd23a", Y: "#fff27a", w: "#fffde0" })}</svg>
    <svg id="blocks-moon" viewBox="0 0 10 10" shape-rendering="crispEdges">${pix(
      ["..mmmmmm..", ".mMMMMMMm.", "mMMcMMMMMm", "mMMMMMcMMm", "mMMMMMMMMm", "mMcMMMMMMm", "mMMMMMcMMm", "mMMMMMMMMm", ".mMMMMMMm.", "..mmmmmm.."],
      { m: "#c9cfe6", M: "#eef1ff", c: "#b0b6cf" })}</svg>
    <svg class="blocks-cloud a" viewBox="0 0 80 32" shape-rendering="crispEdges">${CLOUD}</svg>
    <svg class="blocks-cloud b" viewBox="0 0 80 32" shape-rendering="crispEdges">${CLOUD}</svg>
    <svg id="blocks-frame" shape-rendering="crispEdges">
      <defs>${pattern("grass", TEX.grass)}${pattern("dirt", TEX.dirt)}${pattern("ore", TEX.ore)}</defs>
      <rect class="top" fill="url(#blocks-grass)" />
      <rect class="left" fill="url(#blocks-dirt)" />
      <rect class="right" fill="url(#blocks-dirt)" />
      <rect class="ground" fill="url(#blocks-grass)" />
      <rect class="deep" fill="url(#blocks-ore)" />
    </svg>
    <div id="blocks-panel"></div>
    <div id="blocks-hotbar"></div>
    <div id="blocks-toast"><b>Skill unlocked!</b><span></span></div>`,
  sidekick: SIDEKICK,
  sounds: {
    key() { noise(0, 0.035, 0.05, 1400 + Math.random() * 600); },
    back() { [0, 0.05, 0.1].forEach((t) => noise(t, 0.045, 0.12, 900 + Math.random() * 900)); },
    yay() { [523, 659, 784, 1047].forEach((f, i) => sq(f, i * 0.06, 0.09)); },
    hmm() { sq(330, 0, 0.12); sq(247, 0.12, 0.2); },
    sparkle() { [1568, 2093, 1760, 2637].forEach((f, i) => sq(f, i * 0.05, 0.07, 0.03)); },
    boing() { [196, 262, 330, 392, 523].forEach((f, i) => sq(f, i * 0.035, 0.05, 0.05)); },
  },
  words: {
    intro: (name) => [
      `\x1b[1;38;2;255;255;85mBLOCK WORLD\x1b[0m  \x1b[38;2;154;154;154mday 1`,
      `Welcome${name ? `, ${name}` : ", builder"}! Type a recipe and press \x1b[38;2;85;255;85mEnter\x1b[0m to craft it.`,
      `Try \x1b[38;2;85;255;255mcat\x1b[0m, \x1b[38;2;85;255;255mparty\x1b[0m or \x1b[38;2;85;255;255mhelp\x1b[0m. Every craft goes in your hotbar!`,
    ],
    greet: (name) => `Hey ${name || "builder"}! I'm Bloop. Let's craft stuff!`,
    prompt: (name) => `  ${name ? `\x1b[38;2;154;154;154m${name} ` : ""}\x1b[1;38;2;85;255;85m> `,
    unknown: (raw, idea) => `Unknown recipe: "${raw}"\nNothing crafts from that... try ${idea}!`,
    helpTitle: "RECIPE BOOK",
    tada: (label) => `World loaded: ${label}. Start building!`,
  },

  mount(chrome) {
    const bar = chrome.querySelector<HTMLElement>("#blocks-hotbar")!;
    const toast = chrome.querySelector<HTMLElement>("#blocks-toast")!;
    const slots = Array.from({ length: 9 }, () => bar.appendChild(document.createElement("div")));
    const held: { key: string; n: number }[] = [];
    const learned = new Set<string>();
    let toastTimer: number | undefined;

    /** Repaint the hotbar from `held`; the newest stack is the selected slot. */
    const paint = (fresh: number) => slots.forEach((s, i) => {
      s.className = i === fresh ? "sel pop" : "";
      s.replaceChildren();
      const it = held[i];
      if (!it) return;
      s.appendChild(pixelIcon(ITEMS[it.key]));
      if (it.n > 1) s.appendChild(Object.assign(document.createElement("b"), { textContent: String(it.n) }));
    });

    const onEnter = () => { if (on()) { sq(98, 0, 0.07, 0.07); noise(0, 0.09, 0.22, 380); } };
    const onResult = (e: Event) => {
      const { kind, cmd } = (e as CustomEvent).detail as { kind: string; cmd: string };
      const key = kind === "math" ? "math" : cmd;
      if (kind === "unknown" || !ITEMS[key]) return;
      let i = held.findIndex((h) => ITEMS[h.key] === ITEMS[key]);
      if (i >= 0) held[i].n = Math.min(64, held[i].n + 1);
      else { if (held.length === 9) held.shift(); held.push({ key, n: 1 }); i = held.length - 1; }
      paint(i);
      if (on()) [880, 1320].forEach((f, j) => sq(f, 0.08 + j * 0.05, 0.05, 0.03));   // pickup pop
      if (kind === "ok" && !learned.has(ITEMS[key])) {
        learned.add(ITEMS[key]);
        toast.querySelector("span")!.textContent = `Crafted: ${key === "?" ? "help" : key}`;
        toast.classList.remove("on"); void toast.offsetWidth; toast.classList.add("on");
        clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove("on"), 3200);
      }
    };
    paint(-1);
    addEventListener("tt:enter", onEnter);
    addEventListener("tt:result", onResult);
    return () => { removeEventListener("tt:enter", onEnter); removeEventListener("tt:result", onResult); clearTimeout(toastTimer); };
  },
};
export default theme;
