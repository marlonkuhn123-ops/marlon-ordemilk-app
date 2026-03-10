import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
                cleanupOutdatedCaches: true
            },
            devOptions: {
                enabled: true
            },
            manifest: {
                name: 'Ordemilk Tech Assist',
                short_name: 'OM Tech',
                description: 'Assistente Técnico de Rápido Diagnóstico Off-line',
                theme_color: '#1a1a1a',
                background_color: '#1a1a1a',
                display: 'standalone',
                icons: [
                    {
                        src: '/logo192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/logo512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    server: {
        port: 3000
    },
    envPrefix: ['VITE_', 'GEMINI_']
});
