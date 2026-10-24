/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B2D4A',
          'navy-dark': '#071C2E',
          'navy-light': '#13446E',
          green: '#10B981',
          'green-hover': '#059669',
          'green-light': '#ECFDF5',
          bg: '#F1F5F9',
          surface: '#EAF0F6',
          text: '#102747',
          muted: '#64748B',
          border: '#E2E8F0'
        }
      },
      fontFamily: {
        arabic: ['Cairo', 'sans-serif'],
        english: ['Tajawal', 'sans-serif']
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(11, 45, 74, 0.08), 0 2px 6px -1px rgba(11, 45, 74, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(11, 45, 74, 0.12), 0 4px 10px -2px rgba(11, 45, 74, 0.06)',
        'elevated': '0 20px 25px -5px rgba(11, 45, 74, 0.15), 0 8px 10px -6px rgba(11, 45, 74, 0.1)'
      }
    },
  },
  plugins: [],
}
