// SemVer bump helper — uso: node bump-version.js [major|minor|patch]  (padrão: patch)
// Lê e incrementa a constante GAME_VERSION em game.js e imprime os próximos passos de release.
const fs = require('fs');
const path = require('path');
const TAG = 'GAME_VERSION';
const FILE = path.join(__dirname, 'game.js');

const src = fs.readFileSync(FILE, 'utf8');
const m = src.match(new RegExp(`const ${TAG}\\s*=\\s*'([^']+)'`));
if (!m) {
  console.error(`"const ${TAG}" nao encontrada em ${FILE}`);
  process.exit(1);
}

const parts = m[1].split('.').map(Number);
if (parts.length !== 3 || parts.some(isNaN)) {
  console.error('Versao atual invalida: ' + m[1]);
  process.exit(1);
}

let [major, minor, patch] = parts;
const kind = (process.argv[2] || 'patch').toLowerCase();
if (kind === 'major') { major++; minor = 0; patch = 0; }
else if (kind === 'minor') { minor++; patch = 0; }
else if (kind === 'patch') { patch++; }
else {
  console.error('Uso: node bump-version.js [major|minor|patch]');
  process.exit(1);
}

const next = `${major}.${minor}.${patch}`;
fs.writeFileSync(FILE, src.replace(m[0], `const ${TAG} = '${next}'`));

// Cache-busting: atualiza ?v= nos assets do index.html para a nova versao
const INDEX = path.join(__dirname, 'index.html');
let html = fs.readFileSync(INDEX, 'utf8').replace(/styles\.css\?v=[\d.]+/g, `styles.css?v=${next}`);
html = html.replace(/game\.js\?v=[\d.]+/g, `game.js?v=${next}`);
// Modal Sobre: mantem numero da versao e data de publicacao em sincronia
const p = new Date();
const mm = String(p.getMonth() + 1).padStart(2, '0');
const dd = String(p.getDate()).padStart(2, '0');
const today = `${dd}/${mm}/${p.getFullYear()}`;
html = html.replace(/sobre-version-num">[\d.]+/g, `sobre-version-num">${next}`);
html = html.replace(/sobre-version-date">[^<]+/g, `sobre-version-date">${today}`);
fs.writeFileSync(INDEX, html);

console.log(`OK: ${m[1]} -> ${next}`);
console.log('');
console.log('Proximos passos (release):');
console.log('  git add -A');
console.log(`  git commit -m "release v${next}"`);
console.log(`  git tag v${next}`);
console.log(`  git push origin main v${next}`);  // tag leve nao sobe com --follow-tags