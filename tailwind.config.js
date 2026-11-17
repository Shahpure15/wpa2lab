/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        bg:      'var(--bg)',
        surface: 'var(--surface)',
        border:  'var(--border)',
        txt:     'var(--text)',
        accent:  'var(--accent)',
        danger:  'var(--danger)',
        warn:    'var(--warn)',
        muted:   'var(--muted)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-once': {
          '0%,100%': { opacity: 1 },
          '50%':     { opacity: 0.5 },
        },
        'slide-in': {
          from: { opacity: 0, transform: 'translateX(-8px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.25s ease-out',
        'slide-in':   'slide-in 0.2s ease-out',
        'pulse-once': 'pulse-once 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
