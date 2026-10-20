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
        navy: {
          950: '#070b14', // Base body background
          900: '#0c1322', // Primary surface / sidebar
          850: '#111b2e', // Card background
          800: '#17233c', // Card hover / border high
          700: '#233554', // Subdued borders
          600: '#394e75', // Muted text / icons
        },
        trade: {
          green: '#10b981', // Profit / Buy / Gain
          'green-light': '#34d399',
          'green-dark': '#059669',
          'green-bg': 'rgba(16, 185, 129, 0.12)',
          red: '#ef4444', // Loss / Sell / Drop
          'red-light': '#f87171',
          'red-dark': '#dc2626',
          'red-bg': 'rgba(239, 68, 68, 0.12)',
          cyan: '#06b6d4', // Accents
          indigo: '#6366f1',
          gold: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace']
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        glow: '0 0 15px -3px rgba(99, 102, 241, 0.3)',
        'glow-green': '0 0 15px -3px rgba(16, 185, 129, 0.3)',
        'glow-red': '0 0 15px -3px rgba(239, 68, 68, 0.3)'
      }
    },
  },
  plugins: [],
}
