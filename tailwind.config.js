/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dynamic theme colors using CSS variables
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: 'color-mix(in srgb, var(--color-primary) 5%, white)',
          100: 'color-mix(in srgb, var(--color-primary) 10%, white)',
          200: 'color-mix(in srgb, var(--color-primary) 20%, white)',
          300: 'color-mix(in srgb, var(--color-primary) 30%, white)',
          400: 'color-mix(in srgb, var(--color-primary) 40%, white)',
          500: 'var(--color-primary)',
          600: 'color-mix(in srgb, var(--color-primary) 80%, black)',
          700: 'color-mix(in srgb, var(--color-primary) 70%, black)',
          800: 'color-mix(in srgb, var(--color-primary) 60%, black)',
          900: 'color-mix(in srgb, var(--color-primary) 50%, black)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          50: 'color-mix(in srgb, var(--color-secondary) 5%, white)',
          100: 'color-mix(in srgb, var(--color-secondary) 10%, white)',
          500: 'var(--color-secondary)',
          600: 'color-mix(in srgb, var(--color-secondary) 80%, black)',
        },
        accent: 'var(--color-accent)',
        // Keep existing dental colors as fallback
        dental: {
          primary: '#2563eb',
          secondary: '#06b6d4',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          light: '#f8fafc',
          dark: '#1e293b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
      },
      backgroundColor: {
        'surface': 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-variant': 'rgb(var(--color-surface-variant) / <alpha-value>)',
      },
      textColor: {
        'on-surface': 'rgb(var(--color-on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--color-on-surface-variant) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}