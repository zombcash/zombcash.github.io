const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const cssFiles = [
  'style.css',
  'site-polish.css',
  'homepage-pre-polish.css',
  'homepage-components.css',
  'homepage-visual.css',
  'homepage-late-overrides.css',
  'homepage-translated-hero.css',
  'homepage-translated-components.css',
  'homepage-translated-late-overrides.css'
];

function stripComments(value) {
  return value.replace(/\/\*[\s\S]*?\*\//g, '');
}

function findMatchingBrace(source, openIndex) {
  let depth = 1;
  let quote = '';
  let escaped = false;
  let inComment = false;

  for (let index = openIndex + 1; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];

    if (inComment) {
      if (current === '*' && next === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (current === '\\') escaped = true;
      else if (current === quote) quote = '';
      continue;
    }
    if (current === '/' && next === '*') {
      inComment = true;
      index += 1;
    } else if (current === '"' || current === "'") {
      quote = current;
    } else if (current === '{') {
      depth += 1;
    } else if (current === '}' && --depth === 0) {
      return index;
    }
  }
  return -1;
}

let emptyDeclarationCount = 0;

function collectDeclarations(source, context = [], output = [], emptyBlocks = []) {
  let index = 0;
  let segmentStart = 0;
  let quote = '';
  let escaped = false;
  let inComment = false;
  let parentheses = 0;
  let brackets = 0;

  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];

    if (inComment) {
      if (current === '*' && next === '/') {
        inComment = false;
        index += 2;
        continue;
      }
      index += 1;
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (current === '\\') escaped = true;
      else if (current === quote) quote = '';
      index += 1;
      continue;
    }
    if (current === '/' && next === '*') {
      inComment = true;
      index += 2;
      continue;
    }
    if (current === '"' || current === "'") {
      quote = current;
      index += 1;
      continue;
    }
    if (current === '(') parentheses += 1;
    else if (current === ')') parentheses = Math.max(0, parentheses - 1);
    else if (current === '[') brackets += 1;
    else if (current === ']') brackets = Math.max(0, brackets - 1);

    if (current === '{' && parentheses === 0 && brackets === 0) {
      const header = stripComments(source.slice(segmentStart, index)).trim().replace(/\s+/g, ' ');
      const closeIndex = findMatchingBrace(source, index);
      assert.notEqual(closeIndex, -1, 'CSS contains an unbalanced block');
      const body = source.slice(index + 1, closeIndex);
      if (!stripComments(body).replace(/;/g, '').trim()) emptyBlocks.push({ header, context: context.join(' ') });

      if (header.startsWith('@')) {
        if (/^@(media|supports|container|layer|document|scope|keyframes|-webkit-keyframes)\b/i.test(header)) {
          collectDeclarations(body, [...context, header], output, emptyBlocks);
        }
      } else {
        collectRuleDeclarations(body, header, context, output);
      }
      index = closeIndex + 1;
      segmentStart = index;
      continue;
    }

    if (current === ';' && parentheses === 0 && brackets === 0) {
      segmentStart = index + 1;
    }
    index += 1;
  }
  return output;
}

function collectRuleDeclarations(body, selector, context, output) {
  let index = 0;
  let declarationStart = 0;
  let quote = '';
  let escaped = false;
  let inComment = false;
  let parentheses = 0;
  let brackets = 0;

  while (index <= body.length) {
    const current = body[index];
    const next = body[index + 1];
    const atEnd = index === body.length;
    const atSeparator = !quote && !inComment && parentheses === 0 && brackets === 0 && current === ';';

    if (atEnd || atSeparator) {
      const raw = body.slice(declarationStart, index);
      const cleaned = stripComments(raw).trim();
      const match = cleaned.match(/^([-\w]+)\s*:\s*([\s\S]*)$/);
      // Leave declarations containing comments untouched: they may carry
      // fallback values or explanatory notes that should not be rewritten.
      if (match && !raw.includes('/*')) {
        const value = match[2].trim().replace(/\s+/g, ' ');
        output.push({
          selector,
          context: context.join(' '),
          property: match[1].trim().toLowerCase(),
          value: value.replace(/!\s*important\s*$/i, '').trim(),
          important: /!\s*important\s*$/i.test(value)
        });
      }
      if (atSeparator && cleaned.length === 0) emptyDeclarationCount += 1;
      declarationStart = index + 1;
    }

    if (atEnd) break;
    if (inComment) {
      if (current === '*' && next === '/') {
        inComment = false;
        index += 1;
      }
      index += 1;
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (current === '\\') escaped = true;
      else if (current === quote) quote = '';
      index += 1;
      continue;
    }
    if (current === '/' && next === '*') {
      inComment = true;
      index += 2;
      continue;
    }
    if (current === '"' || current === "'") quote = current;
    else if (current === '(') parentheses += 1;
    else if (current === ')') parentheses = Math.max(0, parentheses - 1);
    else if (current === '[') brackets += 1;
    else if (current === ']') brackets = Math.max(0, brackets - 1);
    index += 1;
  }
}

function findShadowedExactDuplicates(declarations) {
  const groups = new Map();
  for (const declaration of declarations) {
    const key = [declaration.context, declaration.selector, declaration.property].join('\u0000');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(declaration);
  }

  const duplicates = [];
  for (const group of groups.values()) {
    const later = [];
    for (let index = group.length - 1; index >= 0; index -= 1) {
      const current = group[index];
      if (later.some(previous =>
        previous.value === current.value && (previous.important || !current.important)
      )) {
        duplicates.push(current);
      }
      later.push(current);
    }
  }
  return duplicates;
}

let totalDeclarations = 0;
for (const file of cssFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  emptyDeclarationCount = 0;
  const emptyBlocks = [];
  const declarations = collectDeclarations(source, [], [], emptyBlocks);
  assert.ok(declarations.length > 100, file + ': CSS parser did not inspect enough declarations');
  assert.deepEqual(emptyBlocks, [], file + ': empty CSS rules or conditional wrappers remain');
  assert.equal(emptyDeclarationCount, 0, file + ': empty declaration separators remain');
  const duplicates = findShadowedExactDuplicates(declarations);
  assert.deepEqual(
    duplicates.map(item => ({ selector: item.selector, context: item.context, property: item.property })),
    [],
    file + ': exact duplicate declarations remain shadowed by later identical declarations'
  );
  totalDeclarations += declarations.length;
  console.log('PASS', file, 'declarations=' + declarations.length, 'shadowedExactDuplicates=0');
}
console.log('PASS: ' + cssFiles.length + ' stylesheets; ' + totalDeclarations + ' declarations scanned; no exact shadowed duplicates remain.');
