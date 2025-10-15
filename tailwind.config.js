/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        linear: {
          bg: '#08090a',
          'bg-elevated': '#0c0d0e',
          'bg-subtle': '#0f1011',
          'bg-secondary': '#161718',
          'bg-tertiary': '#1a1b1c',
          'bg-hover': 'rgba(255, 255, 255, 0.03)',
          'bg-active': 'rgba(255, 255, 255, 0.05)',

          border: '#232426',
          'border-subtle': '#1a1b1c',
          'border-strong': '#2e2f31',
          'border-hover': '#3a3b3d',

          accent: '#ffffff',
          'accent-hover': '#f5f5f5',
          'accent-active': '#e5e5e5',
          'accent-subtle': 'rgba(255, 255, 255, 0.1)',
          'accent-border': 'rgba(255, 255, 255, 0.3)',

          success: '#3dd68c',
          'success-subtle': 'rgba(61, 214, 140, 0.1)',
          'success-border': 'rgba(61, 214, 140, 0.3)',

          warning: '#f2994a',
          'warning-subtle': 'rgba(242, 153, 74, 0.1)',
          'warning-border': 'rgba(242, 153, 74, 0.3)',

          error: '#ec5962',
          'error-subtle': 'rgba(236, 89, 98, 0.1)',
          'error-border': 'rgba(236, 89, 98, 0.3)',

          info: '#4ea7fc',
          'info-subtle': 'rgba(78, 167, 252, 0.1)',
          'info-border': 'rgba(78, 167, 252, 0.3)',

          chart: {
            1: '#5E6AD2',
            2: '#4ea7fc',
            3: '#3dd68c',
            4: '#f2994a',
            5: '#ec5962',
            6: '#a084dc',
            7: '#26b5ce',
            8: '#f59e0b',
          },
        },
        'linear-light': {
          bg: '#ffffff',
          'bg-elevated': '#ffffff',
          'bg-subtle': '#fafafa',
          'bg-secondary': '#fafafa',
          'bg-tertiary': '#f5f5f5',
          'bg-hover': 'rgba(0, 0, 0, 0.02)',
          'bg-active': 'rgba(0, 0, 0, 0.04)',

          border: '#e5e5e5',
          'border-subtle': '#efefef',
          'border-strong': '#d4d4d4',
          'border-hover': '#d4d4d4',

          accent: '#18181b',
          'accent-hover': '#27272a',
          'accent-active': '#3f3f46',
          'accent-subtle': 'rgba(0, 0, 0, 0.04)',
          'accent-border': 'rgba(0, 0, 0, 0.15)',

          success: '#16a34a',
          'success-subtle': 'rgba(22, 163, 74, 0.08)',
          'success-border': 'rgba(22, 163, 74, 0.2)',

          warning: '#f59e0b',
          'warning-subtle': 'rgba(245, 158, 11, 0.08)',
          'warning-border': 'rgba(245, 158, 11, 0.2)',

          error: '#dc2626',
          'error-subtle': 'rgba(220, 38, 38, 0.08)',
          'error-border': 'rgba(220, 38, 38, 0.2)',

          info: '#3b82f6',
          'info-subtle': 'rgba(59, 130, 246, 0.08)',
          'info-border': 'rgba(59, 130, 246, 0.2)',
        },
        text: {
          primary: '#e6e6e7',
          secondary: '#9ea0a5',
          tertiary: '#6c6e73',
          quaternary: '#4d4f54',
          disabled: '#3a3b3e',
          link: '#5E6AD2',
          'link-hover': '#7078E2',
        },
        'text-light': {
          primary: '#0f0f0f',
          secondary: '#525252',
          tertiary: '#737373',
          quaternary: '#a3a3a3',
          disabled: '#d4d4d4',
          link: '#3b82f6',
          'link-hover': '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'linear': '6px',
        'linear-sm': '4px',
        'linear-lg': '8px',
        'linear-xl': '12px',
      },
      fontSize: {
        'display': ['80px', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'heading': ['48px', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      boxShadow: {
        'linear-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'linear': '0 2px 8px 0 rgba(0, 0, 0, 0.4)',
        'linear-lg': '0 8px 24px 0 rgba(0, 0, 0, 0.5)',
        'linear-xl': '0 16px 48px 0 rgba(0, 0, 0, 0.6)',
        'linear-light-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'linear-light': '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
        'linear-light-lg': '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
        'linear-light-xl': '0 8px 24px 0 rgba(0, 0, 0, 0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
