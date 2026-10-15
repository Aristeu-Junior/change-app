import fs from 'fs';
import path from 'path';

// Copia dist/index.html para dist/404.html para garantir compatibilidade perfeita com GitHub Pages
const src = path.resolve('dist', 'index.html');
const dest = path.resolve('dist', '404.html');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('✓ dist/404.html gerado com sucesso para o GitHub Pages.');
} else {
  console.error('dist/index.html não encontrado.');
}
