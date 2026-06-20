/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        parchment: "#F5F1E8",
        surface: {
          DEFAULT: "#FFFFFF",
          sunken: "#FBF7EF",
        },
        ink: {
          DEFAULT: "#211D17",
          soft: "#5C5247",
          muted: "#8A7E6B",
        },
        line: {
          DEFAULT: "#E5DDC8",
          soft: "#EEE6D4",
        },
        amber: {
          DEFAULT: "#B45309",
          soft: "#FBEDD8",
          ink: "#7A3A06",
        },
        sage: {
          DEFAULT: "#3F6B5A",
          soft: "#E3EDE7",
          ink: "#2C4D40",
        },
        indigo: {
          DEFAULT: "#3B5B8C",
          soft: "#E4EAF3",
        },
        clay: {
          DEFAULT: "#9C8E6E",
          soft: "#F0EADB",
        },
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(33, 29, 23, 0.04), 0 1px 3px rgba(33, 29, 23, 0.03)",
        lift: "0 4px 16px -6px rgba(33, 29, 23, 0.12), 0 2px 6px -3px rgba(33, 29, 23, 0.06)",
        glow: "0 0 0 3px rgba(180, 83, 9, 0.12)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        draw: {
          "0%": { "stroke-dashoffset": "1000" },
          "100%": { "stroke-dashoffset": "0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.4s ease both",
        "scale-in": "scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        draw: "draw 1.6s ease-out forwards",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
