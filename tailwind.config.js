/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ["SpaceGrotesk_400Regular", "System"],
        serif: ["System"],
        "space-grotesk": ["SpaceGrotesk_400Regular", "System"],
        "space-grotesk-medium": ["SpaceGrotesk_500Medium", "System"],
        "space-grotesk-semibold": ["SpaceGrotesk_600SemiBold", "System"],
        "space-grotesk-bold": ["SpaceGrotesk_700Bold", "System"],
      },
      colors: {
        // Brand colors from design
        brand: {
          green: "#D4E95A",
          pink: "#fddffd",
          cream: "#F6FBDE",
          dark: "#313131",
        },
        border: "hsl(35 20% 88%)",
        "border-dark": "hsl(35 20% 25%)",
        input: "hsl(35 20% 88%)",
        "input-dark": "hsl(35 20% 25%)",
        ring: "#D4E95A",
        "ring-dark": "#D4E95A",
        background: "#F6FBDE",
        "background-dark": "hsl(220 20% 10%)",
        foreground: "#313131",
        "foreground-dark": "hsl(40 30% 95%)",
        primary: {
          DEFAULT: "#D4E95A",
          dark: "#D4E95A",
          foreground: "#313131",
          "foreground-dark": "#313131",
        },
        secondary: {
          DEFAULT: "#fddffd",
          dark: "#fddffd",
          foreground: "#313131",
          "foreground-dark": "#313131",
        },
        destructive: {
          DEFAULT: "#fddffd",
          dark: "#fddffd",
          foreground: "#313131",
          "foreground-dark": "#313131",
        },
        muted: {
          DEFAULT: "#F6FBDE",
          dark: "hsl(220 15% 20%)",
          foreground: "#313131",
          "foreground-dark": "hsl(40 20% 70%)",
        },
        accent: {
          DEFAULT: "#fddffd",
          dark: "#fddffd",
          foreground: "#313131",
          "foreground-dark": "#313131",
        },
        card: {
          DEFAULT: "#FFFFFF",
          dark: "hsl(220 20% 15%)",
          foreground: "#313131",
          "foreground-dark": "hsl(40 30% 95%)",
        },
        sage: {
          DEFAULT: "#D4E95A",
          light: "#F6FBDE",
        },
        sand: {
          DEFAULT: "#F6FBDE",
          dark: "hsl(35 20% 70%)",
        },
        hope: "#fddffd",
        success: "#D4E95A",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
        xl: "calc(0.75rem + 4px)",
        "2xl": "calc(0.75rem + 8px)",
      },
    },
  },
  plugins: [],
};
