const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const legacyClasses = [
  'hero-zombie', 'hero-mascot', 'mascot-hand', 'mascot-orbit',
  'mascot-caption', 'mascot-signal', 'hero-hand-logo', 'hero-biohazard',
  'hero-zombie-sigil', 'hero-emblem', 'sigil-orbit', 'sigil-crosshair',
  'sigil-claw', 'sigil-label'
];
const tokenPattern = new RegExp('\\\\b(?:' + legacyClasses.join('|') + ')\\\\b', 'i');
const scannedExtensions = new Set(['.html', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx']);
const skippedDirectories = new Set(['.git', '.github', 'node_modules', 'tests', 'docs', 'dist', 'build']);
const references = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) walk(path.join(directory, entry.name));
      continue;
    }
    const file = path.join(directory, entry.name);
    if (!scannedExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    const content = fs.readFileSync(file, 'utf8');
    if (tokenPattern.test(content)) references.push(path.relative(root, file));
  }
}

walk(root);
assert.deepEqual(references, [],
  'retired hero CSS classes must not be referenced by runtime HTML or JavaScript');

const globalCss = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
for (const className of legacyClasses) {
  const selector = new RegExp('\\\\.' + className + '(?![\\\\w-])', 'i');
  assert.equal(selector.test(globalCss), false,
    'unused legacy hero selector remains in style.css: .' + className);
}

console.log('PASS: 14 retired hero classes have no runtime references and no global CSS selectors.');
