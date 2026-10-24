/** Crayon Box (2-5): wax crayons on drawing paper, and a buddy: Tinker the fox, or one of four friends (buddies.js). */
import type { ThemeDef } from "../../theme-api";
import { prefs } from "../../prefs";
import { sidekickSvg } from "./buddies.js";
import "./style.css";

const theme: ThemeDef = {
  key: "crayon",
  label: "Crayon Box",
  ages: "2-5",
  blurb: "wax crayons, sunny sky, and Tinker the fox",
  order: 0,
  fontFamily: `"Comic Mono", "Comic Sans MS", "Chalkboard SE", sans-serif`,
  fontSize: 26,
  lineHeight: 1.35,
  cursorStyle: "block",
  palette: ["#ff4d4d", "#ff9f1c", "#e6a100", "#3ec300", "#1fb5ff", "#7b5cff", "#ff5cc8"],
  xterm: {
    background: "rgba(0,0,0,0)", foreground: "#3b2a6b", cursor: "#ff5cc8", cursorAccent: "#fff", selectionBackground: "#ffe58a",
    black: "#3b2a6b", brightBlack: "#6b5e8c", red: "#e53935", brightRed: "#ff4d4d", green: "#2e9d00", brightGreen: "#3ec300",
    yellow: "#c98a00", brightYellow: "#e6a100", blue: "#1279d6", brightBlue: "#1fa0ff", magenta: "#c2189b", brightMagenta: "#ff5cc8",
    cyan: "#00897b", brightCyan: "#00a99a", white: "#7a6f99", brightWhite: "#3b2a6b",
  },
  voice: { id: "af_heart", speed: 0.95, chatty: true },
  chrome: `
      <!-- crayon scribbles around the edge and in the corners -->
      <svg id="doodles" aria-hidden="true">
        <g filter="url(#wax)" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <rect class="outer" stroke="#ff6b6b" stroke-width="9" />
          <rect class="inner" stroke="#1fb5ff" stroke-width="6" opacity=".7" />
        </g>
      </svg>
      <svg id="sun" viewBox="0 0 120 120" aria-hidden="true">
        <g filter="url(#wax)" stroke="#ff9f1c" stroke-width="7" stroke-linecap="round">
          <circle cx="60" cy="60" r="22" fill="#ffd23f" />
          <path d="M60 18v-12M60 114v-12M18 60h-12M114 60h-12M30 30l-8-8M98 98l-8-8M30 90l-8 8M98 22l-8 8" />
        </g>
      </svg>
      <svg id="cloud" viewBox="0 0 160 80" aria-hidden="true">
        <path filter="url(#wax)" d="M30 60c-20 0-20-28 2-28 2-18 30-24 40-8 10-14 36-10 38 8 22-2 26 28 4 28z" fill="#e8f6ff" stroke="#1fb5ff" stroke-width="6" />
      </svg>
      <svg id="cloud2" viewBox="0 0 160 80" aria-hidden="true">
        <path filter="url(#wax)" d="M30 60c-20 0-20-28 2-28 2-18 30-24 40-8 10-14 36-10 38 8 22-2 26 28 4 28z" fill="#e8f6ff" stroke="#1fb5ff" stroke-width="6" />
      </svg>
`,
  // the buddy the grown-ups picked (Tinker the fox by default), every mood drawn; style.css shows the current one
  get sidekick() { return sidekickSvg(prefs.buddy) + `<div id="zzz">z<span>z</span><span>z</span></div>`; },
};
export default theme;
