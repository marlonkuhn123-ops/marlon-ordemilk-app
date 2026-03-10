const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const pdfDir = path.join(__dirname, 'Subir_PDFs');
const outFile = path.join(__dirname, 'src', 'data', 'electrical_database_full.ts');

async function processPdfs() {
    const files = fs.readdirSync(pdfDir).filter(f => f.toLowerCase().endsWith('.pdf'));
    let combinedText = `export const ELECTRICAL_SCHEMATICS_LIBRARY = \`\n`;
    combinedText += `// =========================================================\n`;
    combinedText += `// BASE DE DADOS COMPLETA DE ESQUEMAS ELÉTRICOS (GERADA VIA PDF)\n`;
    combinedText += `// =========================================================\n\n`;

    for (const file of files) {
        console.log(`Lendo: ${file}`);
        combinedText += `\n\n=== ARQUIVO: ${file} ===\n\n`;
        const filePath = path.join(pdfDir, file);
        const dataBuffer = fs.readFileSync(filePath);
        try {
            const data = await pdfParse(dataBuffer);
            combinedText += data.text;
        } catch (e) {
            console.error(`Erro ao ler ${file}:`, e);
            combinedText += `[ERRO NA LEITURA DESTE PDF: ${e.message}]\n`;
        }
    }

    combinedText += `\n\n\`;\n`;

    // Create dir if doesn't exist
    const dir = path.dirname(outFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Escreve as info
    fs.writeFileSync(outFile, combinedText);
    console.log('Extração concluída com sucesso. Arquivo src/data/electrical_database_full.ts criado.');
}

processPdfs();
