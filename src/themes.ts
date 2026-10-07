/**
 * Looks for different ages. Each sets body[data-theme] (the CSS does the decorating),
 * a font, and the xterm palette. Styles are inspired by classic toys, not copies of any brand.
 */
import type { ITheme } from "@xterm/xterm";

export type Theme = { key: string; label: string; ages: string; font: string; dark?: boolean; colors: ITheme };

const COMIC = `"Comic Mono", "Comic Sans MS", "Chalkboard SE", sans-serif`;
const MAPLE = `"Maple Mono", "Comic Mono", sans-serif`;

/** Bright crayons readable on a light page. */
const light = (fg: string, cursor: string): ITheme => ({
  background: "rgba(0,0,0,0)", foreground: fg, cursor, cursorAccent: "#fff", selectionBackground: "#ffe58a",
  black: fg, brightBlack: "#6b5e8c",
  red: "#e53935", brightRed: "#ff4d4d", green: "#2e9d00", brightGreen: "#3ec300",
  yellow: "#c98a00", brightYellow: "#e6a100", blue: "#1279d6", brightBlue: "#1fa0ff",
  magenta: "#c2189b", brightMagenta: "#ff5cc8", cyan: "#00897b", brightCyan: "#00a99a",
  white: "#7a6f99", brightWhite: fg,
});

export const THEMES: Theme[] = [
  { key: "crayon", label: "Crayon Box", ages: "2-5", font: COMIC, colors: light("#3b2a6b", "#ff5cc8") },
  { key: "toybox", label: "Toy Box", ages: "4-7", font: MAPLE, colors: light("#1d3557", "#e63946") },
  { key: "bricks", label: "Brick Builder", ages: "6-9", font: MAPLE, colors: light("#222222", "#d01012") },
  { key: "paint", label: "Paint Party", ages: "5-8", font: COMIC, colors: light("#2b1055", "#ff00a8") },
  { key: "night", label: "Night Sky", ages: "7-10", font: MAPLE, dark: true, colors: {
    background: "rgba(0,0,0,0)", foreground: "#e8f1ff", cursor: "#5cf2ff", cursorAccent: "#0b1030",
    selectionBackground: "#3a4a8a",
    black: "#0b1030", brightBlack: "#7d8bbf", red: "#ff6b81", brightRed: "#ff8fa0",
    green: "#7dff9a", brightGreen: "#a8ffbc", yellow: "#ffe066", brightYellow: "#fff099",
    blue: "#6cb8ff", brightBlue: "#9dd0ff", magenta: "#d68cff", brightMagenta: "#e8b5ff",
    cyan: "#5cf2ff", brightCyan: "#9ef7ff", white: "#c8d3f0", brightWhite: "#ffffff" } },
];

export const themeFor = (key: string) => THEMES.find((t) => t.key === key) ?? THEMES[0];
