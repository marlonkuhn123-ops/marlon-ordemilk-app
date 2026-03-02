const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Este script roda no START do servidor (Runtime)
// Ele pega a chave real das variáveis de ambiente do Cloud Run e injeta no JS estático
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (apiKey) {
    const indexPath = path.resolve(__dirname, 'dist/index.js');
    if (fs.existsSync(indexPath)) {
        console.log('💉 Injetando chave de API no bundle...');
        let content = fs.readFileSync(indexPath, 'utf8');
        
        // Substitui o placeholder ou a string vazia pela chave real
        // O esbuild define process.env.GEMINI_API_KEY como uma string
        const placeholder = "__GEMINI_API_KEY_PLACEHOLDER__";
        
        if (content.includes(placeholder)) {
            content = content.replace(new RegExp(placeholder, 'g'), apiKey);
            fs.writeFileSync(indexPath, content);
            console.log('✅ Chave injetada no JS com sucesso!');
        } else {
            console.log('ℹ️ Placeholder não encontrado no JS ou chave já injetada.');
        }

        // Também injeta no index.html para garantir disponibilidade global
        const htmlPath = path.resolve(__dirname, 'dist/index.html');
        if (fs.existsSync(htmlPath)) {
            let html = fs.readFileSync(htmlPath, 'utf8');
            if (!html.includes('window.GEMINI_API_KEY')) {
                html = html.replace('</head>', `<script>window.GEMINI_API_KEY = "${apiKey}";</script></head>`);
                fs.writeFileSync(htmlPath, html);
                console.log('✅ Chave injetada no HTML com sucesso!');
            }
        }
    }
} else {
    console.warn('⚠️ GEMINI_API_KEY não encontrada no ambiente. O chat pode falhar.');
}
