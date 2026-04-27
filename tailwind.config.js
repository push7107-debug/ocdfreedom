/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        lab: {
          bg: "#0f172a",
          panel: "#111827",
          soft: "#1e293b",
          accent: "#38bdf8",
          text: "#e2e8f0",
          muted: "#94a3b8",
        },
      },
      boxShadow: {
        calm: "0 0 0 1px rgba(56, 189, 248, 0.25), 0 12px 30px rgba(0, 0, 0, 0.45)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        calmPulse: {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(56, 189, 248, 0.16)",
            transform: "scale(1)",
          },
          "50%": {
            boxShadow: "0 0 0 10px rgba(56, 189, 248, 0.04)",
            transform: "scale(1.01)",
          },
        },
      },
      animation: {
        rise: "rise 400ms ease-out",
        calmPulse: "calmPulse 2400ms ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
