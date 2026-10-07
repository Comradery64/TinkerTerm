/**
 * Fetches the bundled Kokoro voice into src-tauri/resources/kokoro/ (gitignored) so the app speaks
 * offline. Idempotent: files already present are skipped. Downloads are data only, never executed.
 * Licenses: Kokoro-82M model + voices Apache-2.0 (hexgrad, ONNX export by onnx-community),
 * misaki pronunciation dictionaries Apache-2.0 (hexgrad/misaki).
 */
import { mkdir, stat, writeFile, rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HF = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main";
const MISAKI = "https://raw.githubusercontent.com/hexgrad/misaki/main/misaki/data";
const OUT = fileURLToPath(new URL("../src-tauri/resources/kokoro/", import.meta.url));
// The voices themes use; add one here when a theme picks a new voice.
const VOICES = ["af_heart", "af_bella", "af_nicole", "af_sky", "am_adam", "am_michael", "am_puck", "am_echo",
  "bf_emma", "bf_isabella", "bm_george", "bm_lewis"];
const FILES = [
  [`${HF}/tokenizer.json`, "tokenizer.json"],
  // fp32: natively about twice as fast as the q8 build on Apple Silicon; fp16 emitted NaN audio
  [`${HF}/onnx/model.onnx`, "model.onnx"],
  ...VOICES.map((v) => [`${HF}/voices/${v}.bin`, `voices/${v}.bin`]),
  [`${MISAKI}/us_gold.json`, "us_gold.json"],
  [`${MISAKI}/us_silver.json`, "us_silver.json"],
];

const exists = (p) => stat(p).then((s) => s.size > 0, () => false);

for (const [url, f] of FILES) {
  const dest = join(OUT, f);
  if (await exists(dest)) continue;
  await mkdir(dirname(dest), { recursive: true });
  console.log(`voice: fetching ${f}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${f}: HTTP ${res.status}`);
  await writeFile(`${dest}.part`, Buffer.from(await res.arrayBuffer()));
  await rename(`${dest}.part`, dest); // never leave a half file behind
}
