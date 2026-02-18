import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50: "color-mix(in srgb, var(--color-accent) 12%, white)",
          100: "color-mix(in srgb, var(--color-accent) 22%, white)",
          200: "color-mix(in srgb, var(--color-accent) 40%, white)",
          300: "color-mix(in srgb, var(--color-accent) 60%, white)",
          400: "color-mix(in srgb, var(--color-accent) 80%, white)",
          500: "var(--color-accent)",
          600: "color-mix(in srgb, var(--color-accent) 85%, black)",
          700: "color-mix(in srgb, var(--color-accent) 70%, black)",
          800: "color-mix(in srgb, var(--color-accent) 55%, black)",
          900: "color-mix(in srgb, var(--color-accent) 40%, black)",
          950: "color-mix(in srgb, var(--color-accent) 25%, black)",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
