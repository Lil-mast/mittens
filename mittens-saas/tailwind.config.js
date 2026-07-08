/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        black:   '#08080D',
        surface: '#0F0F18',
        panel:   '#141420',
        border:  '#1E1E2E',
        text:    '#F0EBE0',
        muted:   '#6E6C7E',
        accent:  '#FF8A3D',
        'accent-soft': 'rgba(255,138,61,0.08)',
      },
      fontFamily: {
        serif:  ['Instrument Serif', 'Georgia', 'serif'],
        sans:   ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        marquee:  'marquee 28s linear infinite',
        spotlight:'spotlight 8s ease-in-out infinite',
        blink:    'blink 3s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        spotlight: {
          '0%,100%': { transform: 'translate(-20%, -20%) scale(1)' },
          '50%':     { transform: 'translate(20%, 20%) scale(1.15)' },
        },
        blink: {
          '0%,90%,100%': { transform: 'scaleY(1)' },
          '95%':          { transform: 'scaleY(0.05)' },
        },
      },
    },
  },
  plugins: [],
}