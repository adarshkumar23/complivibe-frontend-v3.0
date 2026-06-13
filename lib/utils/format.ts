export type ScoreTone = "good" | "warn" | "bad";

/** style.md score rules: >=70 green, >=40 amber, <40 red */
export function scoreTone(value: number | null | undefined): ScoreTone {
  if (value == null) return "warn";
  if (value >= 70) return "good";
  if (value >= 40) return "warn";
  return "bad";
}

export function formatScore(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const rounded = Math.round(value);
  return `${rounded}`;
}

export function formatRelativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  const diff = time - Date.now();
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const fmt = (value: number, unit: string) => {
    const v = Math.round(value);
    const plural = v === 1 ? unit : `${unit}s`;
    return diff < 0 ? `${v} ${plural} ago` : `in ${v} ${plural}`;
  };

  if (abs < minute) return "just now";
  if (abs < hour) return fmt(abs / minute, "min");
  if (abs < day) return fmt(abs / hour, "hour");
  if (abs < 30 * day) return fmt(abs / day, "day");
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** style.md deadline rules: <=30 red, <=60 amber, >60 green */
export function deadlineTone(days: number | null | undefined): ScoreTone {
  if (days == null) return "warn";
  if (days <= 30) return "bad";
  if (days <= 60) return "warn";
  return "good";
}
