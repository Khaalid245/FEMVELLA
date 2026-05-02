/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf4f7",
          100: "#fce8f1",
          500: "#d4547a",
          600: "#b8395f",
          700: "#962d4d",
          900: "#5c1a2e",
        },
        luxury: {
          bg:     "#FBF8F5",
          bgMid:  "#F0E8E0",
          bgDeep: "#E8D5C8",
          brown:  "#2C2420",
          muted:  "#6B5B55",
          gold:   "#C4985A",
          goldLight: "#D4AF7A",
        },
      },
      fontFamily: {
        sans:      ["Inter", "sans-serif"],
        serif:     ["Playfair Display", "serif"],
        editorial: ["Cormorant Garamond", "Cormorant", "Georgia", "serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-10px)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
