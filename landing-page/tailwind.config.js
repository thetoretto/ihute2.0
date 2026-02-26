/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--lp-primary)',
        dark: 'var(--lp-text)',
        surface: 'var(--lp-bg-main)',
        accent: 'var(--lp-error)',
        muted: 'var(--lp-muted)',
        soft: 'var(--lp-line-soft)',
      },
      borderRadius: {
        'xl-mobile': '32px',
      },
      boxShadow: {
        soft: 'var(--lp-shadow-soft)',
      },
    },
  },
  plugins: [],
};
