/** Every folder in src/themes/ with an index.ts is a theme. See src/theme-api.ts for the contract. */
import type { ThemeDef } from "../theme-api";

const mods = import.meta.glob<{ default: ThemeDef }>("./*/index.ts", { eager: true });
export const THEMES = Object.values(mods).map((m) => m.default).sort((a, b) => a.order - b.order);
export const themeFor = (key: string) => THEMES.find((t) => t.key === key) ?? THEMES[0];
