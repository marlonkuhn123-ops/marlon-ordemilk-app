const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// ✅ Pega a chave de API de múltiplas fontes possíveis ou usa um placeholder para injeção posterior
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '__GEMINI_API_KEY_PLACEHOLDER__';

const define = {
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
  'process.env.API_KEY': JSON.stringify(apiKey),
};

const buildOptions = {
  entryPoints: [path.resolve(__dirname, 'index.tsx')],
  bundle: true,
  outfile: path.resolve(__dirname, 'dist/index.js'), // ✅ fixo
  minify: isProduction,
  sourcemap: !isProduction,
  platform: 'browser',
  format: 'esm',
  jsx: 'automatic',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.js': 'js',
    '.jsx': 'jsx',
    '.json': 'json',
  },
  define,
  logLevel: 'info',
};

function copyHtmlToDist() {
  const htmlPath = path.resolve(__dirname, 'index.html');
  const distHtmlPath = path.resolve(__dirname, 'dist/index.html');

  let html = fs.readFileSync(htmlPath, 'utf8');

  // ✅ sempre aponta pro index.js que existe
  html = html.replace(
    /<script\s+type="module"\s+src="[^"]+"><\/script>/i,
    '<script type="module" src="/index.js"></script>'
  );

  // ✅ manifest sempre na raiz
  html = html.replace(
    /<link\s+rel="manifest"\s+href="[^"]+"\s*>/i,
    '<link rel="manifest" href="/manifest.json">'
  );

  fs.mkdirSync(path.resolve(__dirname, 'dist'), { recursive: true });
  fs.writeFileSync(distHtmlPath, html);
}

function copyPublicAssets() {
  const publicDir = path.resolve(__dirname, 'public');
  const distDir = path.resolve(__dirname, 'dist');
  if (!fs.existsSync(publicDir)) return;

  for (const file of fs.readdirSync(publicDir)) {
    const src = path.join(publicDir, file);
    const dst = path.join(distDir, file);
    if (fs.statSync(src).isFile()) fs.copyFileSync(src, dst);
  }
}

esbuild
  .build(buildOptions)
  .then(() => {
    copyHtmlToDist();
    copyPublicAssets();
    console.log('Build OK: dist/index.html + dist/index.js');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });