const AVATAR_TONES = [
  "bg-primary/15 text-primary",
  "bg-accent/20 text-primary",
  "bg-amber-500/15 text-amber-700",
  "bg-emerald-500/15 text-emerald-700",
  "bg-violet-500/15 text-violet-700",
] as const;

/** Stable Tailwind tone classes from a seed (e.g. user id). */
export function avatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * 17) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash];
}
