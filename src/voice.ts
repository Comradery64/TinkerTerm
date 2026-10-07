/**
 * Speech: Kokoro-82M running natively in Rust (the `tts` command), played through Web Audio.
 * Text is spoken sentence by sentence so audio starts after the first sentence is ready, while the
 * next one renders. Falls back to the system voice in a plain browser or if the native call fails.
 * Interface the rest of the app relies on: say(text, voice) and hush().
 */
import { invoke } from "@tauri-apps/api/core";

export type VoiceOpts = { id: string; speed?: number };

const native = "__TAURI_INTERNALS__" in window;
let ctx: AudioContext | undefined;
let playing: AudioBufferSourceNode | undefined;
let turn = 0; // bumped by every say()/hush(); late results from an older turn are dropped

const cache = new Map<string, AudioBuffer>();
const CACHE_MAX = 32;

async function render(text: string, voice: string, speed: number): Promise<AudioBuffer> {
  const key = `${voice}|${speed}|${text}`;
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key); // re-insert: Map order doubles as LRU order
    cache.set(key, hit);
    return hit;
  }
  const wav = await invoke<ArrayBuffer>("tts", { text, voice, speed });
  const buf = await ctx!.decodeAudioData(wav);
  cache.set(key, buf);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  return buf;
}

/** Sentences, with long ones broken at commas, so the first audio arrives quickly. */
function pieces(text: string): string[] {
  const out: string[] = [];
  for (const s of text.match(/[^.!?…]+[.!?…]*["”)]*\s*/g) ?? []) {
    if (s.length <= 80) out.push(s.trim());
    else out.push(...(s.match(/[^,;:]+[,;:]?\s*/g) ?? [s]).map((p) => p.trim()));
  }
  return out.filter((p) => /[\p{L}\p{N}]/u.test(p));
}

function fallback(text: string, voice: VoiceOpts) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = voice.speed ?? 1;
  speechSynthesis.speak(u);
}

export function say(text: string, voice: VoiceOpts) {
  hush();
  if (!native) return fallback(text, voice);
  const mine = turn;
  ctx ??= new AudioContext();
  void ctx.resume(); // WKWebView may start it suspended
  const speed = voice.speed ?? 1;
  const parts = pieces(text);
  (async () => {
    // render one after another (first sentence first) while earlier ones play; stop once stale
    let prev: Promise<unknown> = Promise.resolve();
    const bufs = parts.map((p) => {
      const b = prev.then(() => (mine === turn ? render(p, voice.id, speed) : Promise.reject(new Error("stale"))));
      prev = b.catch(() => {});
      return b;
    });
    for (const b of bufs) {
      const buf = await b;
      if (mine !== turn) return;
      await new Promise<void>((done) => {
        const src = ctx!.createBufferSource();
        src.buffer = buf;
        src.connect(ctx!.destination);
        src.onended = () => done();
        playing = src;
        src.start();
      });
      if (mine !== turn) return;
    }
  })().catch(() => {
    if (mine === turn) fallback(text, voice);
  });
}

export function hush() {
  turn++;
  try { playing?.stop(); } catch { /* already stopped */ }
  playing = undefined;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

// Load the model a few seconds after launch so the first say() is quick.
if (native) setTimeout(() => invoke("tts_warm").catch(() => {}), 3000);
