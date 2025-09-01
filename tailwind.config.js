/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,context,hooks,pages,App,types}/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
