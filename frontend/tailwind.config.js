/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4ff',
          100: '#dbe7fe',
          200: '#bfd4fe',
          300: '#93b8fd',
          400: '#6093fa',
          500: '#3b6cf6',
          600: '#254deb',
          700: '#1d39d8',
          800: '#1e31af',
          900: '#1e2f8a',
          950: '#172054',
        },
        brand: {
          50: '#fffaeb',
          100: '#fef1c7',
          200: '#fde28a',
          300: '#fccc4d',
          400: '#fbb424',
          500: '#f5940b',
          600: '#d96f06',
          700: '#b44c08',
          800: '#923b0e',
          900: '#78310f',
          950: '#451703',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 2px 4px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.12)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'slide-in-right': 'slide-in-right 0.3s ease-out both',
      },
    },
  },
  plugins: [],
}
