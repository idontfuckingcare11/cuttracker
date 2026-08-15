export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'rgb(255 255 255)',
          alt: 'rgb(247 247 248)'
        },
        ink: {
          DEFAULT: 'rgb(17 17 19)',
          muted: 'rgb(92 92 102)',
          faint: 'rgb(140 140 150)'
        },
        brand: {
          DEFAULT: 'rgb(17 17 19)',
          accent: 'rgb(67 67 77)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem'
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 1px 3px rgb(0 0 0 / 0.06)',
        pop: '0 4px 12px rgb(0 0 0 / 0.10)'
      }
    }
  },
  plugins: []
};
