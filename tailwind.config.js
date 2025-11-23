/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <--- VÉRIFIE CETTE LIGNE À LA LETTRE PRÈS
  ],
  theme: {
    extend: {
      colors: {
        cesi: { yellow: '#f7e34f', black: '#000000' },
        apple: { gray: '#F5F5F7', card: '#FFFFFF' }
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] }
    },
  },
  plugins: [],
}
