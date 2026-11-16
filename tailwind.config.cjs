/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        // Theme colours from src/styles/globals.css (light and dark values)
        ui: {
          bg: 'rgb(var(--ui-bg) / <alpha-value>)',
          card: 'rgb(var(--ui-card) / <alpha-value>)',
          raised: 'rgb(var(--ui-raised) / <alpha-value>)',
          ink: 'rgb(var(--ui-ink) / <alpha-value>)',
          muted: 'rgb(var(--ui-muted) / <alpha-value>)',
          line: 'rgb(var(--ui-line) / <alpha-value>)',
        },
        lp: {
          primary: 'rgb(var(--lp-primary) / <alpha-value>)',
          btn: 'rgb(var(--lp-btn) / <alpha-value>)',
          'btn-ink': 'rgb(var(--lp-btn-ink) / <alpha-value>)',
          secondary: '#1E3A8A',
          accent: '#00BCD4',
          alert: '#FF6B6B',
          neutral: '#F5F5F5',
          white: '#FFFFFF',
          text: '#2D2D2D',
        },
      },
      boxShadow: {
        card: '0 10px 25px rgba(0,0,0,0.06)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0px)' },
        },
        softPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.92' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 400ms ease-out',
        softPulse: 'softPulse 3.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
