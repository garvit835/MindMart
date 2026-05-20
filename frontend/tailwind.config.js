/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2DD4BF', // Mint/Teal
          dark: '#14B8A6',
        },
        secondary: {
          DEFAULT: '#818CF8', // Soft Lavender
          dark: '#6366F1',
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
        }
      },
    },
  },
  plugins: [],
}
