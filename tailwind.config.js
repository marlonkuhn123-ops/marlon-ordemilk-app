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
                brand: '#ff6600', // Laranja Ordemilk
                brandSoft: '#ff8833', // Laranja Hover
                techDark: '#2a3646', // Background Secundário (Inputs/Inactive Toggles)
                techPanel: '#3b4c61', // Fundo de Cards (com opacidade na UI)
                techBorder: '#4a5c73', // Bordas dos painéis
                electricBlue: '#00d9ff', // Ciano para marcações e robô
                neonViolet: '#3b82f6', 
                neonCyan: '#00d9ff',
                textMuted: '#9ca7b8', // Textos Secundários
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
