/** @type {import('tailwindcss').Config} */
/** Design tokens aligned with shared/design-tokens/CONTRACT.md */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--lp-primary)',
        'primary-active': 'var(--lp-primary-active)',
        'on-primary': 'var(--lp-on-primary)',
        dark: 'var(--lp-dark)',
        surface: 'var(--lp-bg-main)',
        accent: 'var(--lp-error)',
        muted: 'var(--lp-muted)',
        soft: 'var(--lp-line-soft)',
      },
      borderRadius: {
        sm: 'var(--lp-radius-sm)',
        md: 'var(--lp-radius-md)',
        lg: 'var(--lp-radius-lg)',
        xl: 'var(--lp-radius-xl)',
        'xl-mobile': 'var(--lp-radius-2xl)',
      },
      boxShadow: {
        soft: 'var(--lp-shadow-soft)',
        medium: 'var(--lp-shadow-card)',
      },
    },
  },
  plugins: [],
};
