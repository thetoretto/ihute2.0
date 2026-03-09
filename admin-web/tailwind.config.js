/** @type {import('tailwindcss').Config} */
/** Design tokens aligned with shared/design-tokens/CONTRACT.md */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FEE46B',
        'primary-active': '#FDD835',
        'on-primary': '#171C22',
        dark: '#171C22',
        surface: '#F8F3EF',
        accent: '#DF0827',
        muted: '#64748B',
        soft: '#E6DBEB',
        success: { DEFAULT: '#22c55e', 50: '#f0fdf4', 100: '#dcfce7', 400: '#4ade80', 600: '#16a34a', 700: '#15803d' },
        info: { DEFAULT: '#3b82f6', 100: '#dbeafe', 700: '#1d4ed8' },
        danger: { DEFAULT: '#DF0827', 100: '#fee2e2', 700: '#b91c1c' },
        neutral: { 100: '#f1f5f9', 700: '#334155' },
      },
      spacing: {
        4.5: '12px',
        6.5: '16px',
        7.5: '24px',
        10: '40px',
        12: '48px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        'xl-mobile': '24px',
      },
      boxShadow: {
        soft: '0 8px 30px rgb(0 0 0 / 0.04)',
        medium: '0 4px 12px rgb(0 0 0 / 0.06)',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      maxWidth: {
        'truncate-name': '120px',
      },
      width: {
        'modal': '90%',
      },
      zIndex: {
        'modal': 1000,
      },
      fontSize: {
        xs: ['10px', { lineHeight: '1.2' }],
        sm: ['12px', { lineHeight: '1.4' }],
        md: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg: ['18px', { lineHeight: '1.4' }],
        xl: ['20px', { lineHeight: '1.3' }],
        '2xl': ['28px', { lineHeight: '1.2' }],
        '3xl': ['32px', { lineHeight: '1.2' }],
      },
    },
  },
  plugins: [],
};
