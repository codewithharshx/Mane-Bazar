/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"]
      },
      colors: {
        brand: {
          primary: "#16a34a",
          light: "#22c55e",
          lighter: "#bbf7d0",
          bg: "#f0fdf4",
          accent: "#f97316",
          accentLight: "#fed7aa",
          dark: "#0f172a",
          muted: "#64748b"
        },
        surface: {
          DEFAULT: "#ffffff",
          soft: "#f8fafc",
          muted: "#f1f5f9"
        }
      },
      boxShadow: {
        glass: "0 20px 50px rgba(22, 163, 74, 0.12)",
        soft: "0 4px 20px -4px rgba(15, 23, 42, 0.08), 0 1px 4px rgba(15, 23, 42, 0.04)",
        card: "0 2px 8px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.04)",
        "card-hover": "0 8px 30px rgba(22, 163, 74, 0.14), 0 2px 8px rgba(15, 23, 42, 0.06)",
        "btn-green": "0 4px 14px rgba(22, 163, 74, 0.35)",
        "btn-green-hover": "0 6px 20px rgba(22, 163, 74, 0.5)",
        "drawer": "-8px 0 40px rgba(15, 23, 42, 0.12)"
      },
      backdropBlur: {
        xs: "2px",
        "2xl": "40px"
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem"
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" }
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" }
        }
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        floaty: "floaty 4s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
        wiggle: "wiggle 0.5s ease-in-out",
        "scale-in": "scale-in 0.25s ease-out forwards",
        marquee: "marquee 20s linear infinite"
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)"
      }
    }
  },
  plugins: []
};
