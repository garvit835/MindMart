/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit_400Regular', 'sans-serif'],
        medium: ['Outfit_500Medium', 'sans-serif'],
        semibold: ['Outfit_600SemiBold', 'sans-serif'],
        bold: ['Outfit_700Bold', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2DD4BF', // Mint/Teal
          dark: '#14B8A6',
          light: '#CCFBF1',
        },
        secondary: {
          DEFAULT: '#818CF8', // Soft Lavender
          dark: '#6366F1',
          light: '#E0E7FF',
        },
        background: {
          light: '#F8FAFC',
          dark: '#0F172A',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1E293B',
        },
        text: {
          light: '#334155',
          dark: '#F1F5F9',
          muted: '#94A3B8',
        }
      },
    },
  },
  plugins: [],
}
