/** The fun layer: synthesized sounds, the voice, sparkles, confetti, giant words, and Tinker the mascot. */
import { prefs } from "./prefs";
import { active, type Sounds } from "./theme-api";
import { say as voiceSay } from "./voice";

/** The active theme's output colors. */
export const palette = () => active().palette;
export const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- sound: tiny WebAudio synth, no asset files ----
let ctx: AudioContext | undefined;
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];   // pentatonic: any run of keys sounds like a tune

export function tone(freq: number, at: number, len: number, type: OscillatorType = "triangle", vol = 0.18) {
  ctx ??= new AudioContext();
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + len);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + len + 0.02);
}
export const note = (semi: number) => 523.25 * 2 ** (semi / 12);   // from C5

/** White-noise burst: clicks, snaps, whooshes. */
export function noise(at: number, len: number, vol = 0.15, filterHz = 2000) {
  ctx ??= new AudioContext();
  const t = ctx.currentTime + at;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = buf; f.type = "bandpass"; f.frequency.value = filterHz;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
  src.connect(f).connect(g).connect(ctx.destination); src.start(t);
}

/** Crayon Box sounds; a theme overrides any of them. */
const base: Sounds = {
  key(ch: string) { if (prefs.sound) tone(note(PENTA[ch.charCodeAt(0) % PENTA.length]), 0, 0.15); },
  enter() {},
  back() { if (prefs.sound) { tone(note(4), 0, 0.08, "sine"); tone(note(0), 0.06, 0.12, "sine"); } },
  yay() { if (prefs.sound) [0, 4, 7, 12].forEach((s, i) => tone(note(s), i * 0.08, 0.25)); },
  hmm() { if (prefs.sound) { tone(note(2), 0, 0.18, "sine"); tone(note(-1), 0.16, 0.3, "sine"); } },
  sparkle() { if (prefs.sound) for (let i = 0; i < 8; i++) tone(note(12 + PENTA[i]), i * 0.04, 0.2, "sine", 0.1); },
  boing() {
    if (!prefs.sound) return;
    ctx ??= new AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.25);
    g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.4);
  },
};

/** Plays the active theme's sound, falling back to the base set. Muted when sound is off. */
export const sfx: Sounds = Object.fromEntries((Object.keys(base) as (keyof Sounds)[]).map((k) =>
  [k, (...a: [string]) => { if (prefs.sound) ((active().sounds?.[k] ?? base[k]) as (...x: [string]) => void)(...a); }])) as unknown as Sounds;

// ---- voice ----
/** Read text aloud in the theme's voice. */
export function speak(text: string) {
  if (!prefs.speech) return;
  const clean = text.replace(/\p{Extended_Pictographic}|\uFE0F/gu, "").trim();
  if (clean) voiceSay(clean, active().voice);
}

// ---- particles ----
const layer = () => document.getElementById("fx")!;

function particle(x: number, y: number, content: string, dx: number, dy: number, ms: number, cls = "bit") {
  const p = document.createElement("span");
  p.className = cls;
  p.textContent = content;
  p.style.left = `${x}px`; p.style.top = `${y}px`;
  p.style.color = pick(palette());
  layer().appendChild(p);
  p.animate([
    { transform: "translate(-50%,-50%) scale(0.4) rotate(0deg)", opacity: 1 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${dx * 3}deg)`, opacity: 0 },
  ], { duration: ms, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => p.remove();
}

/** A little puff of stars where a key was pressed. */
export function burst(x: number, y: number, n = 4) {
  if (calm()) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = 25 + Math.random() * 35;
    particle(x, y, pick(["★", "✦", "●", "♥", "✿"]), Math.cos(a) * r, Math.sin(a) * r - 15, 600);
  }
}

/** Confetti rains from the top of the window. */
export function confetti(things = ["▲", "■", "●", "★", "♥", "🎉", "🎈"]) {
  sfx.sparkle();
  if (calm()) return;
  for (let i = 0; i < 70; i++) {
    setTimeout(() => particle(Math.random() * innerWidth, -20, pick(things),
      (Math.random() - 0.5) * 200, innerHeight * (0.7 + Math.random() * 0.4), 1800 + Math.random() * 1200, "bit big"), i * 18);
  }
}

/** A word in giant bouncing crayon letters across the middle of the window. */
export function bigWord(text: string) {
  const box = document.createElement("div");
  box.className = /\p{Extended_Pictographic}/u.test(text) ? "bigword pic" : "bigword";
  [...text.slice(0, 24)].forEach((ch, i) => {
    const s = document.createElement("span");
    s.textContent = ch === " " ? " " : ch;
    s.style.color = palette()[i % palette().length];
    s.style.animationDelay = `${i * 60}ms`;
    box.appendChild(s);
  });
  layer().appendChild(box);
  setTimeout(() => box.classList.add("bye"), 2200);
  setTimeout(() => box.remove(), 2800);
}

// ---- Tinker the mascot ----
export type Mood = "happy" | "think" | "dance" | "wave" | "wow";
let moodTimer: number | undefined, bubbleTimer: number | undefined, sleepTimer: number | undefined;

export function mascot(mood: Mood, ms = 1600) {
  const m = document.getElementById("mascot")!;
  m.classList.remove("happy", "think", "dance", "wave", "wow", "sleep");
  void m.offsetWidth;   // restart the animation when the same mood repeats
  m.classList.add(mood);
  clearTimeout(moodTimer);
  moodTimer = window.setTimeout(() => m.classList.remove(mood), ms);
  nap();
}

export function say(text: string, ms = 3500) {
  const b = document.getElementById("bubble")!;
  b.textContent = text;
  b.classList.add("on");
  clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => b.classList.remove("on"), ms);
}

/** After a minute with no typing, Tinker dozes off; any key wakes them. */
export function nap() {
  const m = document.getElementById("mascot")!;
  m.classList.remove("sleep");
  clearTimeout(sleepTimer);
  sleepTimer = window.setTimeout(() => m.classList.add("sleep"), 60_000);
}
