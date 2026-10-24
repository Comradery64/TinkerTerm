# Third-party notices

TinkerTerm itself is MIT (see `LICENSE`). It bundles the fonts below and downloads the voice model on request.
Each font's license text sits next to its files.

## Fonts (bundled in `public/`)

| Font | Used by | License | License file |
| --- | --- | --- | --- |
| [Comic Mono](https://github.com/dtinth/comic-mono-font) | Crayon Box, UI | MIT | `public/fonts/ComicMono-LICENSE` |
| [Illinois Mono](https://github.com/MadSimple/illinois-mono) | optional font (grown-up settings) | SIL OFL 1.1 | `public/fonts/OFL-IllinoisMono.txt` |
| [OpenDyslexic Mono](https://opendyslexic.org) | optional font (grown-up settings) | Bitstream Vera license + CC BY 3.0 | `public/fonts/OpenDyslexicMono-LICENSE` |
| [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) | Block World, Retro Arcade | SIL OFL 1.1 | `public/themes/*/fonts/PressStart2P-OFL.txt` |
| [VT323](https://fonts.google.com/specimen/VT323) | Block World, Retro Arcade | SIL OFL 1.1 | `public/themes/*/fonts/VT323-OFL.txt` |
| [Space Mono](https://github.com/googlefonts/spacemono) | Brick Manual | SIL OFL 1.1 | `public/themes/bricks/fonts/OFL.txt` |
| [Sono](https://github.com/sursly/sono) | Toy Workshop | SIL OFL 1.1 | `public/themes/workshop/fonts/Sono-OFL.txt` |
| [Fantasque Sans Mono](https://github.com/belluzj/fantasque-sans) | Paint Studio | SIL OFL 1.1 | `public/themes/paint/fonts/FantasqueSansMono-LICENSE.txt` |
| [IBM Plex Mono and Plex Sans Condensed](https://github.com/IBM/plex) | Mission Control | SIL OFL 1.1 | `public/themes/mission/fonts/OFL.txt` |
| [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) | Pro Studio | SIL OFL 1.1 | `public/themes/studio/fonts/JetBrainsMono-OFL.txt` |
| [Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono) | Deep Sea Lab | SIL OFL 1.1 | `public/themes/ocean/fonts/ShareTechMono-OFL.txt` |

## Voice (downloaded by `node scripts/fetch-voice.mjs`, not in this repository)

- [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) model and voices by hexgrad, ONNX export by
  [onnx-community](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX): Apache-2.0.
- [misaki](https://github.com/hexgrad/misaki) pronunciation dictionaries: Apache-2.0.

## Libraries

Dependencies are listed in `package.json` and `src-tauri/Cargo.toml`; each keeps its own license
(xterm.js and Tauri are MIT, ONNX Runtime via the `ort` crate is MIT/Apache-2.0).
