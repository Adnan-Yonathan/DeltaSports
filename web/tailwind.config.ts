import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0f172a",
          accent: "#38bdf8",
          subtle: "#1e293b",
          surface: "#111827",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        glow: "0 0 30px rgba(56, 189, 248, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
