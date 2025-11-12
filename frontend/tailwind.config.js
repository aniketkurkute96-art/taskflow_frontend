/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lightBG: '#f8fafc',
        lightBorder: '#e2e8f0',
        lightPrimary: '#2563eb',
        darkBG: '#0f172a',
        darkSurface: '#1e293b',
        darkAccent: '#38bdf8',
      },
    },
  },
  plugins: [],
}

