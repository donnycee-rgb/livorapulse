/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        lp: {
          primary: '#4CAF50',
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
