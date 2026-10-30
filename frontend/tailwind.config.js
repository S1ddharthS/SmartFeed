/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        app: '#F8FAFC',
        surface: '#FFFFFF',
        line: '#E8EDF2',
        ink: {
          DEFAULT: '#172033',
          soft: '#64748B',
          mute: '#94A3B8',
        },
        brand: {
          50: '#E9F8F0',
          100: '#C3EED7',
          200: '#9EE4BE',
          300: '#69D39E',
          400: '#34BF7D',
          500: '#16A36A',
          600: '#138A5A',
          700: '#0E734A',
          800: '#0A5738',
          900: '#073E28',
        },
        // Backward-compatible alias for leaf -> brand
        leaf: {
          50: '#E9F8F0',
          100: '#C3EED7',
          200: '#9EE4BE',
          300: '#69D39E',
          400: '#34BF7D',
          500: '#16A36A',
          600: '#138A5A',
          700: '#0E734A',
          800: '#0A5738',
          900: '#073E28',
        },
        cream: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
        },
        success: {
          DEFAULT: '#16A36A',
          soft: '#E9F8F0',
          border: '#C3EED7',
        },
        warning: {
          DEFAULT: '#E9A23B',
          soft: '#FEF6E9',
          border: '#FADCB3',
        },
        error: {
          DEFAULT: '#E05252',
          soft: '#FDEDED',
          border: '#F7C7C7',
        },
        urgent: {
          DEFAULT: '#E05252',
          soft: '#FDEDED',
          border: '#F7C7C7',
        },
        info: {
          DEFAULT: '#3984D6',
          soft: '#EBF3FC',
          border: '#BED9F7',
        },
        soon: {
          DEFAULT: '#E9A23B',
          soft: '#FEF6E9',
          border: '#FADCB3',
        },
        safe: {
          DEFAULT: '#16A36A',
          soft: '#E9F8F0',
          border: '#C3EED7',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['Inter', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(23, 32, 51, 0.04), 0 1px 2px -1px rgba(23, 32, 51, 0.03)',
        'card-hover': '0 4px 12px 0 rgba(23, 32, 51, 0.05), 0 1px 3px 0 rgba(23, 32, 51, 0.04)',
        elevated: '0 10px 25px -5px rgba(23, 32, 51, 0.05), 0 8px 10px -6px rgba(23, 32, 51, 0.03)',
        modal: '0 20px 25px -5px rgba(23, 32, 51, 0.08), 0 8px 10px -6px rgba(23, 32, 51, 0.04)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}