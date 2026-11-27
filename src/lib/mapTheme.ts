export type MapTheme = "light" | "dark" | "auto";

export const mapStyleUrl = (dark: boolean) =>
  `https://api.maptiler.com/maps/${dark ? "streets-v4-dark" : "streets-v4"}/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;
