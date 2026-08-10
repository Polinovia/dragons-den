// Base UI's Select.Value shows the raw value unless told how to render it —
// this is the shared label lookup for the PRIVATE/FRIENDS/PUBLIC selects used
// across the create/continue/settings forms.
export const VISIBILITY_LABELS: Record<string, string> = {
  PRIVATE: "Private",
  FRIENDS: "Friends",
  PUBLIC: "Public",
};

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["week", 1000 * 60 * 60 * 24 * 7],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(date: Date): string {
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);

  if (abs < 60_000) return "just now";

  for (const [unit, ms] of UNITS) {
    if (abs >= ms) {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return rtf.format(Math.round(diff / 60_000), "minute");
}
