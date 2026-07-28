/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8ECF0',
          100: '#C5CDD9',
          200: '#9EABBF',
          300: '#7789A5',
          400: '#50678B',
          500: '#2A4571',
          600: '#0A2240',
          700: '#081B34',
          800: '#061428',
          900: '#040D1C',
          950: '#02060E',
        },
        accent: {
          50: '#FEF2EC',
          100: '#FDE0D0',
          200: '#FBC4A8',
          300: '#F9A880',
          400: '#F48C58',
          500: '#EE7030',
          600: '#E86014',
          700: '#C05010',
          800: '#98400C',
          900: '#703008',
          950: '#482004',
        },
        surface: {
          50: '#F4F7F6',
          100: '#E8EDEC',
          200: '#D1D8D6',
          300: '#B0B9B6',
          400: '#8C9692',
          500: '#6C757D',
          600: '#535B61',
          700: '#3B4146',
          800: '#23282B',
          900: '#1A1E21',
          950: '#0D0F11',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(232, 96, 20, 0.15)',
        'glow-lg': '0 0 40px rgba(232, 96, 20, 0.2)',
        'premium': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
        'premium-lg': '0 4px 6px rgba(0,0,0,0.02), 0 10px 30px rgba(0,0,0,0.08)',
        'premium-xl': '0 8px 16px rgba(0,0,0,0.04), 0 20px 50px rgba(0,0,0,0.1)',
        'navy': '0 4px 20px rgba(10, 34, 64, 0.12)',
        'orange': '0 4px 20px rgba(232, 96, 20, 0.2)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0A2240 0%, #081B34 100%)',
        'gradient-brand-light': 'linear-gradient(135deg, #E8ECF0 0%, #F4F7F6 100%)',
        'gradient-orange': 'linear-gradient(135deg, #E86014 0%, #C05010 100%)',
        'gradient-orange-subtle': 'linear-gradient(135deg, #FEF2EC 0%, #FDE0D0 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #0A2240 0%, #081B34 50%, #040D1C 100%)',
        'gradient-hero': 'linear-gradient(135deg, #ffffff 50%, #F4F7F6 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
