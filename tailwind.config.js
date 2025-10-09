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
        border: "hsl(240, 5%, 84%)",
        background: "#ffffff",
        foreground: "#0b1020",
        primary: {
          DEFAULT: "#6366F1", // indigo-500
          foreground: "#ffffff"
        },
        muted: {
          DEFAULT: "#f4f4f5",
          foreground: "#6b7280"
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0b1020"
        }
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "8px",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0,0,0,0.06)",
      }
    },
  },
  plugins: [],
};
