/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}","./components/**/.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#FDF6EC",
        card: "#FFFFFF",
        cardBorder: "#F0E6D6",
        inputBorder: "#EADFCB",
        dark: "#2C2C2A",
        primary: "#D85A30",
        primaryLight: "#FCE3D3",
        brown: "#8B6F4E",
        ochre: "#B8925A",
        ochreLight: "#F3EADA",
        textSub: "#A6A096",
        label: "#888780",
        placeholder: "#B9B4A8",
        inactive: "#EFEBE3",
        danger: "#C94141",
        dangerLight: "#FADCDC",
      },
      fontFamily:{
        'rounded': ['MPLUSRounded1c_400Regular'],
        'rounded-bold': ['MPLUSRounded1c_700Bold'],
      }
    },
  },
};