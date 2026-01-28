/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          main: 'var(--primary-main)',
          light: 'var(--primary-light)',
          dark: 'var(--primary-dark)',
          // Mapping for backward compatibility
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: 'var(--primary-light)',
          500: 'var(--primary-main)',
          600: 'var(--primary-dark)',
          700: 'var(--primary-dark)',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        neutral: {
          light: 'var(--neutral-light)',
          dark: 'var(--neutral-dark)',
          white: 'var(--neutral-white)',
        },
        secondary: {
          'purple-1': 'var(--secondary-purple-1)',
          'purple-2': 'var(--secondary-purple-2)',
          blue: 'var(--secondary-blue)',
          lavender: 'var(--secondary-lavender)',
          pink: 'var(--secondary-pink)',
          green: 'var(--secondary-green)',
        },
        semantic: {
          success: 'var(--success)',
          warning: 'var(--warning)',
          error: 'var(--error)',
          info: 'var(--info)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          disabled: 'var(--text-disabled)',
          inverse: 'var(--text-inverse)',
        },
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        }
      },
      backgroundImage: {
        'gradient-main': 'var(--gradient-main)',
        'gradient-card': 'var(--gradient-card)',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
