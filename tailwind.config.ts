import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Editorial Nordic palette ---
        // Paper tones (warm, not stark white)
        paper: {
          DEFAULT: "#F5F2EB", // warm cream, main background
          soft: "#FBF9F4", // card background
          edge: "#E9E4D8", // border / separator
          deep: "#EDE8DC", // pressed / hover
        },
        // Ink tones (warm near-black)
        ink: {
          DEFAULT: "#0F0F11", // main text
          soft: "#2A2A2F", // secondary text
          muted: "#6B6B73", // tertiary / labels
          faint: "#9C9CA3", // disabled
        },
        // Accent: Clay (terracotta) — used sparingly for warmth and warnings
        clay: {
          50: "#FBEFEB",
          100: "#F5D9CF",
          200: "#E9B29D",
          300: "#DB886A",
          400: "#CD6240",
          500: "#C64B3F", // primary accent
          600: "#A63A2F",
          700: "#832B24",
          800: "#5F1E19",
          900: "#3C120F",
        },
        // Secondary: Moss — subtler Nordic forest green
        moss: {
          50: "#EEF2EC",
          100: "#D8E0D4",
          200: "#B1C1A8",
          300: "#89A37D",
          400: "#647E58",
          500: "#4A624A", // secondary accent
          600: "#3B4F3B",
          700: "#2B3B2C",
          800: "#1C281D",
          900: "#10150F",
        },
        // Data traffic-light colors — vivid enough to be clearly readable
        data: {
          green: "#22A355",
          amber: "#E5970F",
          red: "#DC3B2A",
          gray: "#8E8473",
        },
        // Legacy fjord (kept for backward compat during transition)
        fjord: {
          50: "#E8EEF5",
          100: "#D1DDEB",
          200: "#A3BBD7",
          300: "#7599C3",
          400: "#4777AF",
          500: "#1B3F6E",
          600: "#163358",
          700: "#102642",
          800: "#0B1A2C",
          900: "#050D16",
        },
        success: "#4A7C59",
        warning: "#C18A2F",
        danger: "#B8412C",
        surface: "#F5F2EB",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-bricolage)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(3.5rem, 8vw, 6rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2.5rem, 6vw, 4.5rem)", { lineHeight: "1", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-sm": ["clamp(1.5rem, 3vw, 2rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      boxShadow: {
        editorial: "0 1px 2px rgba(15, 15, 17, 0.04), 0 1px 3px rgba(15, 15, 17, 0.06)",
        "editorial-lg": "0 4px 12px rgba(15, 15, 17, 0.06), 0 1px 3px rgba(15, 15, 17, 0.04)",
        "editorial-xl": "0 10px 40px -12px rgba(15, 15, 17, 0.12), 0 4px 12px rgba(15, 15, 17, 0.06)",
      },
      borderRadius: {
        editorial: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
