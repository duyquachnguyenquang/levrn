import type { Config } from "tailwindcss";

/**
 * Cấu hình Tailwind CSS cho dự án LEVRN
 * Bộ màu thương hiệu: Black (#000000), Violet (#7D39EB), Lime (#C6FF33), White (#FFFFFF)
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-be-vietnam-pro)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-be-vietnam-pro)", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        // LEVRN Brand Colors theo bảng màu Project GridsterGP & giao diện Eduplex
        brand: {
          black: "#000000",      // Black chuẩn RGB 0, 0, 0
          dark: "#13151B",       // Nền Sidebar tối sang trọng
          violet: "#7D39EB",     // Violet chuẩn RGB 125, 57, 235
          lime: "#C6FF33",       // Lime chuẩn RGB 198, 255, 51
          white: "#FFFFFF",      // White chuẩn RGB 255, 255, 255
          canvas: "#F4F5F9",     // Nền canvas nhẹ nhàng cho Light mode
        },
        // shadcn/ui dynamic theme tokens (mapped to CSS variables)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        "3xl": "0.625rem", // 10px - cứng cáp, chuẩn tech
        "2xl": "0.5rem",   // 8px
        xl: "0.375rem",    // 6px
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(198, 255, 51, 0.2)" },
          "50%": { boxShadow: "0 0 25px rgba(198, 255, 51, 0.45)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.25s ease-out forwards",
        "glow-pulse": "glow-pulse 2s infinite ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
