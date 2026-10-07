/**
 * What a theme is. Each theme is one folder, src/themes/<key>/, with an index.ts whose default
 * export is a ThemeDef and a style.css it imports. Nothing outside that folder needs editing to
 * add one: src/themes/index.ts picks up every folder.
 *
 * The core page (index.html) has these slots; a theme's CSS lays them out under [data-theme="<key>"]:
 *   #page      the window surface (core gives it 48px rounded corners; themes may change that)
 *   #chrome    the theme's decoration layer, filled from ThemeDef.chrome
 *   #term      the terminal text area
 *   #tools     the ⭐ 🔊 ⚙️ buttons
 *   #mascot    wrapper holding #bubble (speech bubble) and #sidekick (ThemeDef.sidekick).
 *              Mood classes land on #mascot: happy | think | dance | wave | wow | sleep
 *   #fx        particles and giant words (core)
 *
 * Live theme behaviour (gears turning, score counters, telemetry) goes in mount(), which can
 * listen for these window events:
 *   "tt:key"     detail: { ch }                 a printable key was typed
 *   "tt:back"    detail: {}                     backspace
 *   "tt:enter"   detail: { raw }                a command was submitted
 *   "tt:result"  detail: { kind, cmd }          kind: "ok" | "unknown" | "math" | "thing"
 */
import type { ITheme } from "@xterm/xterm";

export type Mood = "happy" | "think" | "dance" | "wave" | "wow";

export interface Sounds {
  key(ch: string): void; back(): void; yay(): void; hmm(): void; sparkle(): void; boing(): void;
}

/** The theme's voice in text. Anything omitted falls back to the Crayon Box wording. */
export interface Words {
  intro(name: string): string[];               // lines printed when the shell starts (ANSI colors ok)
  greet(name: string): string;                 // speech bubble + spoken at start
  prompt(name: string): string;                // the prompt, ANSI ok, e.g. "  ★ "
  unknown(raw: string, idea: string): string;  // reply to a word the shell doesn't know ("\n" for new line)
  helpTitle: string;
  tada(label: string): string;                 // after switching to this theme
}

export interface ThemeDef {
  key: string;            // folder name, lowercase, used in `theme <key>`
  label: string;
  ages: string;           // e.g. "6-9"
  blurb: string;          // one line shown in the theme list
  order: number;          // position in lists: younger first
  fontFamily: string;     // CSS font stack; put @font-face rules in the theme's style.css
  fontSize?: number;      // default text size for this theme (parent can still change it)
  lineHeight?: number;
  cursorStyle?: "block" | "underline" | "bar";
  xterm: ITheme;          // background should be "rgba(0,0,0,0)" so #page shows through
  palette: string[];      // 5-8 output colors, all readable on this theme's background
  chrome: string;         // HTML for #chrome
  sidekick?: string;      // HTML/SVG for #sidekick; omit for no mascot
  sounds?: Partial<Sounds>;
  words?: Partial<Words>;
  /** Kokoro voice id (e.g. "af_heart"), speed 1 = normal. chatty: read every answer aloud, or only `say`. */
  voice: { id: string; speed?: number; chatty: boolean };
  mount?(chrome: HTMLElement): (() => void) | void;   // returns cleanup, called on theme switch
}

let current: ThemeDef;
export const active = () => current;
export function setActive(t: ThemeDef) { current = t; }

export function emit(name: "tt:key" | "tt:back" | "tt:enter" | "tt:result", detail: object = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
