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
        // Status colors to match index.css
        red: {
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        yellow: {
          100: '#fefcbf',
          300: '#fde68a',
          800: '#a16207',
          900: '#854d0e',
        },
        green: {
          100: '#dcfce7',
          300: '#86efac',
          800: '#166534',
          900: '#14532d',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          600: '#4b5563',
          900: '#111827',
        },
        slate: {
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Keep existing dental colors as fallback
        dental: {
          primary: '#2563eb',
          secondary: '#06b6d4',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          light: '#f8fafc',
          dark: '#1e293b',
        },
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