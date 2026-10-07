/**
 * Mission Control (9-13): a flight control console. A glass display for the text, a TELEMETRY rack on
 * the right driven by real input (clock, typing rate, command count, an orbit plot, GO/HOLD), and a
 * CAPCOM radio strip in place of a mascot. Serious equipment, not a cartoon.
 */
import type { ThemeDef } from "../../theme-api";
import { tone, noise } from "../../fx";
import { prefs } from "../../prefs";
import "./style.css";

const ESC = "\x1b[";
const c = (hex: string) => `${ESC}38;2;${parseInt(hex.slice(1, 3), 16)};${parseInt(hex.slice(3, 5), 16)};${parseInt(hex.slice(5, 7), 16)}m`;
const R = `${ESC}0m`;
const GREEN = "#5cf2a0", AMBER = "#ffb547", CYAN = "#6fd3ff", DIM = "#7f93a6";
const callsign = (name: string) => (name || "cadet").toUpperCase();

/** Quindar-style tones: the two short beeps that key a radio transmission on and off. */
const quindar = () => { tone(2525, 0, 0.11, "sine", 0.07); tone(2475, 0.16, 0.11, "sine", 0.07); };

const ORBIT_STEPS = 16;
const pad = (n: number) => String(n).padStart(2, "0");

const theme: ThemeDef = {
  key: "mission",
  label: "Mission Control",
  ages: "9-13",
  blurb: "flight console, live telemetry, CAPCOM on the radio",
  order: 30,
  fontFamily: `"Mission Mono", "SF Mono", Menlo, monospace`,
  fontSize: 19,
  lineHeight: 1.3,
  cursorStyle: "block",
  palette: [GREEN, AMBER, CYAN, "#ff7a6b", "#c7a3ff", "#e8f1f8"],
  xterm: {
    background: "rgba(0,0,0,0)", foreground: "#d9e6ef", cursor: GREEN, cursorAccent: "#071017", selectionBackground: "#24506b",
    black: "#0b141c", brightBlack: DIM, red: "#ff6b5e", brightRed: "#ff8a7e", green: "#3fd98a", brightGreen: GREEN,
    yellow: "#f2a33a", brightYellow: AMBER, blue: "#5aa9ff", brightBlue: "#86c1ff", magenta: "#b48cff", brightMagenta: "#c7a3ff",
    cyan: "#4cc4f0", brightCyan: CYAN, white: "#b8c7d3", brightWhite: "#f2f7fb",
  },
  voice: { id: "bm_george", speed: 1, chatty: false },
  bigPictures: false,
  sounds: {
    // relay click: a short bright snap with a faint tick under it
    key() { noise(0, 0.018, 0.12, 3800); tone(1800, 0, 0.012, "square", 0.015); },
    back() { noise(0, 0.025, 0.1, 1400); },
    // nominal: a calm rising major chord, like a good burn confirmation
    yay() { [0, 4, 7, 12].forEach((s, i) => tone(392 * 2 ** (s / 12), i * 0.05, 0.9 - i * 0.1, "sine", 0.07)); },
    // master caution chirp: two low square blips
    hmm() { tone(330, 0, 0.09, "square", 0.05); tone(330, 0.14, 0.09, "square", 0.05); tone(247, 0.28, 0.16, "square", 0.04); },
    sparkle() { for (let i = 0; i < 10; i++) tone(1400 + (i % 3) * 300, i * 0.035, 0.03, "sine", 0.05); },
    // thruster puff
    boing() { noise(0, 0.35, 0.18, 260); tone(90, 0, 0.3, "sine", 0.08); },
  },
  words: {
    intro: (name) => [
      `${c(DIM)}FLIGHT CONSOLE 3 // LINK ESTABLISHED${R}`,
      `${c(GREEN)}Good to have you on the loop, ${callsign(name)}.${R}`,
      `Enter a command and press ${c(AMBER)}Enter${R}. Start with ${c(CYAN)}help${R} for the procedures list.`,
    ],
    greet: (name) => `${callsign(name)}, this is CAPCOM. Comms check: loud and clear.`,
    prompt: (name) => `${c(DIM)}${callsign(name).slice(0, 10)}${R} ${c(GREEN)}›${R} `,
    unknown: (raw, idea) => `Command "${raw}" not recognized.\nSuggest: ${idea}`,
    helpTitle: "PROCEDURES ON FILE:",
    help: [["say <text>", "broadcast on the main display"], ["2 + 3", "flight computer arithmetic"],
      ["count 10", "run a count"], ["roll", "random number, 1-6"], ["joke", "crew morale"],
      ["name <callsign>", "set your callsign"], ["time", "local time"], ["theme", "switch console"],
      ["sticker", "patch for the console"], ["clear", "clear the display"]],
    tada: (label) => `Console reconfigured: ${label}. All stations, go.`,
  },
  chrome: `
    <div id="mission-head">
      <span class="lbl">FLIGHT DIRECTOR</span><b id="mission-call">CADET</b>
      <span class="sep"></span><span class="lbl">MET</span><b id="mission-met">T+00:00:00</b>
    </div>
    <div id="mission-glass"><i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i></div>
    <aside id="mission-rack">
      <h3>TELEMETRY</h3>
      <section class="status">
        <div class="lamp go" id="mission-go">GO</div>
        <div class="lamp hold" id="mission-hold">HOLD</div>
      </section>
      <section>
        <label>COMMS BANDWIDTH</label>
        <div class="bar"><span id="mission-bw"></span></div>
        <div class="row"><small>KEY/S</small><b id="mission-kps">0.0</b></div>
      </section>
      <section>
        <label>COMMANDS UPLINKED</label>
        <b class="big" id="mission-count">0000</b>
        <div class="row"><small>LAST</small><b id="mission-last">----</b></div>
      </section>
      <section class="orbit">
        <label>ORBIT TRACK</label>
        <svg viewBox="-50 -50 100 100">
          <circle r="44" class="ring" /><circle r="30" class="ring faint" />
          <circle r="11" class="planet" />
          <path d="M-46 0H46M0-46V46" class="ring faint" />
          <g id="mission-sat"><circle cx="0" cy="-44" r="3.4" class="sat" /><circle cx="0" cy="-44" r="7" class="halo" /></g>
        </svg>
        <div class="row"><small>REV</small><b id="mission-rev">0 / 0</b></div>
      </section>
    </aside>
    <div id="mission-comms"><span class="tag">CAPCOM</span><span class="ch">CH 2 · STANDING BY</span><i class="led"></i></div>
`,
  mount(chrome) {
    const $ = (id: string) => chrome.querySelector<HTMLElement>("#mission-" + id)!;
    const start = Date.now();
    const keys: number[] = [];
    let count = 0, holdTimer = 0;

    const tick = () => {
      const s = Math.floor((Date.now() - start) / 1000);
      $("met").textContent = `T+${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
      $("call").textContent = callsign(prefs.name);
      const now = Date.now();
      while (keys.length && now - keys[0] > 3000) keys.shift();
      const kps = keys.length / 3;
      $("kps").textContent = kps.toFixed(1);
      $("bw").style.transform = `scaleX(${Math.min(1, kps / 6)})`;
    };
    tick();
    const clock = window.setInterval(tick, 250);

    const onKey = () => { keys.push(Date.now()); };
    const onEnter = () => {
      if (prefs.sound) quindar();
      count++;
      $("count").textContent = String(count).padStart(4, "0");
      $("sat").style.transform = `rotate(${(count * 360) / ORBIT_STEPS}deg)`;
      $("rev").textContent = `${Math.floor(count / ORBIT_STEPS)} / ${count % ORBIT_STEPS}`;
    };
    const onResult = (e: Event) => {
      const { kind, cmd } = (e as CustomEvent<{ kind: string; cmd: string }>).detail;
      $("last").textContent = String(cmd).toUpperCase().slice(0, 8);
      const hold = kind === "unknown";
      chrome.classList.toggle("mission-hold", hold);
      clearTimeout(holdTimer);
      if (hold) holdTimer = window.setTimeout(() => chrome.classList.remove("mission-hold"), 4000);
    };
    window.addEventListener("tt:key", onKey);
    window.addEventListener("tt:enter", onEnter);
    window.addEventListener("tt:result", onResult);
    return () => {
      clearInterval(clock); clearTimeout(holdTimer);
      chrome.classList.remove("mission-hold");
      window.removeEventListener("tt:key", onKey);
      window.removeEventListener("tt:enter", onEnter);
      window.removeEventListener("tt:result", onResult);
    };
  },
};
export default theme;
