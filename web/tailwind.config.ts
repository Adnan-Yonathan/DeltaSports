import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0f172a",
          accent: "#38bdf8",
          subtle: "#1e293b"
        }
      }
    }
  },
  plugins: []
};

export default config;
