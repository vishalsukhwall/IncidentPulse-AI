import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#09090B",
          card: "#121215",
          border: "#27272A",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        roseGlow: "0 0 20px -3px rgba(244, 63, 94, 0.25)",
        blueGlow: "0 0 20px -3px rgba(59, 130, 246, 0.25)",
        amberGlow: "0 0 20px -3px rgba(245, 158, 11, 0.25)",
        emeraldGlow: "0 0 20px -3px rgba(16, 185, 129, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "wave-1": "wave 1.1s ease-in-out infinite alternate",
        "wave-2": "wave 0.8s ease-in-out infinite alternate 0.2s",
        "wave-3": "wave 1.4s ease-in-out infinite alternate 0.4s",
        "wave-4": "wave 0.9s ease-in-out infinite alternate 0.1s",
        "wave-5": "wave 1.2s ease-in-out infinite alternate 0.3s",
      },
      keyframes: {
        wave: {
          "0%": { height: "4px" },
          "100%": { height: "18px" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
