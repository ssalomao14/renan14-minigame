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
console.log(`OK: ${m[1]} -> ${next}`);
console.log('');
console.log('Proximos passos (release):');
console.log('  git add -A');
console.log(`  git commit -m "release v${next}"`);
console.log(`  git tag v${next}`);
console.log('  git push origin main --follow-tags');