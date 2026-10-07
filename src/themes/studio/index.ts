/** Pro Studio (11+): a quiet, modern developer terminal. No mascot; the polish is in the details. */
import type { ThemeDef } from "../../theme-api";
import { tone, noise } from "../../fx";
import "./style.css";

const ESC = "\x1b[";
const rgb = (hex: string) => `${ESC}38;2;${parseInt(hex.slice(1, 3), 16)};${parseInt(hex.slice(3, 5), 16)};${parseInt(hex.slice(5, 7), 16)}m`;
const R = `${ESC}0m`, DIM = rgb("#6b7385"), ACC = rgb("#8b9cff"), OK = rgb("#7fd4a0"), CODE = rgb("#e8c487");

const theme: ThemeDef = {
  key: "studio",
  label: "Pro Studio",
  ages: "11+",
  blurb: "a sleek dev terminal, like the pros use",
  order: 60,
  fontFamily: `"studio-mono", ui-monospace, Menlo, monospace`,
  fontSize: 16,
  lineHeight: 1.5,
  cursorStyle: "bar",
  palette: ["#8b9cff", "#7fd4a0", "#e8c487", "#f28fad", "#6fd3e8", "#c49bff", "#f5a97f"],
  xterm: {
    background: "rgba(0,0,0,0)", foreground: "#d6dae3", cursor: "#8b9cff", cursorAccent: "#0d0f14", selectionBackground: "#2b3350",
    black: "#1b1f2a", brightBlack: "#6b7385", red: "#f2788f", brightRed: "#f28fad", green: "#6fca93", brightGreen: "#7fd4a0",
    yellow: "#ddb876", brightYellow: "#e8c487", blue: "#7f92f5", brightBlue: "#8b9cff", magenta: "#b98ef7", brightMagenta: "#c49bff",
    cyan: "#62c6dc", brightCyan: "#6fd3e8", white: "#aeb4c2", brightWhite: "#eef0f5",
  },
  voice: { id: "am_michael", speed: 1.05, chatty: false },
  bigPictures: false,
  // header strip with one session tab, and a status bar; mount() keeps both live
  chrome: `
      <div id="studio-head">
        <div id="studio-tab"><span class="dot"></span><span class="title">~/tinker</span><span class="sep">—</span><span class="proc">tsh</span></div>
        <div id="studio-newtab">+</div>
      </div>
      <div id="studio-status">
        <span class="pill"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="4" cy="3.5" r="1.8"/><circle cx="4" cy="12.5" r="1.8"/><circle cx="12" cy="6" r="1.8"/><path d="M4 5.3v5.4M12 7.8c0 2.4-3 2.6-6.6 3.6"/></svg>main</span>
        <span class="exit ok">✓ 0</span>
        <span class="grow"></span>
        <span class="cmds">0 cmds</span>
        <span class="theme">studio</span>
        <span class="utf">UTF-8</span>
        <span class="clock"></span>
      </div>`,
  sounds: {
    // barely-there: a soft mechanical tick per key, a two-note chime on success
    key() { noise(0, 0.018, 0.035, 3800); },
    back() { noise(0, 0.02, 0.03, 1800); },
    yay() { tone(1318.5, 0, 0.12, "sine", 0.035); tone(1975.5, 0.07, 0.18, "sine", 0.03); },
    hmm() { tone(330, 0, 0.14, "sine", 0.04); tone(247, 0.09, 0.2, "sine", 0.035); },
    sparkle() { [0, 0.05, 0.1].forEach((t, i) => tone(1760 * 1.26 ** i, t, 0.15, "sine", 0.02)); },
    boing() { tone(392, 0, 0.1, "sine", 0.04); tone(587, 0.06, 0.14, "sine", 0.035); },
  },
  words: {
    intro: (name) => [
      `${ACC}tinker shell${R} ${DIM}v1.0 · session ready${R}`,
      `${DIM}type ${R}${CODE}help${R}${DIM} for commands, or just try something:${R} ${CODE}say hi${R}${DIM},${R} ${CODE}2 + 3${R}${DIM},${R} ${CODE}joke${R}`,
      ...(name ? [`${DIM}signed in as ${R}${OK}${name}${R}`] : []),
    ],
    greet: (name) => name ? `Welcome back, ${name}.` : "Session started.",
    prompt: (name) => `  ${ACC}${(name || "tinker").toLowerCase()}${R} ${DIM}~${R} ${OK}❯${R} `,
    unknown: (raw, idea) => `command not found: ${raw}\ntry \`${idea}\` or \`help\``,
    helpTitle: "commands",
    help: [["say <text>", "print it big"], ["<a> + <b>", "arithmetic (+ - * /)"], ["count <n>", "count to n"],
      ["roll", "d6"], ["joke", "a bad pun"], ["name <you>", "set your prompt name"], ["time", "local time"],
      ["theme <name>", "switch theme"], ["sticker", "add a desktop sticker"], ["clear", "clear the screen"]],
    tada: (label) => `theme set: ${label.toLowerCase()}`,
  },
  mount(chrome) {
    const $ = (s: string) => chrome.querySelector<HTMLElement>(s)!;
    const tab = $("#studio-tab"), proc = $("#studio-tab .proc"), cmds = $("#studio-status .cmds");
    const exit = $("#studio-status .exit"), clock = $("#studio-status .clock");
    let n = 0, procTimer = 0;

    const tick = () => { clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
    tick();
    const clockTimer = window.setInterval(tick, 10_000);

    // the tab's dot means "unsent input", like an unsaved file in an editor
    const onKey = () => tab.classList.add("dirty");
    const onEnter = (e: Event) => {
      tab.classList.remove("dirty");
      const cmd = ((e as CustomEvent).detail.raw as string).trim().split(/\s+/)[0];
      if (!cmd) return;
      cmds.textContent = `${++n} cmd${n === 1 ? "" : "s"}`;
      proc.textContent = cmd.slice(0, 14);
      tab.classList.add("busy");
      clearTimeout(procTimer);
      procTimer = window.setTimeout(() => { proc.textContent = "tsh"; tab.classList.remove("busy"); }, 1400);
    };
    const onResult = (e: Event) => {
      const bad = (e as CustomEvent).detail.kind === "unknown";
      exit.textContent = bad ? "✗ 127" : "✓ 0";
      exit.className = `exit ${bad ? "err" : "ok"}`;
    };
    window.addEventListener("tt:key", onKey);
    window.addEventListener("tt:enter", onEnter);
    window.addEventListener("tt:result", onResult);
    return () => {
      clearInterval(clockTimer); clearTimeout(procTimer);
      window.removeEventListener("tt:key", onKey);
      window.removeEventListener("tt:enter", onEnter);
      window.removeEventListener("tt:result", onResult);
    };
  },
};
export default theme;
