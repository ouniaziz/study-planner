/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#080814',
          surface: '#0F0F1E',
          card:    '#15152A',
          elevated:'#1C1C35',
          border:  '#2A2A4A',
        },
        primary: {
          DEFAULT: '#7C3AED',
          light:   '#9F5AF7',
          dark:    '#5B21B6',
          glow:    'rgba(124,58,237,0.3)',
        },
        accent: {
          cyan:  '#06B6D4',
          pink:  '#EC4899',
          amber: '#F59E0B',
          green: '#10B981',
        },
        text: {
          primary:   '#F1F5F9',
          secondary: '#94A3B8',
          muted:     '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7C3AED, #06B6D4)',
        'gradient-card':    'linear-gradient(145deg, #15152A, #1C1C35)',
        'gradient-glow':    'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.15), transparent 70%)',
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(124,58,237,0.25)',
        'glow-md': '0 0 30px rgba(124,58,237,0.35)',
        'glow-lg': '0 0 60px rgba(124,58,237,0.4)',
        'card':    '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in':     'fadeIn 0.4s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
}
