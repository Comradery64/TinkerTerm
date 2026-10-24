export type Mood = "idle" | "happy" | "think" | "dance" | "wave" | "wow" | "sleep";
export const MOODS: Mood[];
export const BUDDIES: { key: string; name: string; label: string }[];
export function buddy(key: string): { key: string; name: string; label: string };
export function pose(key: string, mood: Mood, withMarks?: boolean): string;
export function sidekickSvg(key: string): string;
