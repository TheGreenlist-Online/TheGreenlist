/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'blacklist-dark': '#0f1419',
        'blacklist-gray': '#1a1f26',
        'blacklist-gray-light': '#2d3139',
        'blacklist-green': '#2d5a3d',
        'blacklist-green-bright': '#4a8f5e',
        'blacklist-accent-red': '#c41e3a',
        'blacklist-accent-yellow': '#f4d03f',
        'blacklist-text': '#e8e8e8',
      },
      backgroundImage: {
        'glassmorphism': 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0))',
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
      },
    },
  },
  plugins: [],
}