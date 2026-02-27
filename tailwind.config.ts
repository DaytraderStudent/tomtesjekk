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
        success: "#2ECC71",
        warning: "#F39C12",
        danger: "#E74C3C",
        surface: "#F8F9FA",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-source-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
