/** Crayon Box (2-5): wax crayons on drawing paper, and Tinker, a round purple crayon monster. */
import type { ThemeDef } from "../../theme-api";
import "./style.css";

const theme: ThemeDef = {
  key: "crayon",
  label: "Crayon Box",
  ages: "2-5",
  blurb: "wax crayons, sunny sky, and Tinker",
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
  sidekick: `
        <svg viewBox="0 0 140 150">
          <g filter="url(#wax)" stroke="#3b2a6b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
            <path class="arm l limb" d="M28 92 Q8 80 12 62" fill="none" stroke="#7b5cff" stroke-width="9" />
            <path class="arm r limb" d="M112 92 Q132 80 128 62" fill="none" stroke="#7b5cff" stroke-width="9" />
            <path d="M48 18 Q42 4 54 6 M92 18 Q98 4 86 6" fill="none" class="limb" stroke="#7b5cff" stroke-width="7" />
            <ellipse class="skin" cx="70" cy="85" rx="48" ry="52" fill="#a58bff" />
            <ellipse class="belly" cx="70" cy="100" rx="28" ry="26" fill="#d9ccff" stroke="none" />
            <path d="M44 134 v10 M96 134 v10" class="limb" stroke="#7b5cff" stroke-width="10" />
          </g>
          <g class="eyes">
            <ellipse cx="54" cy="70" rx="9" ry="11" fill="#fff" stroke="#3b2a6b" stroke-width="3" />
            <ellipse cx="86" cy="70" rx="9" ry="11" fill="#fff" stroke="#3b2a6b" stroke-width="3" />
            <circle class="pupil" cx="55" cy="72" r="5" fill="#3b2a6b" />
            <circle class="pupil" cx="87" cy="72" r="5" fill="#3b2a6b" />
          </g>
          <path class="closed" d="M45 72 q9 6 18 0 M77 72 q9 6 18 0" fill="none" stroke="#3b2a6b" stroke-width="4" stroke-linecap="round" />
          <circle cx="42" cy="88" r="6" fill="#ff8fb8" opacity=".7" />
          <circle cx="98" cy="88" r="6" fill="#ff8fb8" opacity=".7" />
          <path class="mouth smile" d="M58 90 Q70 104 82 90" fill="#ff5c8a" stroke="#3b2a6b" stroke-width="4" stroke-linecap="round" />
          <ellipse class="mouth ooh" cx="70" cy="96" rx="7" ry="9" fill="#ff5c8a" stroke="#3b2a6b" stroke-width="4" />
          <path class="mouth hmm" d="M60 96 q5 -4 10 0 t10 0" fill="none" stroke="#3b2a6b" stroke-width="4" stroke-linecap="round" />
        </svg>
        <div id="zzz">z<span>z</span><span>z</span></div>
        <div id="zzz">z<span>z</span><span>z</span></div>`,
};
export default theme;
