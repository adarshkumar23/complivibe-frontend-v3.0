import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cv: {
          blue: "#3B82F6",
          purple: "#8B5CF6",
          cyan: "#06B6D4",
          teal: "#14B8A6",
          green: "#10B981",
          amber: "#F59E0B",
          red: "#EF4444",
          ink: "#0F172A",
          slate: "#64748B",
          mist: "#94A3B8"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      },
      boxShadow: {
        glass: "0 24px 60px -24px rgba(59,130,246,0.30), 0 2px 6px -2px rgba(15,23,42,0.06)",
        "glass-hover": "0 34px 80px -28px rgba(99,102,241,0.40), 0 4px 10px -3px rgba(15,23,42,0.08)",
        sidebar: "0 30px 80px -30px rgba(99,102,241,0.45)",
        button: "0 16px 34px -12px rgba(99,102,241,0.55)",
        tile: "0 10px 22px -8px rgba(59,130,246,0.45)"
      },
      borderRadius: {
        shell: "32px",
        panel: "26px",
        card: "22px"
      },
      backgroundImage: {
        "cv-brand": "linear-gradient(135deg, #06B6D4 0%, #3B82F6 48%, #8B5CF6 100%)",
        "cv-brand-soft":
          "linear-gradient(135deg, rgba(6,182,212,0.16) 0%, rgba(59,130,246,0.16) 50%, rgba(139,92,246,0.16) 100%)"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        shimmer: "shimmer 1.8s linear infinite",
        "float-slow": "float-slow 9s ease-in-out infinite",
        "fade-up": "fade-up 0.5s ease-out both"
      }
    }
  },
  plugins: []
};

export default config;
