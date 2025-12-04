/** Config minimale Tailwind pour aligner les tokens et polices avec la doc. */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          primary: '#4f46e5',
          secondary: '#8b5cf6',
          accent: '#0ea5e9',
          dark: '#0b1021',
          light: '#eef2ff',
        },
      },
    },
  },
};
