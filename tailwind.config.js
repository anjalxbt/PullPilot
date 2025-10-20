/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgba(0, 0, 0, 0.1)",
        background: "#FFE1AF",
        foreground: "#111111",
        primary: {
          DEFAULT: "#3b82f6",
          foreground: "#ffffff"
        },
        accent: {
          DEFAULT: "#3b82f6",
          foreground: "#ffffff"
        },
        muted: {
          DEFAULT: "#f5f5f7",
          foreground: "#555555"
        },
        card: {
          DEFAULT: "#1c1c1e",
          foreground: "#ffffff"
        },
        secondary: {
          DEFAULT: "#555555",
          foreground: "#111111"
        }
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "8px",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0,0,0,0.06)",
        glow: "0 0 20px rgba(255, 107, 53, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "scale-in": "scaleIn 0.5s ease-out",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
