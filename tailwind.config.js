/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        barely: {
          bg: "#0a0a0a",
          surface: "#111111",
          elevated: "#1a1a1a",
          border: "#222222",
          borderMd: "#2d2d2d",
          accent: "#d4ff00",
          work: "#60a5fa",
          personal: "#c084fc",
          success: "#4ade80",
          danger: "#f87171",
          warn: "#fb923c",
          t1: "#f0f0f0",
          t2: "#888888",
          t3: "#444444",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
        mono: ['"SF Mono"', '"Fira Code"', '"Cascadia Code"', "Consolas", "monospace"],
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { transform: "translateY(16px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        pulseRing: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(248,113,113,0.3)" },
          "50%": { boxShadow: "0 0 0 12px rgba(248,113,113,0)" },
        },
        blink: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0" } },
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease",
        "slide-up": "slideUp 0.2s ease",
        "pulse-ring": "pulseRing 1.5s ease-in-out infinite",
        blink: "blink 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
