/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      boxShadow: {
        soft: "0 12px 40px -18px rgba(15, 23, 42, 0.35)",
        glow: "0 18px 60px -24px rgba(16, 185, 129, 0.35)",
      },
    },
  },
  plugins: [],
}
