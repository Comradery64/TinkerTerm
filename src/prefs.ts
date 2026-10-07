/** Settings: one JSON blob in localStorage. Grown-ups change them behind the parent gate. */
export const prefs = {
  sound: true,
  speech: true,      // read answers aloud: most 3-5 year olds can't read yet
  fontSize: 26,
  wobble: true,      // crayon-edge filter on the text
  name: "",          // the kid's name, from `name Sam`
  theme: "crayon",
  stickers: [] as import("./stickers").Sticker[],
};

try { Object.assign(prefs, JSON.parse(localStorage.getItem("prefs") ?? "{}")); }
catch (e) { console.warn("prefs", e); }

export function savePrefs() { localStorage.setItem("prefs", JSON.stringify(prefs)); }
