const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const legacyClasses = [
  'hero-mascot', 'mascot-orbit', 'mascot-hand', 'mascot-caption', 'mascot-signal',
  'hero-mascot-v9', 'hero-character-glow', 'hero-character-grid', 'hero-character-label',
  'hero-zombie', 'hero-coin-badge', 'hero-character-caption', 'hero-zombie-art',
  'hero-emblem', 'hero-emblem-ring', 'hero-emblem-core', 'hero-emblem-code', 'hero-emblem-scan',
  'hero-hand-logo', 'hero-biohazard', 'hero-zombie-sigil', 'sigil-orbit', 'sigil-orbit-a',
  'sigil-orbit-b', 'sigil-crosshair', 'sigil-claw', 'sigil-label', 'panel-topline',
  'panel-foot', 'panel-status', 'live-dot', 'panel-live', 'panel-core', 'panel-orbit',
  'orbit-one', 'orbit-two', 'panel-core-mark', 'mark-slash', 'mark-dot',
  'panel-coordinate', 'panel-bars', 'panel-glitch', 'panel-reticle'
];

const skipped = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'tests']);
const sources = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skipped.has(entry.name)) walk(path.join(directory, entry.name));
      continue;
    }
    if (!/\\.(?:html|js)$/i.test(entry.name)) continue;
    const file = path.join(directory, entry.name);
    const relative = path.relative(root, file).replaceAll(path.sep, '/');
    let content = fs.readFileSync(file, 'utf8');
    if (entry.name.endsWith('.html')) content = content.replace(/<style\\b[^>]*>[\\s\\S]*?<\\/style>/gi, '');
    sources.push({ file: relative, content });
  }
}
walk(root);

const matches = [];
for (const source of sources) {
  for (const className of legacyClasses) {
    const expression = new RegExp('(?<![\\w-])' + className + '(?![\\w-])', 'i');
    const match = expression.exec(source.content);
    if (match) {
      const before = source.content.slice(0, match.index);
      const line = before.split('\\n').length;
      matches.push({ file: source.file, line, className });
    }
  }
}

console.log(JSON.stringify({ scannedFiles: sources.length, legacyClasses: legacyClasses.length, matches }, null, 2));
assert.deepEqual(matches, [], 'Legacy hero classes are still referenced by current HTML or JavaScript.');
console.log('PASS: legacy hero markup and script hooks are unused across the repository.');
