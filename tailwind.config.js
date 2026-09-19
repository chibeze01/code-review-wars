/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#1c1917', 2: '#57534e', 3: '#8a827b' },
        cream: { DEFAULT: '#fffaf0', 2: '#fff2dc' },
        paper: '#ffffff',
        brand: { DEFAULT: '#16a34a', dark: '#0f7a37', soft: '#dcfce7' },
        hi: { DEFAULT: '#ffd43b', soft: '#fff3c4' },
        coral: { DEFAULT: '#ff6a3d', soft: '#ffe2d6' },
        accent: { blue: '#3b82f6', purple: '#7c3aed' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      borderRadius: {
        pop: '14px',
        'pop-lg': '20px',
        'pop-xl': '28px',
      },
      boxShadow: {
        hard: '5px 5px 0 #1c1917',
        'hard-sm': '3px 3px 0 #1c1917',
        'hard-lg': '8px 8px 0 #1c1917',
      },
      borderWidth: {
        2.5: '2.5px',
      },
    },
  },
  plugins: [],
}
