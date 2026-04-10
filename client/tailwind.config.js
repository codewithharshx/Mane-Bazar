/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#16a34a",
          accent: "#f97316",
          bg: "#f0fdf4",
          dark: "#1a1a1a"
        }
      },
      boxShadow: {
        glass: "0 20px 50px rgba(22, 163, 74, 0.12)",
        soft: "0 12px 30px rgba(15, 23, 42, 0.08)"
      },
      backdropBlur: {
        xs: "2px"
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        }
      },
      animation: {
        floaty: "floaty 4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
