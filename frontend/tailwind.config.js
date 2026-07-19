/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#0b1220",
        surface: "#121b2e",
        surface2: "#1a2740",
        border: "#263652",
        amber: "#e8b54d",
      },
    },
  },
  plugins: [],
};
