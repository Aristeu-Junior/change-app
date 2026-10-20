import fs from 'fs';
import path from 'path';

const buildId = `${Date.now()}`;
const src = path.resolve('dist', 'index.html');
const dest404 = path.resolve('dist', '404.html');
const versionFile = path.resolve('dist', 'version.json');

if (fs.existsSync(src)) {
  // Injeta o ID da build diretamente no HTML para o Web App do iPhone comparar com version.json
  let html = fs.readFileSync(src, 'utf-8');
  html = html.replace('__CHANGE_BUILD_ID_PLACEHOLDER__', buildId);
  fs.writeFileSync(src, html, 'utf-8');

  // Copia dist/index.html para dist/404.html para o GitHub Pages
  fs.copyFileSync(src, dest404);

  // Gera dist/version.json para verificação remota de atualização no Web App iOS/Android
  fs.writeFileSync(
    versionFile,
    JSON.stringify({ buildId, updatedAt: new Date().toISOString() }, null, 2),
    'utf-8'
  );

  console.log(`✓ dist/404.html e dist/version.json (${buildId}) gerados com sucesso.`);
} else {
  console.error('dist/index.html não encontrado.');
}
