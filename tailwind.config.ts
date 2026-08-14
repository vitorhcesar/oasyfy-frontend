import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
        sans: ['"Afacad"', '"Albert Sans"', "system-ui", "sans-serif"],
        display: ['"Afacad"', '"Albert Sans"', "system-ui", "sans-serif"],
        body: ['"Albert Sans"', '"Afacad"', "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.15rem" }],
        sm: ["0.9375rem", { lineHeight: "1.35rem" }],
        base: ["1.0625rem", { lineHeight: "1.55rem" }],
        lg: ["1.1875rem", { lineHeight: "1.7rem" }],
        xl: ["1.375rem", { lineHeight: "1.85rem" }],
        "2xl": ["1.625rem", { lineHeight: "2rem" }],
        "3xl": ["2rem", { lineHeight: "2.35rem" }],
        "4xl": ["2.5rem", { lineHeight: "2.75rem" }],
        "5xl": ["3.15rem", { lineHeight: "1.1" }],
      },
      colors: {
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
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
        "collapsible-down": {
          from: { height: "0", opacity: "0" },
          to: {
            height: "var(--radix-collapsible-content-height)",
            opacity: "1",
          },
        },
        "collapsible-up": {
          from: {
            height: "var(--radix-collapsible-content-height)",
            opacity: "1",
          },
          to: { height: "0", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-scale": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "deposit-confirm-pop": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "55%": { transform: "scale(1.12)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "deposit-check-draw": {
          "0%": { strokeDashoffset: "48" },
          "100%": { strokeDashoffset: "0" },
        },
        "deposit-ring": {
          "0%": { transform: "scale(0.7)", opacity: "0.55" },
          "100%": { transform: "scale(1.45)", opacity: "0" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        "collapsible-up": "collapsible-up 0.22s cubic-bezier(0.4, 0, 1, 1)",
        "fade-in": "fade-in 0.35s ease-out both",
        "fade-in-scale": "fade-in-scale 0.3s ease-out both",
        "slide-in-left": "slide-in-left 0.3s ease-out both",
        "deposit-confirm-pop":
          "deposit-confirm-pop 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
        "deposit-check-draw": "deposit-check-draw 0.4s 0.28s ease-out both",
        "deposit-ring": "deposit-ring 0.85s ease-out both",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
