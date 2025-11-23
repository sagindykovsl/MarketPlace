/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2f7f5',
          100: '#e1ebe6',
          200: '#c5d9d0',
          300: '#9ebfb2',
          400: '#739e8e',
          500: '#52796f', // Deep Sage
          600: '#3f6058',
          700: '#354f49',
          800: '#2f3e46', // Dark Slate
          900: '#29353b',
        },
        secondary: {
          50: '#fbfcf8',
          100: '#f6f9ef',
          200: '#e9edc9', // Sand
          300: '#dce3a3',
          400: '#ccd07a',
          500: '#b0b555',
          600: '#8c913d',
          700: '#6f7333',
          800: '#5a5d2e',
          900: '#4b4d29',
        },
        surface: '#ffffff',
        background: '#f4f7f5',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 0 0 1px rgba(0, 0, 0, 0.03), 0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
};

