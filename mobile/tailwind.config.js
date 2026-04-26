// NativeWind palette mirrors src/theme/index.ts (Signal palette from the design handoff).
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0B0B0F',
          elevated: '#111116',
          card: '#141418',
          card2: '#1C1C24',
          card3: '#252530',
        },
        brand: {
          DEFAULT: '#3B82F6',
          soft: 'rgba(59,130,246,0.13)',
          muted: '#2563EB',
          accent: '#10B981',
        },
        text: {
          DEFAULT: '#FFFFFF',
          muted: '#9CA3AF',
          faint: '#6B7280',
        },
        line: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          strong: 'rgba(255,255,255,0.13)',
        },
      },
      borderRadius: {
        card: '16px',
        pill: '100px',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
