/** Crayon Box buddies: five hand-drawn sidekicks, picked in grown-up settings (prefs.buddy).
 * Each draw(mood) returns SVG for viewBox "-10 -10 220 220"; the sidekick holds one pose group per mood
 * and the theme CSS shows the one matching the mood class on #mascot. Also used by tools/icon/art.mjs. */
const O = "#3b2a6b";
export const MOODS = ["idle", "happy", "think", "dance", "wave", "wow", "sleep"];
const rot = (a, x, y, s) => `<g transform="rotate(${a} ${x} ${y})">${s}</g>`;
const ln = (d, col, w = 8) =>
  `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + 5}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const sh = (d, fill, w = 4.5) => `<path d="${d}" fill="${fill}" stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const el = (cx, cy, rx, ry, fill, w = 4.5) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${O}" stroke-width="${w}"/>`;
const dot = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
const st = (d, col = O, w = 4) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

// cartoon eyes: white with pupil, or "dark" fox eyes. eye() draws one; side "r" winks on wave
function eye(m, x, y, r = 8, dark = false, side = "l") {
  const arc = st(`M${x - r} ${y + 2} q${r} ${-r * 1.5} ${2 * r} 0`, O, 4.5);
  const open = (k = 1, look = [0, 1]) => dark
    ? el(x, y, r * 0.75 * k, r * k, O, 0) + dot(x + 2 + look[0], y - r * 0.4 * k + look[1], r * 0.28, "#fff")
    : el(x, y, r * k, r * 1.12 * k, "#fff", 3.5) + dot(x + look[0] * k, y + look[1] * k + 1, r * 0.55, O) + dot(x + look[0] * k + 2, y + look[1] * k - 2, r * 0.18, "#fff");
  switch (m) {
    case "sleep": return st(`M${x - r} ${y} q${r} ${r * 0.9} ${2 * r} 0`, O, 4.5);
    case "happy": case "dance": return arc;
    case "wave": return side === "r" ? arc : open();
    case "wow": return open(1.3, [0, 0]);
    case "think": return open(1, [3, -4]);
    default: return open();
  }
}
const eyes = (m, lx, rx, y, r = 8, dark = false) => eye(m, lx, y, r, dark, "l") + eye(m, rx, y, r, dark, "r");
function mouth(m, x, y, w = 10) {
  switch (m) {
    case "happy": case "dance": case "wave": return sh(`M${x - w} ${y} q${w} ${w * 1.5} ${2 * w} 0 z`, "#ff5c8a", 3.5);
    case "wow": return el(x, y + 4, w * 0.55, w * 0.75, "#ff5c8a", 3.5);
    case "think": return st(`M${x - w * 0.8} ${y + 3} q${w * 0.4} -4 ${w * 0.8} 0 t${w * 0.8} 0`, O, 3.5);
    case "sleep": return el(x, y + 3, 3, 4, "#ff5c8a", 3);
    default: return st(`M${x - w} ${y} q${w} ${w * 0.9} ${2 * w} 0`, O, 4);
  }
}
const cheeks = (lx, rx, y) => `<g opacity=".65">${dot(lx, y, 6, "#ff8fb8")}${dot(rx, y, 6, "#ff8fb8")}</g>`;

// motion marks drawn outside the body (never filtered away)
function marks(m, a) {
  const [tx, ty] = a.top, [hx, hy] = a.hand;
  const txt = (x, y, s, size, col = "#7b5cff", r = 0) =>
    `<text x="${x}" y="${y}" font-family="Comic Mono" font-weight="700" font-size="${size}" fill="${col}" stroke="${O}" stroke-width="1.5" paint-order="stroke" transform="rotate(${r} ${x} ${y})">${s}</text>`;
  const note = (x, y, c) => `<g transform="translate(${x} ${y})">${el(0, 0, 6, 4.5, c, 2.5)}${st("M5 -1 v-22 l10 5", O, 3)}</g>`;
  const star = (x, y, r, c) => sh(`M${x} ${y - r} l${r * 0.3} ${r * 0.7} l${r * 0.7} ${r * 0.1} l${-r * 0.55} ${r * 0.45} l${r * 0.2} ${r * 0.75} l${-r * 0.65} ${-r * 0.4} l${-r * 0.65} ${r * 0.4} l${r * 0.2} ${-r * 0.75} l${-r * 0.55} ${-r * 0.45} l${r * 0.7} ${-r * 0.1} z`, c, 2.5);
  switch (m) {
    case "happy": return st("M62 205 h-16 M138 205 h16 M74 210 h-8 M126 210 h8", O, 3.5) + star(tx - 52, ty + 14, 9, "#ffd23f") + star(tx + 54, ty + 4, 7, "#ff5cc8");
    case "think": return txt(tx + 38, ty + 18, "?", 34, "#ff9f1c", 12) + dot(tx + 24, ty + 34, 3.5, "#ff9f1c") + dot(tx + 30, ty + 26, 2.5, "#ff9f1c");
    case "dance": return note(tx - 58, ty + 30, "#ff5cc8") + note(tx + 52, ty + 12, "#1fb5ff") + st("M36 200 q-8 -10 0 -20 M164 200 q8 -10 0 -20", "#7b5cff", 3.5);
    case "wave": return st(`M${hx + 14} ${hy - 18} q10 10 0 22 M${hx + 24} ${hy - 26} q15 16 0 36`, "#1fb5ff", 4);
    case "wow": return st(`M${tx} ${ty - 6} v-10 M${tx - 30} ${ty + 2} l-8 -8 M${tx + 30} ${ty + 2} l8 -8 M${tx - 44} ${ty + 22} h-10 M${tx + 44} ${ty + 22} h10`, "#ff9f1c", 4.5) + txt(tx + 50, ty + 44, "!", 34, "#ff4d4d", 10);
    case "sleep": return txt(tx + 30, ty + 26, "z", 22) + txt(tx + 44, ty + 8, "z", 28) + txt(tx + 62, ty - 14, "Z", 34);
    default: return "";
  }
}

// ---------------------------------------------------------------- A: wind-up robot
function robot(m) {
  const T = "#4fc3c8", T2 = "#2fa3aa", R = "#ff4d4d", Y = "#ffd23f", S = "#2b1f52", G = "#7dffb0";
  const A = { idle: [16, -16], happy: [145, -145], think: [-38, 38], dance: [115, -30], wave: [16, -158], wow: [72, -72], sleep: [3, -3] }[m];
  const arm = (x, y, a) => rot(a, x, y, ln(`M${x} ${y} l-6 7 l12 7 l-12 7 l12 7 l-6 5`, T, 6) +
    ln(`M${x - 3} ${y + 33} q-13 5 -8 19 M${x + 3} ${y + 33} q13 5 8 19`, R, 5));
  const g = `fill="none" stroke="${G}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
  const pix = (x, y) => `<rect x="${x - 5}" y="${y - 7}" width="10" height="14" rx="3" fill="${G}"/>`;
  const face = {
    idle: pix(85, 64) + pix(115, 64) + `<path d="M90 80 q10 7 20 0" ${g}/>`,
    happy: `<path d="M78 69 l7 -9 l7 9 M108 69 l7 -9 l7 9" ${g}/><path d="M86 77 q14 15 28 0 z" fill="${G}" stroke="${G}" stroke-width="3" stroke-linejoin="round"/>`,
    think: pix(89, 60) + pix(119, 60) + dot(88, 83, 3, G) + dot(100, 83, 3, G) + dot(112, 83, 3, G),
    dance: `<path d="M79 58 l10 7 l-10 7 M121 58 l-10 7 l10 7" ${g}/><path d="M88 78 q12 12 24 0 z" fill="${G}" stroke="${G}" stroke-width="3" stroke-linejoin="round"/>`,
    wave: pix(85, 64) + `<path d="M108 68 l7 -8 l7 8" ${g}/><path d="M90 79 q10 8 20 0" ${g}/>`,
    wow: `<circle cx="85" cy="64" r="8" ${g}/><circle cx="115" cy="64" r="8" ${g}/>` + dot(85, 64, 3, G) + dot(115, 64, 3, G) + `<ellipse cx="100" cy="84" rx="5" ry="6" ${g}/>`,
    sleep: `<path d="M79 66 h12 M109 66 h12" ${g} opacity=".6"/><circle cx="100" cy="82" r="3.5" ${g} opacity=".6"/>`,
  }[m];
  const key = rot({ idle: 0, happy: 35, dance: 70, wow: -20, sleep: 25, think: 0, wave: 0 }[m], 100, 14,
    sh("M96 16 h8 v20 h-8 z", "#c9d3dc") + el(84, 12, 13, 8, Y) + el(116, 12, 13, 8, Y) + el(100, 12, 5, 5, "#e6a100", 3.5));
  const spin = m === "happy" || m === "dance" ? st("M70 2 q-8 10 2 18 M130 2 q8 10 -2 18", "#ff9f1c", 3.5) : "";
  const bt = { happy: "translate(0 -14)", think: "rotate(-5 100 186)", dance: "rotate(-9 100 186)", wow: "translate(100 110) scale(1.05) translate(-100 -110)", sleep: "rotate(5 100 186) translate(0 3)" }[m] || "";
  return `<g transform="${bt}">` + sh("M80 156 h12 v14 h-12 z", T2) + sh("M108 156 h12 v14 h-12 z", T2) +
    sh("M70 168 h26 v18 a6 6 0 0 1 -6 6 h-14 a6 6 0 0 1 -6 -6 z", R) + sh("M104 168 h26 v18 a6 6 0 0 1 -6 6 h-14 a6 6 0 0 1 -6 -6 z", R) +
    sh("M58 116 a14 14 0 0 1 14 -14 h56 a14 14 0 0 1 14 14 v34 a14 14 0 0 1 -14 14 h-56 a14 14 0 0 1 -14 -14 z", T) +
    sh("M72 120 a6 6 0 0 1 6 -6 h44 a6 6 0 0 1 6 6 v16 a6 6 0 0 1 -6 6 h-44 a6 6 0 0 1 -6 -6 z", "#e8fbfb", 3.5) +
    el(86, 128, 5, 5, R, 3) + el(100, 128, 5, 5, Y, 3) + el(114, 128, 5, 5, "#1fb5ff", 3) + st("M84 150 h32 M84 156 h32", T2, 3) +
    key + spin +
    el(50, 70, 8, 8, "#c9d3dc") + el(150, 70, 8, 8, "#c9d3dc") +
    sh("M50 50 a16 16 0 0 1 16 -16 h68 a16 16 0 0 1 16 16 v40 a16 16 0 0 1 -16 16 h-68 a16 16 0 0 1 -16 -16 z", T) +
    `<rect x="62" y="46" width="76" height="50" rx="10" fill="${m === "sleep" ? "#3a2d63" : S}" stroke="${O}" stroke-width="3.5"/>` +
    `<rect x="66" y="49" width="20" height="5" rx="2.5" fill="#fff" opacity=".18"/>` + face +
    arm(60, 118, A[0]) + arm(140, 118, A[1]) + `</g>`;
}

// ---------------------------------------------------------------- B: crayon stub
function crayon(m) {
  const W = "#ff7a45", W2 = "#e0592a", P = "#fff3c4", Z = "#7b5cff";
  const A = { idle: [28, -28], happy: [150, -150], think: [28, 122], dance: [120, -45], wave: [28, -160], wow: [80, -80], sleep: [28, -28] }[m];
  const arm = (x, y, a) => rot(a, x, y, st(`M${x} ${y} l0 26`, O, 5) + el(x, y + 30, 7, 7, W, 3.5));
  const zig = (y) => st(`M78 ${y} l5.5 -5 l5.5 5 l5.5 -5 l5.5 5 l5.5 -5 l5.5 5 l5.5 -5 l5.5 5`, Z, 3.5);
  const trail = {
    idle: "M8 196 c12 -18 26 8 36 -4 s16 -14 26 0",
    happy: "M20 200 c-4 -30 30 -30 26 -6 s-20 14 -10 -6 c8 -14 24 -4 30 6",
    dance: "M100 202 m-70 0 c0 -16 140 -16 140 0 c0 12 -126 12 -126 -2 c0 -10 112 -10 112 0",
    wave: "M8 196 c12 -18 26 8 36 -4", think: "M8 196 c12 -18 26 8 36 -4", wow: "M8 196 c12 -18 26 8 36 -4", sleep: "",
  }[m];
  const body = st(trail, W, 5) +
    el(89, 186, 13, 7, "#1fb5ff") + el(111, 186, 13, 7, "#1fb5ff") + st("M80 186 h6 M102 186 h6", "#fff", 3) +
    sh("M78 154 h44 v26 a4 4 0 0 1 -4 4 h-36 a4 4 0 0 1 -4 -4 z", W) +
    sh("M78 58 h44 v50 h-44 z", W) +
    sh("M80 58 L93 27 Q100 18 107 27 L120 58 Z", W2) + st("M91 50 L98 31", "#ffb08a", 4) +
    sh("M77 56 h46 v8 h-46 z", W2, 4) +
    sh("M76 104 a4 4 0 0 1 4 -4 h40 a4 4 0 0 1 4 4 v54 a4 4 0 0 1 -4 4 h-40 a4 4 0 0 1 -4 -4 z", P) + zig(112) + zig(156) +
    `<text x="100" y="138" text-anchor="middle" font-family="Comic Mono" font-weight="700" font-size="11" fill="${O}">STUBBY</text>` +
    `<rect x="102" y="117" width="22" height="9" rx="2" fill="#ffd6e7" stroke="${O}" stroke-width="2.5" transform="rotate(-24 113 121)"/>` +
    eyes(m, 90, 110, 76, 6.5) + cheeks(83, 117, 90) + mouth(m, 100, 89, 6) +
    arm(76, 118, A[0]) + arm(124, 118, A[1]) +
    (m === "wow" ? st("M100 8 v-8 M86 12 l-6 -6 M114 12 l6 -6", "#ffd23f", 4) : "");
  if (m === "sleep") return `<g transform="translate(62 -6) rotate(-90 100 186)">${body}</g>` + st("M0 204 c30 -8 60 6 90 -2 s60 6 100 0", W, 4);
  const bt = { happy: "translate(0 -16)", think: "rotate(-8 100 186)", dance: "rotate(14 100 186)", wow: "translate(0 -4)" }[m] || "";
  return `<g transform="${bt}">${body}</g>`;
}

// ---------------------------------------------------------------- C: fox mechanic
function fox(m) {
  const F = "#ff8a3d", C = "#fff3e0", G = "#3ec300", Gd = "#2e9d00", B = "#e6a100", L = "#bfeaff", Gy = "#b6c0cc", P = "#5a3d6e";
  const A = { idle: [18, -22], happy: [140, -150], think: [160, -12], dance: [118, -60], wave: [18, -162], wow: [62, -62], sleep: [4, -4] }[m];
  const wrench = (x, y) => ln(`M${x} ${y + 34} v24`, Gy, 6) + sh(`M${x - 9} ${y + 70} q0 -13 9 -13 q9 0 9 13 h-5 q0 -6 -4 -6 q-4 0 -4 6 z`, Gy, 3.5);
  const arm = (x, y, a, tool, len = 26) => rot(a, x, y, ln(`M${x} ${y} l0 ${len}`, F, 9) + el(x, y + len + 5, 7, 7, P, 3.5) + (tool ? wrench(x, y) : ""));
  const tailA = { happy: -18, dance: 16, wow: -8, sleep: 10 }[m] || 0;
  const tail = rot(tailA, 122, 160, sh("M118 168 C150 178 188 150 180 108 C176 88 162 80 154 86 C168 112 150 140 122 150 Z", F) +
    sh("M154 86 C162 79 178 88 180 108 C171 104 162 101 156 99 Z", C, 3.5));
  const tall = m === "wow" ? -10 : 0;
  const ears = sh(`M68 62 L58 ${14 + tall} L98 46 Z`, F) + sh(`M72 55 L64 ${30 + tall} L88 47 Z`, "#ffc9a8", 3) +
    sh(`M132 62 L142 ${14 + tall} L102 46 Z`, F) + sh(`M128 55 L136 ${30 + tall} L112 47 Z`, "#ffc9a8", 3);
  const goggles = (y, alpha) => st(`M56 ${y + 4} Q100 ${y - 10} 144 ${y + 4}`, "#8a5a3c", 6) +
    `<g opacity="${alpha}">${el(84, y, 13, 13, L, 5)}${el(116, y, 13, 13, L, 5)}</g>` +
    `<circle cx="84" cy="${y}" r="13" fill="none" stroke="${B}" stroke-width="5"/><circle cx="116" cy="${y}" r="13" fill="none" stroke="${B}" stroke-width="5"/>` +
    st(`M77 ${y - 4} q3 -4 7 -5 M109 ${y - 4} q3 -4 7 -5`, "#fff", 3);
  const down = m === "think";
  const bt = { happy: "translate(0 -12)", think: "rotate(-5 100 186)", dance: "rotate(-8 100 186)", sleep: "rotate(4 100 186)" }[m] || "";
  return `<g transform="${bt}">` + tail +
    sh("M80 162 h14 v16 h-14 z", F) + sh("M106 162 h14 v16 h-14 z", F) + el(87, 184, 13, 7, P) + el(113, 184, 13, 7, P) +
    sh("M74 116 Q70 168 86 170 L114 170 Q130 168 126 116 Z", F) + sh("M88 110 Q100 124 112 110 Z", C, 3.5) +
    sh("M80 130 L120 130 L123 170 L77 170 Z", G) + sh("M86 118 h28 v14 h-28 z", G, 3.5) +
    st("M88 120 L80 110 M112 120 L120 110", Gd, 4) + dot(89, 124, 3.5, B) + dot(111, 124, 3.5, B) +
    st("M104 140 L109 128", "#ff4d4d", 4) + sh("M93 140 h16 v13 h-16 z", Gd, 3) +
    ears + sh("M58 74 Q58 44 100 42 Q142 44 142 74 Q150 92 128 102 Q114 114 100 114 Q86 114 72 102 Q50 92 58 74 Z", F) +
    sh("M74 90 Q100 75 126 90 Q120 112 100 114 Q80 112 74 90 Z", C, 3.5) +
    eyes(m, 84, 116, 76, 7, true) + el(100, 92, 6.5, 4.5, O, 0) + mouth(m, 100, 101, 6) +
    goggles(down ? 76 : 52, down ? 0.55 : 1) +
    arm(76, 122, A[0], false, m === "think" ? 50 : 26) + arm(124, 122, A[1], true) + `</g>`;
}

// ---------------------------------------------------------------- D: sticker hermit crab
function crab(m) {
  const S = "#c4b2ff", S2 = "#7b5cff", C = "#ff7b6b";
  const star = (x, y, r, c) => sh(`M${x} ${y - r} l${r * 0.3} ${r * 0.7} l${r * 0.7} ${r * 0.1} l${-r * 0.55} ${r * 0.45} l${r * 0.2} ${r * 0.75} l${-r * 0.65} ${-r * 0.4} l${-r * 0.65} ${r * 0.4} l${r * 0.2} ${-r * 0.75} l${-r * 0.55} ${-r * 0.45} l${r * 0.7} ${-r * 0.1} z`, c, 3);
  const heart = (x, y, c) => sh(`M${x} ${y + 9} c-14 -8 -12 -20 -5 -20 c3 0 5 3 5 5 c0 -2 2 -5 5 -5 c7 0 9 12 -5 20 z`, c, 3);
  const shell = sh("M50 146 Q42 72 98 40 Q158 28 170 98 Q174 136 152 146 Z", S) +
    st("M124 100 a10 10 0 1 1 -10 -11 a20 20 0 1 1 21 21 a32 32 0 1 1 -34 -33 a44 44 0 0 1 40 -8", S2, 7) +
    star(76, 84, 12, "#ffd23f") + heart(146, 66, "#ff5cc8") + el(150, 122, 8, 8, "#3ec300", 3) + st("M146 122 l3 3 l5 -6", "#fff", 3);
  if (m === "sleep") return shell + sh("M54 146 Q100 156 150 146 Q100 136 54 146 Z", "#2b1f52", 3.5) +
    st("M82 146 q5 4 10 0 M108 146 q5 4 10 0", "#fff", 3.5);
  const up = m === "wow" ? -18 : 0;
  const stalk = (bx, tx, ty, bend = 0) => ln(`M${bx} 136 Q${(bx + tx) / 2 + bend} ${(136 + ty) / 2} ${tx} ${ty}`, C, 6);
  const lt = m === "think" ? [94, 100, 10] : [80, 96 + up, 0], rt = [120, 96 + up, 0];
  const A = { idle: [0, 0], happy: [34, -34], think: [0, 22], dance: [26, 12], wave: [0, -48], wow: [16, -16] }[m];
  const small = rot(A[0], 62, 142, ln("M62 142 L42 128", C, 7) + sh("M42 128 q-16 -4 -18 -18 q10 2 14 8 q-2 -12 8 -16 q6 12 -4 26 z", C, 3.5));
  const big = rot(A[1], 138, 142, ln("M138 142 L160 126", C, 8) +
    sh("M158 126 Q154 90 184 86 Q180 106 168 114 Z", C, 4) + sh("M162 128 Q188 128 194 104 Q184 108 170 116 Z", C, 4));
  const legs = ["M66 150 L48 160 L42 186", "M72 158 L58 170 L56 190", "M134 150 L152 160 L158 186", "M128 158 L142 170 L144 190"].map((d) => ln(d, C, 6)).join("");
  const bt = { happy: "translate(0 -10)", dance: "translate(-10 0) rotate(-6 100 186)", think: "rotate(-4 100 186)" }[m] || "";
  return `<g transform="${bt}">` + legs + shell + sh("M56 148 a44 20 0 0 1 88 0 a44 20 0 0 1 -88 0 z", C) +
    stalk(90, lt[0], lt[1], lt[2]) + stalk(110, rt[0], rt[1]) +
    eye(m, lt[0], lt[1] - 2, 10, false, "l") + eye(m, rt[0], rt[1] - 2, 10, false, "r") + cheeks(80, 120, 152) + mouth(m, 100, 150, 8) + small + big + `</g>`;
}
// ---------------------------------------------------------------- E: hatchling dragon
function dragon(m) {
  const D = "#34c38f", D2 = "#1f9a6e", Bl = "#ffe08a", Wg = "#b39bff", Eg = "#fffdf5";
  const A = { idle: [26, -26], happy: [132, -132], think: [26, 116], dance: [104, -40], wave: [26, -156], wow: [62, -62], sleep: [10, -10] }[m];
  const arm = (x, y, a) => rot(a, x, y, ln(`M${x} ${y} l0 18`, D, 11) + el(x, y + 23, 6.5, 6.5, D2, 3.5));
  const wa = { happy: 26, dance: 18, wow: 14 }[m] || 0;
  const wings = rot(wa, 76, 118, sh("M76 116 Q46 84 38 104 Q52 104 48 117 Q60 110 64 126 Z", Wg)) +
    rot(-wa, 124, 118, sh("M124 116 Q154 84 162 104 Q148 104 152 117 Q140 110 136 126 Z", Wg));
  const ta = { dance: -18, happy: -8 }[m] || 0;
  const tail = rot(ta, 122, 166, ln("M118 168 Q160 186 176 162 Q186 148 178 138", D, 13) + sh("M178 140 l-12 -2 l12 -18 l9 19 z", D2, 3.5));
  const shell = m === "sleep" ? "translate(0 18) rotate(-10 100 50)" : m === "wow" ? "translate(0 -10) rotate(8 100 50)" : "";
  const letters = m === "wow" ? ["A", "b", "c"].map((s, i) => `<text x="${30 - i * 16}" y="${104 - i * 30}" font-family="Comic Mono" font-weight="700" font-size="${34 - i * 4}" fill="${["#ff4d4d", "#1fb5ff", "#ff9f1c"][i]}" stroke="${O}" stroke-width="1.5" paint-order="stroke">${s}</text>`).join("") + dot(58, 100, 3, "#ffd23f") + dot(46, 82, 2.5, "#ff5cc8") : "";
  const puff = m === "think" ? el(124, 22, 9, 7, "#fff", 3) + el(138, 8, 6, 5, "#fff", 3) : "";
  const bt = { happy: "translate(0 -12)", think: "rotate(-5 100 186)", dance: "rotate(-8 100 186)", sleep: "rotate(4 100 186)" }[m] || "";
  return `<g transform="${bt}">` + tail + wings +
    el(84, 182, 14, 8, D) + el(116, 182, 14, 8, D) + st("M76 184 v4 M84 185 v4 M108 185 v4 M116 184 v4", "#fff", 3) +
    sh("M72 112 Q66 176 88 178 L112 178 Q134 176 128 112 Z", D) + sh("M84 118 Q80 172 100 174 Q120 172 116 118 Z", Bl, 3.5) +
    st("M86 134 h28 M84 148 h32 M87 162 h26", "#e6b84a", 3) +
    sh("M62 72 l-18 -10 l8 18 z", Wg, 3.5) + sh("M138 72 l18 -10 l-8 18 z", Wg, 3.5) +
    sh("M60 76 Q58 38 100 36 Q142 38 140 76 Q142 102 120 110 L80 110 Q58 102 60 76 Z", D) +
    el(100, 94, 24, 13, "#5fd8a8", 3.5) + dot(93, 92, 2.8, O) + dot(107, 92, 2.8, O) +
    eyes(m, 82, 118, 68, 9) + mouth(m, 100, 104, 7) + (m === "idle" || m === "wave" ? sh("M104 104 l2 5 l2 -5 z", "#fff", 2) : "") +
    `<g transform="${shell}">` + sh("M58 58 Q60 22 100 20 Q140 22 142 58 L132 50 L122 60 L112 50 L100 60 L88 50 L78 60 L68 50 Z", Eg) +
    dot(84, 36, 3, Wg) + dot(116, 30, 2.5, "#ffb3d1") + dot(102, 42, 2, Wg) + `</g>` +
    arm(74, 126, A[0]) + arm(126, 126, A[1]) + `</g>` + letters + puff;
}

const CHARS = {
  fox: { name: "Tinker", label: "Tinker the fox mechanic", draw: fox, top: [100, 10], hand: [150, 76] },
  robot: { name: "Sprocket", label: "Sprocket the wind-up robot", draw: robot, top: [100, 0], hand: [150, 72] },
  crayon: { name: "Stubby", label: "Stubby the crayon", draw: crayon, top: [100, 14], hand: [140, 80] },
  crab: { name: "Shelly", label: "Shelly the sticker crab", draw: crab, top: [100, 40], hand: [178, 76] },
  dragon: { name: "Sniffles", label: "Sniffles the hatchling dragon", draw: dragon, top: [100, 14], hand: [148, 90] },
};
export const BUDDIES = Object.entries(CHARS).map(([key, c]) => ({ key, name: c.name, label: c.label }));
export const buddy = (key) => (CHARS[key] ? { key, ...CHARS[key] } : { key: "fox", ...CHARS.fox });

/** One buddy, in a single mood: SVG content (no <svg> wrapper). marks = motion lines, notes, "?" etc. */
export const pose = (key, mood, withMarks = true) => { const c = buddy(key); return c.draw(mood) + (withMarks ? marks(mood, c) : ""); };

/** The sidekick markup: every mood as a hidden group; CSS shows the one for the class on #mascot. */
// a calmer wax than the page's #wax: these drawings have thinner lines, and the full grain washes them out
const WAX = `<filter id="buddywax" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency="0.035 0.6" numOctaves="3" seed="7" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="3" result="d"/>
  <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="2" result="g"/>
  <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.7" result="holes"/>
  <feComposite in="d" in2="holes" operator="in"/></filter>`;
export const sidekickSvg = (key) => `<svg viewBox="-10 -10 220 220"><defs>${WAX}</defs><g filter="url(#buddywax)">${
  MOODS.map((m) => `<g class="pose pose-${m}">${pose(key, m, m !== "sleep")}</g>`).join("")}</g></svg>`;
