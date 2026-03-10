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
                brand: '#f97316', // Action Orange
                brandSoft: '#fdba74', // Soft Orange
                techDark: '#0f172a', // Deep Slate
                techPanel: '#1e293b', // Surface
                techBorder: '#1e293b', // Surface for borders
                electricBlue: '#3b82f6', // Electric Blue
                neonViolet: '#3b82f6', // Reusing Electric Blue for neonViolet mappings
                neonCyan: '#f97316', // Remapping old cyan to action orange
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
