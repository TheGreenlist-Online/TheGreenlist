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
          DEFAULT: '#00ff88',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        neon: '#39ff88',
        surface: '#1a1a1a',
        text: '#ffffff',
        smoke: {
          100: '#c8d4cc',
          200: '#9daaa3',
          300: '#72807a',
          400: '#4a5450',
          500: '#2c3330',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Barlow Condensed"', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'shimmer-glow': 'shimmer-glow 6s ease-in-out infinite',
        'neon-pulse': 'neon-pulse 3.5s ease-in-out infinite',
        'smoke-drift': 'smoke-drift 12s ease-in-out infinite',
        'card-border-glow': 'card-border-glow 4s ease-in-out infinite',
      },
      keyframes: {
        'shimmer-glow': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%':       { opacity: '0.85', transform: 'scale(1.06)' },
        },
        'neon-pulse': {
          '0%, 100%': { textShadow: '0 0 8px rgba(57,255,136,0.45), 0 0 18px rgba(57,255,136,0.25)' },
          '50%':       { textShadow: '0 0 18px rgba(57,255,136,0.85), 0 0 38px rgba(57,255,136,0.5), 0 0 60px rgba(57,255,136,0.2)' },
        },
        'smoke-drift': {
          '0%':   { transform: 'translateY(0) translateX(0) rotate(0deg)',    opacity: '0.3' },
          '33%':  { transform: 'translateY(-14px) translateX(8px) rotate(2deg)',  opacity: '0.5' },
          '66%':  { transform: 'translateY(-8px) translateX(-6px) rotate(-1.5deg)', opacity: '0.4' },
          '100%': { transform: 'translateY(0) translateX(0) rotate(0deg)',    opacity: '0.3' },
        },
        'card-border-glow': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(57,255,136,0.06)' },
          '50%':       { boxShadow: '0 0 24px rgba(57,255,136,0.16)' },
        },
      },
    },
  },
  plugins: [],
}
