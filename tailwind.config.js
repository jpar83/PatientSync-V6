import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['attr', 'data-theme'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'card': 'var(--shadow-card)',
      },
      colors: {
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        'neutral-bg': 'var(--color-neutral-bg)',
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        'border-color': 'var(--color-border)',
        accent: 'var(--color-accent)',
        highlight: '#fef9c3', // yellow-100
        'pc-blue': {
          50: 'var(--pc-blue-50)',
          600: 'var(--pc-blue-600)',
          700: 'var(--pc-blue-700)',
        },
      },
      ringColor: {
        'pc-focus': 'var(--pc-focus)',
      },
      borderColor: {
        'pc-blue-600': 'var(--pc-blue-600)',
      }
    },
  },
  plugins: [
    forms,
    typography,
    require('@tailwindcss/line-clamp'),
  ],
};
