/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Hanken Grotesk"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        paper: "#ECEFF4",      // cool architectural paper (app background)
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#0D1521",  // near-black navy for text/structure
          soft: "#586577",
        },
        line: "#E1E6EE",       // hairline borders on light chrome
        primary: {             // "yours" / primary action — indigo-violet
          DEFAULT: "#5A50E6",
          dark: "#463BCB",
          tint: "#ECEBFC",
          glow: "#8E84FF",
        },
        mint: {                // "available" — the only hot color, draws the eye
          DEFAULT: "#0FA876",
          node: "#34E0A1",
          tint: "#E3F7EF",
        },
        clay: {                // "taken" — recedes
          DEFAULT: "#5E6B7E",
          tint: "#EDF0F5",
        },
      },
      boxShadow: {
        panel: "0 1px 2px rgba(13,21,33,0.04), 0 12px 32px -16px rgba(13,21,33,0.20)",
        lift: "0 18px 50px -18px rgba(13,21,33,0.32)",
        drawer: "-24px 0 60px -30px rgba(13,21,33,0.45)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
