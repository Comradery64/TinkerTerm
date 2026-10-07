# TinkerTerm

A first terminal for kids aged 3 to 10. Thick crayon colors, Comic Mono, a friendly mascot called Tinker,
sounds, and answers read aloud for kids who can't read yet.

Built on [xterm.js](https://xtermjs.org) + [Tauri v2](https://tauri.app) + [portable-pty](https://crates.io/crates/portable-pty).

## Run

```sh
pnpm install
pnpm tauri dev    # the app
pnpm dev          # browser preview at http://localhost:1420 (kid mode only)
```

## Kid mode (default)

A pretend shell: no files, no processes, nothing to break. Type `help` to see everything. Highlights:
animal and object words (`cat`, `rocket`, `dino`) show a picture and make a noise; `say hello` shows the
word in giant letters and speaks it; `2 + 3` does math with apples; `count 10`, `color pink`, `name Sam`,
`party`, `dance`, `joke`, `roll`, `abc`. Unknown words never error: Tinker suggests something to try.

## Grown-up corner

The ⚙️ button (or Cmd/Ctrl+,) asks a times-table question, then opens settings: sounds, read-aloud, text size,
crayon-edge text, kid's name, and **Open real shell**. The real shell is your login shell started in
`~/TinkerTerm Playground`. It is not a sandbox: it can reach every file you can.

Cmd/Ctrl + = / − / 0 changes the text size. 🔊 in the corner mutes sound and voice.

Font: [Comic Mono](https://github.com/dtinth/comic-mono-font), MIT (`public/fonts/ComicMono-LICENSE`).
