/** Grown-up corner: a gate a small kid can't pass (a times-table question), then the settings. */
import { prefs, savePrefs } from "./prefs";
import { THEMES } from "./themes";
import { BUDDIES } from "./themes/crayon/buddies.js";

const FONTS = [["", "The look's own"], ["Comic Mono", "Comic Mono"], ["Illinois Mono", "Illinois Mono (easy reading)"],
  ["OpenDyslexic Mono", "OpenDyslexic Mono (dyslexia-friendly)"]];

export type Changed = "fontSize" | "wobble" | "mode" | "theme" | "buddy" | "font";

export function openParent(realMode: boolean, changed: (what: Changed) => void, close: () => void) {
  const a = 12 + Math.floor(Math.random() * 8), b = 6 + Math.floor(Math.random() * 4);
  const card = document.createElement("div");
  card.id = "parent";
  card.innerHTML = `
    <form class="card gate">
      <h2>Grown-ups only</h2>
      <label>What is ${a} × ${b}? <input name="ans" inputmode="numeric" autocomplete="off" autofocus></label>
      <div class="row"><button type="button" data-close>Cancel</button><button>Open</button></div>
    </form>`;
  document.body.appendChild(card);
  const done = () => { card.remove(); close(); };
  card.querySelector("[data-close]")!.addEventListener("click", done);
  card.addEventListener("keydown", (e) => { if (e.key === "Escape") done(); e.stopPropagation(); });
  const gate = card.querySelector("form")!;
  (gate.ans as HTMLInputElement).focus();
  gate.addEventListener("submit", (e) => {
    e.preventDefault();
    if (Number((gate.ans as HTMLInputElement).value) !== a * b) { gate.classList.remove("shake"); void gate.offsetWidth; gate.classList.add("shake"); return; }
    settings();
  });

  function settings() {
    card.innerHTML = `
      <div class="card">
        <h2>Grown-up settings</h2>
        <label><input type="checkbox" name="sound" ${prefs.sound ? "checked" : ""}> Sounds</label>
        <label><input type="checkbox" name="speech" ${prefs.speech ? "checked" : ""}> Read answers aloud</label>
        <label><input type="checkbox" name="wobble" ${prefs.wobble ? "checked" : ""}> Crayon-edge text (Crayon Box)</label>
        <label>Look <select name="theme">${THEMES.map((t) =>
          `<option value="${t.key}" ${t.key === prefs.theme ? "selected" : ""}>${t.label} (${t.ages})</option>`).join("")}</select></label>
        <label>Buddy (Crayon Box) <select name="buddy">${BUDDIES.map((b) =>
          `<option value="${b.key}" ${b.key === prefs.buddy ? "selected" : ""}>${b.label}</option>`).join("")}</select></label>
        <label>Font <select name="font">${FONTS.map(([v, l]) =>
          `<option value="${v}" ${v === prefs.font ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label>Text size <input type="range" name="fontSize" min="16" max="44" value="${prefs.fontSize}"></label>
        <label>Kid's name <input name="name" value="${prefs.name.replace(/"/g, "&quot;")}" maxlength="16"></label>
        <hr>
        <p class="warn">${realMode
          ? "A real shell is running."
          : "Real shell: your actual login shell, started in <b>~/TinkerTerm Playground</b>. It is <b>not</b> a sandbox: it can reach every file you can."}</p>
        <div class="row">
          <button data-mode>${realMode ? "Back to kid mode" : "Open real shell"}</button>
          <button data-close>Done</button>
        </div>
      </div>`;
    const look = card.querySelector<HTMLSelectElement>("select[name=theme]")!;
    look.addEventListener("change", () => { prefs.theme = look.value; changed("theme"); });
    const pal = card.querySelector<HTMLSelectElement>("select[name=buddy]")!;
    pal.addEventListener("change", () => { prefs.buddy = pal.value; savePrefs(); changed("buddy"); });
    const font = card.querySelector<HTMLSelectElement>("select[name=font]")!;
    font.addEventListener("change", () => { prefs.font = font.value; savePrefs(); changed("font"); });
    card.querySelectorAll<HTMLInputElement>("input").forEach((i) => i.addEventListener("input", () => {
      if (i.type === "checkbox") (prefs as any)[i.name] = i.checked;
      else if (i.name === "fontSize") prefs.fontSize = +i.value;
      else prefs.name = i.value.trim();
      savePrefs();
      if (i.name === "fontSize" || i.name === "wobble") changed(i.name);
    }));
    card.querySelector("[data-close]")!.addEventListener("click", done);
    card.querySelector("[data-mode]")!.addEventListener("click", () => { done(); changed("mode"); });
  }
}
