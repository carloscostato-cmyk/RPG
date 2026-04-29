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
        display: ['Cinzel', 'serif'],
        fantasy: ['Marcellus', 'serif'],
      },
      colors: {
        aether: {
          50: '#f4fbff',
          100: '#dff4ff',
          300: '#77d7ff',
          400: '#38bdf8',
          500: '#0ea5e9',
          700: '#0369a1',
        },
        crystal: {
          violet: '#8b5cf6',
          blue: '#2563eb',
          cyan: '#22d3ee',
          rose: '#f43f5e',
          gold: '#fbbf24',
          emerald: '#34d399',
        },
        night: {
          950: '#070816',
          900: '#0f1226',
          800: '#191d38',
          700: '#252a4d',
          600: '#343b66',
        },
        primary: {
          500: '#38bdf8',
          600: '#2563eb',
        },
        accent: {
          purple: '#8b5cf6',
          green: '#34d399',
          red: '#f43f5e',
          yellow: '#fbbf24',
        }
      },
      boxShadow: {
        'aether': '0 0 28px rgba(56, 189, 248, 0.28)',
        'crystal': '0 0 36px rgba(139, 92, 246, 0.32)',
        'gold': '0 0 26px rgba(251, 191, 36, 0.24)',
      },
      backgroundImage: {
        'aether-radial': 'radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.24), transparent 28%), radial-gradient(circle at 80% 10%, rgba(244, 63, 94, 0.18), transparent 24%), radial-gradient(circle at 50% 90%, rgba(251, 191, 36, 0.14), transparent 30%)',
        'crystal-panel': 'linear-gradient(135deg, rgba(15, 18, 38, 0.96), rgba(37, 42, 77, 0.9))',
      },
    },
  },
  plugins: [],
}
