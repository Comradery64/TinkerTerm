/** Settings: one JSON blob in localStorage. Grown-ups change them behind the parent gate. */
export const prefs = {
  sound: true,
  speech: true,      // read answers aloud: most 3-5 year olds can't read yet
  fontSize: 26,
  wobble: true,      // crayon-edge filter on the text
  name: "",          // the kid's name, from `name Sam`
  theme: "crayon",
  buddy: "fox",      // Crayon Box sidekick: fox (Tinker) | robot | crayon | crab | dragon
  font: "",          // terminal font over the theme's own: "" (theme) | Comic Mono | Illinois Mono | OpenDyslexic Mono
};

try { Object.assign(prefs, JSON.parse(localStorage.getItem("prefs") ?? "{}")); }
catch (e) { console.warn("prefs", e); }

export function savePrefs() { localStorage.setItem("prefs", JSON.stringify(prefs)); }
