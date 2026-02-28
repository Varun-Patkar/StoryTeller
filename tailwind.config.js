/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        crimsonFlame: '#d8031c',   // Red accent (replaces dreamGold)
        cosmicBlue: '#0E4C92',     // Blue primary theme (replaces voidPurple)
        starSilver: '#E2E8F0',     // Text color
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
