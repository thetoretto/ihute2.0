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
        success: { DEFAULT: '#22c55e', 50: '#f0fdf4', 100: '#dcfce7', 400: '#4ade80', 600: '#16a34a', 700: '#15803d' },
        info: { DEFAULT: '#3b82f6', 100: '#dbeafe', 700: '#1d4ed8' },
        danger: { DEFAULT: '#ef4444', 100: '#fee2e2', 700: '#b91c1c' },
        neutral: { 100: '#f1f5f9', 700: '#334155' },
      },
      borderRadius: {
        'xl-mobile': '32px',
      },
      boxShadow: {
        soft: '0 8px 30px rgb(0 0 0 / 0.04)',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
