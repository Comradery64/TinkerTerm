/**
 * Rewrite SGR sequences for a light page:
 *  - 7/27 (inverse): the canvas background is transparent, so inverse would
 *    paint letters transparent and the cell in ink. Use a highlighter instead.
 *  - 38;5;n and 38;2;r;g;b foregrounds: apps pick these for dark terminals;
 *    clamp their luminance so pale yellows/cyans stay legible on paper.
 */
const HIGHLIGHT_BG = "48;2;200;226;245";
const MAX_FG_LUMA = 0.42;
export function remapSgr(seq: string, params: string): string {
  if (!/(^|;)(7|27|38|40|48)(;|:|$)/.test(params)) return seq;
  const p = params.split(";").flatMap(colonColor);
  const out: string[] = [];
  for (let i = 0; i < p.length; i++) {
    const n = p[i];
    if (n === "38" && p[i + 1] === "2" && i + 4 < p.length) {
      out.push("38", "2", ...inkClamp(+p[i + 2], +p[i + 3], +p[i + 4]).map(String)); i += 4;
    } else if (n === "38" && p[i + 1] === "5" && i + 2 < p.length) {
      const rgb = xterm256(+p[i + 2]);
      if (rgb) out.push("38", "2", ...inkClamp(...rgb).map(String)); else out.push("38", "5", p[i + 2]);
      i += 2;
    } else if (n === "48" && isDarkBg(p, i)) {
      out.push("49"); i += p[i + 1] === "2" ? 4 : 2;      // a dark-terminal panel: leave the paper bare
    } else if (n === "40") out.push("49");
    else if ((n === "48" || n === "58") && (p[i + 1] === "2" || p[i + 1] === "5")) {
      const len = p[i + 1] === "2" ? 5 : 3;      // keep background/underline runs intact
      out.push(...p.slice(i, i + len)); i += len - 1;
    } else if (n === "7") out.push(HIGHLIGHT_BG);
    else if (n === "27") out.push("49");
    else out.push(n);
  }
  return `\x1b[${out.join(";")}m`;
}

/**
 * ITU colon form of a color (38:2::r:g:b, 38:2:r:g:b, 38:5:n) as the semicolon
 * params remapSgr reads. Other colon params (underline styles like 4:3) pass as is.
 */
function colonColor(n: string): string[] {
  const c = n.split(":");
  if (c.length < 3 || !["38", "48", "58"].includes(c[0])) return [n];
  if (c[1] === "5") return [c[0], "5", c[2]];
  if (c[1] === "2" && c.length >= 5) return [c[0], "2", ...c.slice(-3)];
  return [n];
}

/** 48;2;r;g;b or 48;5;n darker than mid-grey: painted for a dark terminal, invisible intent on paper. */
function isDarkBg(p: string[], i: number): boolean {
  const rgb = p[i + 1] === "2" ? [+p[i + 2], +p[i + 3], +p[i + 4]] : p[i + 1] === "5" ? (+p[i + 2] === 0 ? [0, 0, 0] : xterm256(+p[i + 2])) : null;
  return !!rgb && (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 < 0.25;
}

/** Darken an RGB foreground until its luminance is at most MAX_FG_LUMA. */
function inkClamp(r: number, g: number, b: number): [number, number, number] {
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (luma <= MAX_FG_LUMA) return [r, g, b];
  const k = MAX_FG_LUMA / luma;
  return [Math.round(r * k), Math.round(g * k), Math.round(b * k)];
}

/** RGB for xterm 256-color indices 16..255; null for 0..15 (theme handles those). */
function xterm256(n: number): [number, number, number] | null {
  if (n < 16 || n > 255 || Number.isNaN(n)) return null;
  if (n >= 232) { const v = 8 + (n - 232) * 10; return [v, v, v]; }
  const c = n - 16, lv = [0, 95, 135, 175, 215, 255];
  return [lv[Math.floor(c / 36)], lv[Math.floor(c / 6) % 6], lv[c % 6]];
}
