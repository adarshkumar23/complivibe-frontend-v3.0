export type Accent = "blue" | "purple" | "cyan" | "teal" | "green" | "amber" | "red";

type AccentStyle = {
  /** gradient for filled icon tiles */
  tile: string;
  /** soft tinted background for badges / subtle fills */
  soft: string;
  /** text color */
  text: string;
  /** ring/border tint */
  ring: string;
  /** raw hex for charts */
  hex: string;
};

export const ACCENTS: Record<Accent, AccentStyle> = {
  blue: {
    tile: "from-sky-400 to-blue-600",
    soft: "bg-blue-500/10",
    text: "text-blue-600",
    ring: "ring-blue-400/30",
    hex: "#3B82F6"
  },
  purple: {
    tile: "from-violet-400 to-purple-600",
    soft: "bg-violet-500/10",
    text: "text-violet-600",
    ring: "ring-violet-400/30",
    hex: "#8B5CF6"
  },
  cyan: {
    tile: "from-cyan-300 to-sky-500",
    soft: "bg-cyan-500/10",
    text: "text-cyan-600",
    ring: "ring-cyan-400/30",
    hex: "#06B6D4"
  },
  teal: {
    tile: "from-teal-300 to-emerald-500",
    soft: "bg-teal-500/10",
    text: "text-teal-600",
    ring: "ring-teal-400/30",
    hex: "#14B8A6"
  },
  green: {
    tile: "from-emerald-300 to-green-600",
    soft: "bg-emerald-500/10",
    text: "text-emerald-600",
    ring: "ring-emerald-400/30",
    hex: "#10B981"
  },
  amber: {
    tile: "from-amber-300 to-orange-500",
    soft: "bg-amber-500/10",
    text: "text-amber-600",
    ring: "ring-amber-400/30",
    hex: "#F59E0B"
  },
  red: {
    tile: "from-rose-400 to-red-600",
    soft: "bg-rose-500/10",
    text: "text-rose-600",
    ring: "ring-rose-400/30",
    hex: "#EF4444"
  }
};
