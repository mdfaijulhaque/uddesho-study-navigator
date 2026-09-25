/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0E1A33", soft: "#4A5875", faint: "#8792AB" },
        paper: "#FAFBFF",
        // Colors pulled straight from the Uddesho logo
        blue: {
          50: "#EEF5FF", 100: "#DCEAFF", 200: "#B9D4FF", 300: "#8AB8FF", 400: "#4D92FC",
          500: "#1D7BFB", 600: "#086AFA", 700: "#0654C9", 800: "#0A459E", 900: "#0C3878",
        },
        orange: {
          50: "#FFF6E6", 100: "#FFEACC", 200: "#FFD599", 300: "#FFBC5C", 400: "#FFAB2B",
          500: "#FF9F04", 600: "#D98300", 700: "#A86400",
        },
        red: {
          50: "#FFF0F0", 100: "#FFDDDD", 200: "#FFBABB", 300: "#FC8C8D", 400: "#FA5758",
          500: "#F93334", 600: "#D71F21", 700: "#AD1719",
        },
        mint: {
          50: "#E8FFF8", 100: "#C4FCEA", 200: "#8DF7D8", 300: "#4BEFC3", 400: "#04E6B4",
          500: "#03C99C", 600: "#03A47E", 700: "#057F62", 800: "#065F4A",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(14,26,51,.04), 0 8px 24px -8px rgba(14,26,51,.10)",
        lift: "0 2px 4px rgba(14,26,51,.05), 0 18px 40px -12px rgba(14,26,51,.18)",
        "glow-blue": "0 10px 28px -8px rgba(8,106,250,.55)",
        "glow-mint": "0 10px 28px -8px rgba(4,230,180,.6)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(.6)", opacity: "0" },
          "70%": { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        rise: {
          "0%": { transform: "translateY(14px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bob: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        pop: "pop .55s cubic-bezier(.2,.9,.3,1.2) both",
        rise: "rise .5s ease-out both",
        bob: "bob 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
