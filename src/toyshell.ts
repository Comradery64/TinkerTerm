/** Kid mode: a pretend shell with friendly commands. No filesystem, no processes; nothing can break. */
import type { Terminal } from "@xterm/xterm";
import { prefs, savePrefs } from "./prefs";
import { THEMES } from "./themes";
import { active, emit, type Words } from "./theme-api";
import { addSticker, STICKERS } from "./stickers";
import { sfx, speak, confetti, bigWord, mascot, say, pick, palette } from "./fx";
import { buddy } from "./themes/crayon/buddies.js";

const ESC = "\x1b[";
const rgb = (hex: string) => `${ESC}38;2;${parseInt(hex.slice(1, 3), 16)};${parseInt(hex.slice(3, 5), 16)};${parseInt(hex.slice(5, 7), 16)}m`;
const RESET = `${ESC}0m`;
const rainbow = (s: string) => [...s].map((c, i) => rgb(palette()[i % palette().length]) + c).join("") + RESET;
/** Palette slot n, wrapping: themes have 5-8 colors. */
const col = (n: number) => palette()[n % palette().length];

/** Crayon Box wording; themes override any of it (ThemeDef.words). */
const BASE_WORDS: Words = {
  intro: () => [`${rainbow(`Hi! I'm ${active().key === "crayon" ? buddy(prefs.buddy).name : "Tinker"}!`)} 👋`, `Type a word and press ${rgb(col(3))}Enter${RESET}. Try ${rgb(col(6))}cat${RESET} or ${rgb(col(6))}help${RESET}!`],
  greet: (name) => name ? `Hi ${name}! Let's play!` : "Hi! Let's play!",
  prompt: (name) => `  ${name ? rainbow(name) + " " : ""}${rgb(col(1))}★ ${RESET}`,
  unknown: (raw, idea) => `Hmm, I don't know "${raw}" yet! 🤔\nTry typing: ${idea}`,
  helpTitle: "Things to try:",
  help: [["cat, dog, rocket…", "see a picture and hear it"], ["say hello", "I'll say it big!"],
    ["2 + 3", "do math"], ["count 10", "count with me"], ["color pink", "change your crayon"],
    ["name Sam", "tell me your name"], ["party", "confetti!"], ["dance", "watch me dance"],
    ["joke", "a silly joke"], ["theme", "change the look"], ["sticker cat", "add a sticker"],
    ["roll", "roll a dice"], ["abc", "the alphabet"], ["clear", "clean the page"]],
  tada: (label) => `Ta-da! ${label}! ✨`,
};
const words = (): Words => ({ ...BASE_WORDS, ...active().words });

// a word on its own shows a picture and makes its noise
const THINGS: Record<string, [string, string]> = {
  cat: ["🐱", "Meow!"], dog: ["🐶", "Woof woof!"], cow: ["🐮", "Moooo!"], pig: ["🐷", "Oink oink!"],
  duck: ["🦆", "Quack quack!"], lion: ["🦁", "Roar!"], frog: ["🐸", "Ribbit!"], sheep: ["🐑", "Baaa!"],
  horse: ["🐴", "Neigh!"], owl: ["🦉", "Hoo hoo!"], bee: ["🐝", "Buzz buzz!"], monkey: ["🐵", "Ooh ooh aah aah!"],
  fish: ["🐟", "Blub blub!"], bird: ["🐦", "Tweet tweet!"], snake: ["🐍", "Ssssss!"], mouse: ["🐭", "Squeak!"],
  dino: ["🦖", "RAWR!"], dinosaur: ["🦕", "Stomp stomp!"], unicorn: ["🦄", "Sparkle magic!"], dragon: ["🐉", "Whoosh! Fire!"],
  bear: ["🐻", "Grrr!"], elephant: ["🐘", "Pawoo!"], penguin: ["🐧", "Waddle waddle!"], bunny: ["🐰", "Hop hop!"],
  sun: ["☀️", "Sunny and warm!"], moon: ["🌙", "Goodnight moon!"], star: ["⭐", "Twinkle twinkle!"],
  rain: ["🌧️", "Pitter patter!"], snow: ["❄️", "Brrr, chilly!"], flower: ["🌸", "Smells nice!"], tree: ["🌳", "So tall!"],
  apple: ["🍎", "Crunch!"], banana: ["🍌", "Yum!"], pizza: ["🍕", "Pizza party!"], cake: ["🎂", "Happy birthday!"],
  icecream: ["🍦", "Cold and yummy!"], cookie: ["🍪", "Nom nom nom!"], car: ["🚗", "Vroom vroom!"],
  truck: ["🚚", "Beep beep!"], train: ["🚂", "Choo choo!"], plane: ["✈️", "Zoooom!"], rocket: ["🚀", "3, 2, 1, blast off!"],
  boat: ["⛵", "Splish splash!"], ball: ["⚽", "Bounce bounce!"], heart: ["❤️", "I love you!"], robot: ["🤖", "Beep boop!"],
  ghost: ["👻", "Boo!"], rainbow: ["🌈", "So many colors!"], poop: ["💩", "Hee hee, stinky!"],
};

const COLORS: Record<string, string> = {
  red: "#ff4d4d", orange: "#ff9f1c", yellow: "#e6b800", green: "#3ec300", blue: "#1fb5ff",
  purple: "#7b5cff", pink: "#ff5cc8", brown: "#a0522d", black: "#2b2b2b",
};

const JOKES = [
  ["Why did the cookie go to the doctor?", "Because it felt crummy! 🍪"],
  ["What do you call a sleeping dinosaur?", "A dino-snore! 🦖💤"],
  ["Why are fish so smart?", "Because they live in schools! 🐟"],
  ["What do cows read?", "Cattle-logs! 🐮"],
  ["What has ears but cannot hear?", "A cornfield! 🌽"],
  ["Why did the banana go to the doctor?", "It wasn't peeling well! 🍌"],
  ["What do you call a bear with no teeth?", "A gummy bear! 🐻"],
];

/**
 * Break lines at spaces before they reach the edge, so words never split ("hel / p").
 * Escape codes take no room; emoji take two cells. Wrapped lines keep the 2-space indent.
 */
function wrap(s: string, cols: number): string {
  const width = (t: string) => [...t.replace(/\x1b\[[0-9;]*m/g, "")].reduce((n, c) => n + (/\p{Extended_Pictographic}/u.test(c) ? 2 : c === "\uFE0F" ? 0 : 1), 0);
  return s.split("\r\n").map((line) => {
    if (width(line) < cols) return line;
    let out = "", cur = 0;
    for (const word of line.split(/(?<= )/)) {     // keep each word's trailing space
      const w = width(word);
      if (cur + w > cols - 1 && cur > 2) { out = out.trimEnd() + "\r\n  "; cur = 2; }
      out += word; cur += w;
    }
    return out;
  }).join("\r\n");
}

const KNOWN = new Set(["help", "?", "what", "hi", "hello", "hey", "hiya", "bye", "goodbye", "night", "goodnight", "name", "say", "big",
  "color", "colour", "crayon", "count", "abc", "alphabet", "party", "confetti", "yay", "hooray", "dance", "boogie", "joke", "roll", "dice",
  "time", "clock", "clear", "clean", "theme", "look", "sticker", "stickers", "grownup", "parent"]);

const IDEAS = ["cat", "say hello", "2 + 3", "party", "joke", "count 5", "color pink", "rocket", "dance", "roll"];

export class ToyShell {
  private line = "";
  private history: string[] = [];
  private back = 0;
  private ink = "";   // "" = the theme's own typing color

  constructor(private term: Terminal, private onGrownUp: () => void, private onTheme: (key: string) => void) {}

  start() {
    this.out("\r\n" + words().intro(prefs.name).map((l) => `  ${l}${RESET}\r\n`).join("") + "\r\n");
    say(words().greet(prefs.name));
    this.prompt();
  }

  private out(s: string) { this.term.write(wrap(s, this.term.cols)); }

  private prompt() {
    this.out(words().prompt(prefs.name) + RESET + (this.ink ? rgb(this.ink) : ""));
  }

  /** Keystrokes from xterm. */
  input(data: string) {
    if (data === "\r") return this.enter();
    if (data === "\x7f" || data === "\b") {
      if (!this.line) return;
      this.line = [...this.line].slice(0, -1).join("");
      sfx.back(); emit("tt:back");
      return this.out("\b \b");
    }
    if (data === "\x1b[A" || data === "\x1b[B") return this.recall(data === "\x1b[A" ? 1 : -1);
    if (data === "\x0c") { this.term.clear(); return; }   // Ctrl+L
    if (data.startsWith("\x1b")) return;                   // other arrows/function keys: ignore
    const text = data.replace(/[\x00-\x1f\x7f]/g, "");
    if (!text || this.line.length + text.length > 60) return;
    this.line += text;
    sfx.key(text); emit("tt:key", { ch: text });
    this.out(text);
  }

  private recall(dir: number) {
    const i = Math.min(this.history.length, Math.max(0, this.back + dir));
    if (i === this.back) return;
    this.back = i;
    this.out("\b \b".repeat([...this.line].length));
    this.line = i ? this.history[this.history.length - i] : "";
    this.out(this.line);
  }

  private enter() {
    const raw = this.line.trim();
    this.line = ""; this.back = 0;
    this.out(`${RESET}\r\n`);
    if (raw) { this.history.push(raw); sfx.enter(); emit("tt:enter", { raw }); this.run(raw); }
    this.prompt();
  }

  /** Print an answer and, if the theme is chatty, read it aloud. */
  private reply(text: string, color = pick(palette()), voice = text) {
    this.out(`  ${rgb(color)}${text.replace(/\n/g, "\r\n  ")}${RESET}\r\n\r\n`);
    if (active().voice.chatty) speak(voice);
  }

  private run(raw: string) {
    const [cmd, ...rest] = raw.split(/\s+/);
    const arg = rest.join(" ");
    const word = cmd.toLowerCase().replace(/[!?.]+$/, "");

    const math = raw.replace(/[x×]/gi, "*").replace(/÷/g, "/").match(/^(\d{1,4})\s*([-+*/])\s*(\d{1,4})$/);
    if (math) return this.math(+math[1], math[2], +math[3]);

    if (KNOWN.has(word)) emit("tt:result", { kind: "ok", cmd: word });
    switch (word) {
      case "help": case "?": case "what":
        this.out(`  ${rainbow(words().helpTitle)}\r\n`);
        for (const [c, d] of words().help)
          this.out(`   ${rgb(col(6))}${c.padEnd(18)}${RESET} ${d}\r\n`);
        this.out("\r\n");
        if (active().voice.chatty) speak("Here are some things to try!");
        return mascot("happy");
      case "hi": case "hello": case "hey": case "hiya":
        sfx.yay(); mascot("wave");
        return this.reply(`Hello${prefs.name ? " " + prefs.name : ""}! 👋 So nice to see you!`);
      case "bye": case "goodbye": case "night": case "goodnight":
        mascot("wave");
        return this.reply("Bye bye! See you soon! 👋💛");
      case "name":
        if (!arg) return this.reply("What's your name? Type: name and then your name!", col(5));
        prefs.name = arg.slice(0, 16).replace(/^./, (c) => c.toUpperCase()); savePrefs();
        sfx.yay(); mascot("happy"); confetti(["★", "♥", "✿"]);
        return this.reply(`Nice to meet you, ${prefs.name}! 🌟`);
      case "say": case "big":
        if (!arg) return this.reply("Say what? Try: say I love pizza", col(5));
        bigWord(arg); mascot("wow"); speak(arg);
        this.out(`  ${rainbow(arg)}\r\n\r\n`);
        return;
      case "color": case "colour": case "crayon": {
        const c = COLORS[arg.toLowerCase()];
        if (!c) {
          this.out("  " + Object.entries(COLORS).map(([n, h]) => rgb(h) + "● " + n).join("  ") + RESET + "\r\n\r\n");
          speak("Pick a color! Type color and then a color name.");
          return;
        }
        this.ink = c; sfx.yay(); mascot("happy");
        return this.reply(`Your crayon is ${arg.toLowerCase()} now! 🖍️`, c);
      }
      case "count": {
        const n = Math.min(20, Math.max(1, parseInt(arg) || 10));
        const thing = pick(["🍎", "⭐", "🐟", "🎈", "🍪", "🌸"]);
        for (let i = 1; i <= n; i++) this.out(`  ${rgb(col(i))}${String(i).padStart(2)} ${thing.repeat(i)}${RESET}\r\n`);
        this.out("\r\n"); sfx.yay(); mascot("happy");
        speak(Array.from({ length: n }, (_, i) => i + 1).join(", ") + "! You did it!");
        return;
      }
      case "abc": case "alphabet":
        this.out(`  ${rainbow("A B C D E F G H I J K L M N O P Q R S T U V W X Y Z")}\r\n\r\n`);
        mascot("dance", 3000); speak("A B C D E F G, H I J K L M N O P, Q R S, T U V, W X, Y and Z!");
        return;
      case "party": case "confetti": case "yay": case "hooray":
        confetti(); mascot("dance", 2500);
        return this.reply("🎉 Party time! 🎉");
      case "dance": case "boogie":
        sfx.boing(); mascot("dance", 3000);
        return this.reply("🎵 Wiggle wiggle wiggle! 🎵");
      case "joke": {
        const [q, a] = pick(JOKES);
        this.reply(q, col(5));
        setTimeout(() => {
          // the prompt is already showing: wipe it, print the punchline, redraw prompt + any typing
          this.out(`\r\x1b[2K  ${rgb(col(6))}${a}${RESET}\r\n\r\n`);
          this.prompt(); this.out(this.line);
          speak(a); sfx.boing(); mascot("happy");
        }, 2500);
        return;
      }
      case "roll": case "dice": {
        const n = 1 + Math.floor(Math.random() * 6);
        sfx.boing(); mascot("wow");
        return this.reply(`🎲 You rolled a ${n}! ${"●".repeat(n)}`);
      }
      case "time": case "clock":
        return this.reply(`🕒 It's ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}!`);
      case "clear": case "clean":
        this.term.clear(); sfx.sparkle();
        return;
      case "theme": case "look": {
        const t = THEMES.find((t) => t.key === arg.toLowerCase() || t.label.toLowerCase().startsWith(arg.toLowerCase()));
        if (!arg || !t) {
          this.out(THEMES.map((t) => `  ${rgb(col(6))}theme ${t.key.padEnd(9)}${RESET} ${t.label} ${rgb(col(4))}(${t.ages})${RESET}  ${t.blurb}`).join("\r\n") + "\r\n\r\n");
          speak("Pick a look! Type theme and then a name.");
          return;
        }
        this.onTheme(t.key);
        return;   // the new theme greets itself
      }
      case "sticker": case "stickers": {
        const e = THINGS[arg.toLowerCase()]?.[0] ?? pick(STICKERS);
        addSticker(e); mascot("happy");
        return this.reply(`Stick! ${e}  Drag it anywhere! Double-click to peel it off.`, pick(palette()), "Stick!");
      }
      case "grownup": case "parent":
        return this.onGrownUp();
    }

    const thing = THINGS[word] ?? THINGS[word.replace(/s$/, "")];
    emit("tt:result", { kind: thing ? "thing" : "unknown", cmd: word });
    if (thing) {
      sfx.yay(); mascot("wow");
      if (active().bigPictures !== false) bigWord(thing[0]);
      return this.reply(`${thing[0]}  ${thing[1]}`, pick(palette()), thing[1]);
    }

    // anything else, including key-mashing: never an error, always a nudge
    sfx.hmm(); mascot("think");
    const idea = pick(IDEAS);
    say(`Try: ${idea}`);
    this.reply(words().unknown(raw.slice(0, 20), idea), col(5), `Hmm! I don't know that one yet. Try ${idea}!`);
  }

  private math(a: number, op: string, b: number) {
    const v = op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : b ? a / b : NaN;
    if (!Number.isFinite(v)) return this.reply("Dividing by zero? That's a puzzle even for me! 🤯", col(5));
    const ans = Number.isInteger(v) ? String(v) : v.toFixed(2);
    const sign = { "+": "+", "-": "−", "*": "×", "/": "÷" }[op]!;
    this.out(`  ${rgb(col(0))}${a} ${sign} ${b} = ${rainbow(ans)}\r\n`);
    emit("tt:result", { kind: "math", cmd: "math" });
    // little numbers get apples, so it can be counted on the screen
    if (op === "+" && a + b <= 20) this.out(`  ${"🍎".repeat(a)} ${rgb(col(1))}+${RESET} ${"🍏".repeat(b)}\r\n`);
    if (op === "-" && a <= 20 && v >= 0) this.out(`  ${"🍎".repeat(v)}${"🫥".repeat(b)}\r\n`);
    this.out("\r\n");
    sfx.yay(); mascot("happy");
    if (active().voice.chatty) speak(`${a} ${{ "+": "plus", "-": "minus", "*": "times", "/": "divided by" }[op]} ${b} is ${ans}!`);
  }
}
