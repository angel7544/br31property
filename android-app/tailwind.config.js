/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#1e40af',
        background: '#ffffff',
        text: '#111827',
        gray: '#6b7280',
        lightGray: '#f3f4f6',
        error: '#ef4444',
        success: '#10b981',
      },
    },
  },
  plugins: [],
}
