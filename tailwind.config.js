/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#f0f9f0',
          100: '#dcf2dc',
          200: '#bde4bd',
          300: '#8ecf8e',
          400: '#5ab05a',
          500: '#3d8b3d',
          600: '#2f6e2f',
          700: '#265826',
          800: '#204620',
          900: '#1a381a',
          950: '#0f1f0f',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#262626',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: '#a3d93b',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        surface: '#0b0d0b',
        text: '#f7f7f2',
        brand: {
          panel: '#0d120f',
          raised: '#141c17',
          black: '#050605',
          gold: '#c9a227',
          lime: '#a3d93b',
          green: '#4ea83f',
        },
        // The app used Tailwind's stock emerald (a blue-leaning teal) in ~300
        // places, which fought the logo's yellow-green. Retinting the ramp
        // brings every existing usage onto the brand palette at once.
        // Amber carries caution/pending meaning in ~40 places (status badges,
        // notices). Stock amber is an orange that clashes with the logo, so the
        // ramp is retinted to the brand gold and the semantics survive.
        amber: {
          50: '#fbf6e4',
          100: '#f6ecc2',
          200: '#ecd88c',
          300: '#e0be5c',
          400: '#d2ae3f',
          500: '#c9a227',
          600: '#a8851f',
          700: '#816619',
          800: '#574513',
          900: '#33280d',
          950: '#1d1707',
        },
        emerald: {
          50: '#f5fbe8',
          100: '#eaf6cf',
          200: '#cfe9a0',
          300: '#a3d93b',
          400: '#7ec13a',
          500: '#4ea83f',
          600: '#3d8a33',
          700: '#2f6b29',
          800: '#254f21',
          900: '#1d3f16',
          950: '#06110a',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
