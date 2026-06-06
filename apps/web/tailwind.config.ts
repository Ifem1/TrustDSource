import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#eeccff",
        surface: "#ffffff",
        surfaceSoft: "#f7f0ff",
        primaryText: "#241c35",
        secondaryText: "#54486b",
        credibilityGreen: "#16a34a",
        moderateBlue: "#3b82f6",
        warningAmber: "#f59e0b",
        riskRed: "#ef4444",
        graphPurple: "#9d4edd",
        trustLavender: "#c77dff",
        border: "#d7b5ff",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh":
          "radial-gradient(at 40% 20%, #eeccff 0px, transparent 50%), radial-gradient(at 80% 0%, #c77dff22 0px, transparent 50%), radial-gradient(at 0% 50%, #9d4edd11 0px, transparent 50%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "scan": "scan 2s linear infinite",
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
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      boxShadow: {
        "glow-purple": "0 0 20px rgba(157, 78, 221, 0.3)",
        "glow-green": "0 0 20px rgba(22, 163, 74, 0.3)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.3)",
        card: "0 1px 3px 0 rgba(36, 28, 53, 0.1), 0 1px 2px -1px rgba(36, 28, 53, 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
