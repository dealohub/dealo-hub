import type { Config } from 'tailwindcss';

/**
 * Dealo Hub — Tailwind Configuration
 *
 * Tokens synced with DESIGN.md v2.1:
 * - Color palette (Section 3)
 * - Typography scale (Section 4)
 * - RTL-first logical properties (Section 5)
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './messages/**/*.json',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',   // px-6 mobile
        md: '2rem',           // px-8 tablet
        lg: '3rem',           // px-12 desktop
      },
      screens: {
        '2xl': '1400px',      // Max container width
      },
    },
    extend: {
      // ---- Color tokens (DESIGN.md Section 3) ----
      colors: {
        // Surfaces
        'canvas-zinc': '#F4F4F5',
        'pure-surface': '#FFFFFF',
        'deep-layer': '#FAFAFA',

        // Text
        'charcoal-ink': '#18181B',
        'muted-steel': '#71717A',

        // Structural
        'ghost-border': 'rgba(228,228,231,0.7)',
        'whisper-divider': '#E4E4E7',

        // Single accent
        'warm-amber': {
          DEFAULT: '#D97706',
          50: '#FEF3E2',
          100: '#FDE4C3',
          200: '#FBC887',
          500: '#E48A21',
          600: '#D97706',
          700: '#B45309',
        },

        // Semantic
        'success-sage': '#16A34A',
        'danger-coral': '#DC2626',
        'caution-flax': '#CA8A04',
      },

      // ---- Typography ----
      fontFamily: {
        sans: ['var(--font-satoshi)', 'system-ui', 'sans-serif'],
        satoshi: ['var(--font-satoshi)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-ibm-arabic)', 'var(--font-satoshi)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Full scale matches DESIGN.md Section 4
        'display-xl':   ['clamp(3rem, 6vw, 5.5rem)',      { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display':      ['clamp(2rem, 4vw, 3.5rem)',      { lineHeight: '1.1',  letterSpacing: '-0.025em', fontWeight: '700' }],
        'heading-1':    ['clamp(1.5rem, 3vw, 2.25rem)',   { lineHeight: '1.2',  letterSpacing: '-0.02em',  fontWeight: '700' }],
        'heading-2':    ['clamp(1.25rem, 2.5vw, 1.75rem)',{ lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '600' }],
        'heading-3':    ['1.125rem',                       { lineHeight: '1.4',  letterSpacing: '-0.01em',  fontWeight: '600' }],
        'body-large':   ['1.0625rem',                      { lineHeight: '1.65', fontWeight: '400' }],
        'body':         ['1rem',                           { lineHeight: '1.6',  fontWeight: '400' }],
        'body-small':   ['0.875rem',                       { lineHeight: '1.55', fontWeight: '400' }],
        'caption':      ['0.75rem',                        { lineHeight: '1.4',  fontWeight: '500' }],
        'label':        ['0.6875rem',                      { lineHeight: '1.3',  letterSpacing: '0.08em', fontWeight: '500' }],
        'mono-data':    ['0.875rem',                       { lineHeight: '1.5',  fontWeight: '500' }],
      },

      // ---- Spacing (base 4px) ----
      spacing: {
        'section': 'clamp(4rem, 8vw, 7rem)',
      },

      // ---- Shadows (tinted zinc, never pure black) ----
      boxShadow: {
        'card': '0 1px 3px rgba(24,24,27,0.05), 0 4px 12px rgba(24,24,27,0.04)',
        'card-hover': '0 4px 16px rgba(24,24,27,0.08)',
        'category': '0 8px 24px rgba(24,24,27,0.08)',
        'toast': '0 8px 24px rgba(24,24,27,0.12)',
        'sticky-bottom': '0 -4px 12px rgba(24,24,27,0.06)',
        'none': 'none',
      },

      // ---- Motion (spring physics via easing) ----
      transitionTimingFunction: {
        'spring-overshoot': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '250': '250ms',
      },

      // ---- Border radius ----
      borderRadius: {
        'lg': '0.5rem',    // 8px — primary buttons
        'xl': '0.75rem',   // 12px — inputs
        '2xl': '1rem',     // 16px — cards
      },

      // ---- Animation ----
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'progress-bar': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        'ping-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer': 'shimmer 2s infinite',
        'progress-bar': 'progress-bar 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'ping-subtle': 'ping-subtle 2s ease-in-out infinite',
        'shake': 'shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
      },

      // ---- Height / width tokens ----
      minHeight: {
        'dvh-full': '100dvh',
        'dvh-hero': '85dvh',
      },
    },
  },
  plugins: [
    // Logical properties plugin (ms-* / me-* / ps-* / pe-*)
    require('tailwindcss-logical'),
    // Tabular nums for prices + data
    require('tailwindcss/plugin')(({ addUtilities }: any) => {
      addUtilities({
        '.tabular-nums': { 'font-variant-numeric': 'tabular-nums' },
        '.western-digits': { 'font-feature-settings': '"lnum"' },
      });
    }),
  ],
};

export default config;
