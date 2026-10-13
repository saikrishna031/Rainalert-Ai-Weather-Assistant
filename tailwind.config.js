/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: { extend: { boxShadow: { glow: '0 0 0 1px rgba(14,165,233,.10), 0 24px 70px rgba(2,8,23,.18)' } } },
  plugins: []
};
