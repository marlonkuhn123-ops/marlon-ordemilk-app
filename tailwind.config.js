/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                brand: '#FF9F1A', // Vibrant Orange (Action)
                brandSoft: '#FFB84D', // Soft Orange for secondary elements
                techDark: '#121821', // Grafite Background
                techPanel: '#18212C', // Layered Card Surface
                techBorder: '#263140', // Professional Border
                electricBlue: '#3b82f6', // Electric Blue (Kept for functional UI)
                neonViolet: '#3b82f6', 
                neonCyan: '#FF9F1A', 
            },
            fontFamily: {
                sans: ['"Inter"', 'sans-serif'],
                display: ['"Space Grotesk"', 'sans-serif'],
                mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
            }
        }
    },
    plugins: [],
}
