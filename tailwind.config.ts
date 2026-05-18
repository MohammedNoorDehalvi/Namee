import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}', './hooks/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        apl: { dark: '#050A08', panel: '#0B1711', green: '#16A34A', neon: '#4ADE80', gold: '#F6C343', amber: '#D99D1E' }
      },
      boxShadow: { glow: '0 0 42px rgba(246, 195, 67, 0.18)', greenGlow: '0 0 42px rgba(74, 222, 128, 0.18)' },
      backgroundImage: {
        stadium: 'radial-gradient(circle at top, rgba(22,163,74,0.25), transparent 35%), radial-gradient(circle at 80% 20%, rgba(246,195,67,0.2), transparent 32%), linear-gradient(135deg, #050A08, #0B1711 50%, #050A08)'
      }
    }
  },
  plugins: []
};
export default config;
