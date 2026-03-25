/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111F",
        surge: "#FF6B4A",
        ember: "#FF9A62",
        rescue: "#7DE2D1",
        cloud: "#E8EEF6",
        slate: "#7B8BA2",
      },
      boxShadow: {
        panel: "0 24px 70px rgba(7, 17, 31, 0.18)",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
