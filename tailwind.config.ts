import type { Config } from 'tailwindcss';

const config: Config = {
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
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: '#0f1e3d',
          hover: '#1a2f56',
          active: '#2a4070',
          text: '#94a3c0',
          textActive: '#ffffff',
        },
        capelli: {
          navy: '#1d4ed8',
          navyDark: '#1e3a8a',
          navyLight: '#3b82f6',
          red: '#CC0000',
          redLight: '#ef4444',
          blue: '#2563eb',
          success: '#16a34a',
          successBg: '#f0fdf4',
          warning: '#d97706',
          warningBg: '#fffbeb',
          danger: '#dc2626',
          dangerBg: '#fef2f2',
          info: '#0284c7',
          infoBg: '#f0f9ff',
          purple: '#7c3aed',
          purpleBg: '#faf5ff',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'check-bounce': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'overlay-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.35s ease-out',
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        shimmer: 'shimmer 1.5s infinite',
        'check-bounce': 'check-bounce 0.3s ease-out',
        'pop-in': 'pop-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        'overlay-in': 'overlay-in 0.15s ease-out',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['var(--font-outfit)', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 24px -8px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 20px 40px -12px rgba(15, 23, 42, 0.15), 0 0 40px 0 rgba(37, 99, 235, 0.05)',
        sidebar: '12px 0 48px -12px rgba(15, 23, 42, 0.15)',
        glow: '0 0 20px rgba(37, 99, 235, 0.3)',
        glass: 'inset 0 1px 0 0 rgba(255,255,255,0.6), 0 8px 30px -12px rgba(15,23,42,0.18)',
        palette: '0 24px 70px -20px rgba(15,23,42,0.45), inset 0 1px 0 0 rgba(255,255,255,0.7)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
