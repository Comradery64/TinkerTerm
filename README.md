# TinkerTerm

A first terminal for kids: type a word, press Enter, and the computer answers back with pictures, sounds and a friendly voice.

![TinkerTerm, Crayon Box theme](docs/screenshot.png)

## Why TinkerTerm

A normal terminal is a blank black window that expects you to already know what to type. One wrong command can
delete files, and the error messages read like a foreign language. That is a rough first meeting.

TinkerTerm starts with a pretend shell instead. Kids type simple words, and every answer is a picture, a sound or
a silly joke. Nothing is ever an error: if a word is not recognized, Tinker the fox suggests something to try.
The habits are the real ones: type a command, press Enter, read the result, use the up arrow to repeat. When a
kid is ready for more, a grown-up can switch on the real thing.

- **Safe by design.** Kid mode never touches your files and never starts a program. It is a set of built-in
  commands written for the app, not a connection to your computer's shell. The only things it saves are
  the kid's settings (name, look, text size) and where their stickers are.
- **Grown-ups hold the keys.** Settings and the real shell sit behind a times-table question that a small child
  will not get past.
- **Private.** The voice runs on your own computer. Nothing you type or hear is sent anywhere.
- **Grows with the child.** Nine looks cover roughly ages 2 to 14, from wax crayons to a pro developer terminal.

TinkerTerm is built for macOS, and macOS is the only platform it has been tested on.

## What it can do

- **Nine themes.** Each one has its own colors, font, sounds, wording and sidekick, from Crayon Box (ages 2-5) to
  Retro Arcade (9-14) and Pro Studio (11+). Type `theme` to see them all, or `theme arcade` to switch.
- **Buddies.** Tinker the fox, Sprocket the wind-up robot, Stubby the crayon, Shelly the sticker crab and
  Sniffles the baby dragon. In Crayon Box they react to what you type: waving, thinking, dancing, looking
  amazed, or falling asleep.
- **A voice that reads to you.** Answers are spoken aloud by a neural voice that runs on your computer. The
  younger looks read replies aloud, and `say hello` speaks the word in every look. If the voice model is not
  installed, the Mac's built-in voice takes over.
- **A safe toy shell.** Animal and object words show a picture and make a noise. Things to try:
  - `cat`, `dog`, `dino`, `rocket`, `pizza` and dozens more words: a big picture and a sound
  - `say hello`: the word in giant letters, spoken aloud
  - `2 + 3`: math you can count, with apples (also `-`, `x` and `/`)
  - `count 10`: count along, up to 20
  - `abc`: the alphabet, sung out
  - `color pink`: change your crayon
  - `name Sam`: tell it your name, and it remembers
  - `party`, `dance`, `joke`, `roll`, `time`, `clear`
  - `help`: the full list, any time
- **Stickers.** The star button opens a tray of stickers. Drop them anywhere on the screen, even outside the
  window. Drag to move, scroll to resize, double-click to peel one off. Or type `sticker cat`. They are
  still there next time you open the app.
- **Sounds.** Keys, Enter and answers make little sounds, and every look has its own sound set. One button mutes everything.
- **Easier reading.** Pick Comic Mono, Illinois Mono or OpenDyslexic Mono for kids who find letters jumbled, and
  change the text size with Cmd and plus or minus.
- **A grown-up corner.** Press the gear button (or Cmd+,), answer the times-table question, and you can adjust
  sounds, read-aloud, text size, look, buddy, font and the kid's name.
- **A real shell, when you are ready.** The grown-up corner can open your actual login shell, starting in a
  folder called `TinkerTerm Playground` so experiments stay out of your home folder. This is not a sandbox: it
  can reach every file you can, so switch it on only when you are sitting nearby. Type `exit` to close the
  window, or go back to kid mode from the same settings card.
- **A window that behaves.** Resizable, with rounded corners, and the close buttons stay out of the way
  until you move the pointer to the top-left corner.

## Build from source

TinkerTerm is a source-only release for now. It is built on [xterm.js](https://xtermjs.org),
[Tauri v2](https://tauri.app) and [portable-pty](https://crates.io/crates/portable-pty). You need
[Node 20+](https://nodejs.org), [pnpm](https://pnpm.io) and [Rust](https://rustup.rs).

```sh
pnpm install
node scripts/fetch-voice.mjs    # one-time, ~322 MB voice model (also runs before pnpm dev / pnpm build)
pnpm tauri dev                  # run the app
pnpm tauri build                # make an app bundle
pnpm dev                        # browser preview at http://localhost:1420 (kid mode only, system voice)
```

The voice is [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), run natively in Rust through ONNX Runtime.
The download goes into `src-tauri/resources/kokoro/` and is not part of this repository. Without it the app
still works and speaks with the system voice.

Each theme is one folder in `src/themes/`; see `src/theme-api.ts` for what a theme can define. The kid-mode
commands live in `src/toyshell.ts`.

## License

MIT. Copyright (c) 2026 Reishi.dev. See [LICENSE](LICENSE).

Fonts and the voice model have their own licenses and credits: see [THIRD-PARTY.md](THIRD-PARTY.md). The voice is
Kokoro-82M by hexgrad (Apache-2.0).
