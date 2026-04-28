/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#111827',
          800: '#1f2937',
          700: '#374151',
          600: '#4b5563',
        },
        primary: {
          500: '#3b82f6',
          600: '#2563eb',
        },
        accent: {
          purple: '#8b5cf6',
          green: '#10b981',
          red: '#ef4444',
          yellow: '#f59e0b',
        }
      },
    },
  },
  plugins: [],
}