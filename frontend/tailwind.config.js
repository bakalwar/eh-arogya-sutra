/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        site: {
          bg: '#060d07',
          surface: '#0b1a0d'
        },
        eh: {
          bg: '#080f09',
          surface: '#0e1a0f',
          card: '#121f13',
          gold: '#c9963a',
          gold2: '#e8c46a',
          mint: '#4a9b54',
          sage: '#2d6a35'
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'serif'],
        tagline: ['Cormorant Garamond', 'Georgia', 'serif']
      },
      boxShadow: {
        'eh-sm': '0 2px 12px -2px rgba(0,0,0,0.45)',
        'eh-md': '0 8px 32px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,150,58,0.07)',
        'eh-lg': '0 16px 48px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,150,58,0.08)',
        'eh-inset': 'inset 0 1px 0 0 rgba(255,255,255,0.04)'
      }
    }
  },
  plugins: []
};
