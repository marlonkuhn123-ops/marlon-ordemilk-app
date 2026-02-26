const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const serve = process.argv.includes('--serve');

const define = {
  'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
};

// DEBUG: Log the API Key value as seen by esbuild
console.log('DEBUG: API Key (from esbuild define) =', define['process.env.API_KEY']);


const buildOptions = {
  entryPoints: [path.resolve(__dirname, 'index.tsx')],
  bundle: true,
  outfile: path.resolve(__dirname, 'dist/index.js'),
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
  define: define,
  logLevel: 'info',
  color: true,
  external: [],
};

if (serve) {
  esbuild.context(buildOptions).then(ctx => {
    ctx.serve({
      port: 3000,
      host: '0.0.0.0',
      servedir: path.resolve(__dirname, 'dist'),
    }).then(({ host, port }) => {
      console.log(`Serving at http://${host}:${port}`);
      // In serve mode, copy index.html
      const htmlPath = path.resolve(__dirname, 'index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      fs.writeFileSync(path.resolve(__dirname, 'dist/index.html'), htmlContent);
    });
  }).catch(() => process.exit(1));
} else {
  // Production build
  esbuild.build({
    ...buildOptions,
    entryNames: '[dir]/[name]-[hash]',
    metafile: true,
  }).then((result) => {
    // --- Injetar o nome do arquivo com hash no HTML ---
    const meta = result.metafile;
    const outputKey = Object.keys(meta.outputs).find(key => key.endsWith('.js'));
    const newJsFile = outputKey ? path.basename(outputKey) : 'index.js';
    console.log('Build finished successfully.');
    
    // Copy index.html to dist after build
    const htmlPath = path.resolve(__dirname, 'index.html');
    const destPath = path.resolve(__dirname, 'dist/index.html');
    
    if (fs.existsSync(htmlPath)) {
      let htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Ensure the script tag points to the new hashed JS file
      htmlContent = htmlContent.replace(/<script type="module" src="\/index\.js"><\/script>|<script[^>]*index\.tsx[^>]*>[\s\S]*?<\/script>/, `<script type="module" src="/${newJsFile}"></script>`);
      
      // Remove the importmap for production
      htmlContent = htmlContent.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
      
      // Remove any development-only inline Tailwind style tag that might have been accidentally inserted
      htmlContent = htmlContent.replace(/<style>@tailwind base; @tailwind components; @tailwind utilities;<\/style>/, '');

      // Crucial: Ensure the Tailwind CSS CDN link remains in the production build.
      // No replacement for tailwind CDN link, it stays as is from original index.html.
      
      fs.writeFileSync(destPath, htmlContent);

    } else {
      console.error('index.html not found!');
      process.exit(1);
    }

    // --- Copiar assets da pasta public ---
    const publicDir = path.resolve(__dirname, 'public');
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(publicDir)) {
        const files = fs.readdirSync(publicDir);
        files.forEach(file => {
            fs.copyFileSync(path.join(publicDir, file), path.join(distDir, file));
        });
        console.log('Public assets copied successfully.');
    }

  }).catch(() => process.exit(1));
}