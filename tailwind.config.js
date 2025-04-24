/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: '#646cff',
          primaryHover: '#535bf2',
          darkBg: '#242424',
          darkText: 'rgba(255, 255, 255, 0.87)',
          lightBg: '#ffffff',
          lightText: '#213547',
        },
      },
    },
    plugins: [],
  }