import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'display': ['48px', { lineHeight: '1.0', fontWeight: '700' }],
        'h1': ['40px', { lineHeight: '1.1', fontWeight: '700' }],
        'h2': ['28px', { lineHeight: '1.1', fontWeight: '700' }],
        'h3': ['18px', { lineHeight: '1.3', fontWeight: '700' }],
        'body-lg': ['16px', { lineHeight: '1.7', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.7', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.7', fontWeight: '400' }],
        'label': ['9px', { lineHeight: '1.0', fontWeight: '700' }],
        'micro': ['10px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.10)',
        'search': '0 8px 40px rgba(0,0,0,0.30), 0 0 0 1px rgba(240,239,235,0.10)',
      },
      colors: {
        // Design System Colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        paper: {
          50: "#FFFFFF",
          100: "#F0EFEB",
        },
        black: {
          900: "#1A1A1A",
        },
        yellow: {
          500: "#FFD600",
        },
        red: {
          500: "#CC3333",
        },
        // Radix UI colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
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
      fontFamily: {
        serif: ["Zilla Slab", "serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      spacing: {
        "18": "72px",
        "22": "88px",
        "30": "120px",
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
