/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FEE46B',
        dark: '#171C22',
        surface: '#F8F3EF',
        accent: '#DF0827',
        muted: '#94A9BC',
        soft: '#E6DBEB',
      },
      borderRadius: {
        'xl-mobile': '32px',
      },
      boxShadow: {
        soft: '0 8px 30px rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
};
