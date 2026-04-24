/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffef0',
          100: '#fefcd6',
          200: '#fff3a1',
          300: '#ffe600',
          400: '#e6cf00',
          500: '#ffe600',
          600: '#ffe600',
          700: '#ccb800',
        },
        ey: {
          yellow: '#ffe600',
          black: '#2e2e38',
          gray: {
            50: '#f6f6f7',
            100: '#ededef',
            200: '#d8d8dc',
            300: '#b0b0b8',
            400: '#83838f',
            500: '#6c6c78',
            600: '#5c5c66',
            700: '#4e4e56',
            800: '#3c3c44',
            900: '#2e2e38',
          },
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(46, 46, 56, 0.08)',
      },
      fontFamily: {
        sans: ['"EYInterstate"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
