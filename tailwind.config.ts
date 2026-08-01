import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}', './hooks/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        apl: {
          dark: '#030605',
          panel: '#0A1510',
          green: '#16A34A',
          neon: '#4ADE80',
          gold: '#F6C343',
          'gold-light': '#F5C85C',
          amber: '#D99D1E',
          paper: '#E9EBE3',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      boxShadow: {
        glow: '0 0 48px rgba(246, 195, 67, 0.18)',
        'glow-lg': '0 0 80px rgba(246, 195, 67, 0.25)',
        greenGlow: '0 0 48px rgba(74, 222, 128, 0.18)',
        'card-hover': '0 24px 64px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(246, 195, 67, 0.12)',
      },
      backgroundImage: {
        stadium:
          "url('/images/apl-stadium-night.png'), radial-gradient(circle at top, rgba(22,163,74,0.25), transparent 35%), radial-gradient(circle at 80% 20%, rgba(246,195,67,0.2), transparent 32%), linear-gradient(135deg, rgba(3,6,5,0.75), rgba(10,21,16,0.85))",
      },
      keyframes: {
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
