import type { Config } from "tailwindcss"
import { COLORS, TYPOGRAPHY, RADIUS, ANIMATION } from "./lib/brand"
import { hexToHSL } from "./lib/brand/utils"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
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
        sans: [TYPOGRAPHY.fontFamily.primary],
        heading: [TYPOGRAPHY.fontFamily.heading],
        mono: [TYPOGRAPHY.fontFamily.mono],
      },
      colors: {
        // Brand colors
        brand: {
          black: COLORS.primary.black,
          'deep-blue': COLORS.primary.deepBlue,
          'bright-blue': COLORS.primary.brightBlue,
          cyan: COLORS.primary.cyan,
        },
        gradient: COLORS.gradient,
        // UI colors using CSS variables for dynamic theming
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
        ...RADIUS,
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontWeight: TYPOGRAPHY.fontWeight,
      fontSize: TYPOGRAPHY.fontSize,
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        waveform: {
          "0%, 100%": { height: "20%" },
          "25%": { height: "80%" },
          "50%": { height: "40%" },
          "75%": { height: "60%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      animation: {
        "accordion-down": `accordion-down ${ANIMATION.duration.normal} ease-out`,
        "accordion-up": `accordion-up ${ANIMATION.duration.normal} ease-out`,
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse-slow 4s ease-in-out infinite",
        waveform: "waveform 1.5s ease-in-out infinite",
        shimmer: "shimmer 8s linear infinite",
      },
      transitionDuration: ANIMATION.duration,
      transitionTimingFunction: ANIMATION.easing,
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
