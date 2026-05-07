import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#02070d",
        panel: "rgba(6, 17, 27, 0.72)",
        cyanCore: "#58e6ff",
        blueCore: "#2f9cff",
        amberCore: "#ffbf5f",
        greenCore: "#7cf7bc",
      },
      boxShadow: {
        hud: "0 18px 70px rgba(0, 0, 0, 0.42), 0 0 34px rgba(88, 230, 255, 0.12)",
        glow: "0 0 28px rgba(88, 230, 255, 0.42)",
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
