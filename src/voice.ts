/**
 * Speech. Placeholder until the bundled neural voice lands: the system voice at natural pitch.
 * Interface the rest of the app relies on: say(text, voice) and hush().
 */
import { invoke } from "@tauri-apps/api/core";

export type VoiceOpts = { id: string; speed?: number };

export function say(text: string, voice: VoiceOpts) {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = voice.speed ?? 1;
    speechSynthesis.speak(u);
  } else if ("__TAURI_INTERNALS__" in window) invoke("speak", { text });
}

export function hush() { if ("speechSynthesis" in window) speechSynthesis.cancel(); }
