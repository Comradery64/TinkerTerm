// TinkerTerm icon art, 1024px full-bleed SVG: dotted Crayon Box paper, the two crayon frame strokes
// (concentric with the macOS tile mask: 185px at 824 = 230 here), and Tinker the fox from the app's own buddies.js.
// Usage: node tools/icon/art.mjs > art.svg   (tools/icon/render.sh does this)
import { pose } from "../../src/themes/crayon/buddies.js";

const wax = (id, scale, holes) => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency="0.035 0.6" numOctaves="3" seed="7" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" result="d"/>
  <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="2" result="g"/>
  <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 ${holes}" result="holes"/>
  <feComposite in="d" in2="holes" operator="in"/></filter>`;
const frame = (o, w, c) => `<rect x="${o}" y="${o}" width="${1024 - 2 * o}" height="${1024 - 2 * o}" rx="${230 - o}" stroke="${c}" stroke-width="${w}"/>`;

process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
<defs>${wax("waxL", 9, 1.5)}${wax("wax", 3, 1.7)}
<pattern id="dots" width="96" height="96" patternUnits="userSpaceOnUse"><circle cx="48" cy="48" r="6" fill="#f1e3ff"/></pattern></defs>
<rect width="1024" height="1024" fill="#fffaf0"/><rect width="1024" height="1024" fill="url(#dots)"/>
<g filter="url(#waxL)" fill="none">${frame(30, 40, "#ff4d4d")}${frame(78, 20, "#1fb5ff")}</g>
<svg x="92" y="100" width="840" height="840" viewBox="10 -5 190 205" overflow="visible"><g filter="url(#wax)">${pose("fox", "idle", false)}</g></svg>
</svg>
`);
