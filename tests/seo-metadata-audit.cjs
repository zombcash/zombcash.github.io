#!/usr/bin/env node
'use strict';

/**
 * Static SEO metadata smoke test for the published GitHub Pages tree.
 * Run with: node tests/seo-metadata-audit.cjs
 *
 * Checks canonical uniqueness/URL shape and consistency with Open Graph,
 * plus language metadata and hreflang target existence. This is deliberately
 * a smoke test: translation relationships still need editorial verification.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://zombcash.github.io';
const EXCLUDED = new Set(['googlefc2bfa7780e4e58d.html', 'naver99d7cf4102d4f121ac8f2502eb7ec603.html']);
const LANG_DIRS = new Set(['de', 'fr', 'it', 'ja', 'zh-CN', 'tr', 'hi', 'ru']);
const HTML_FILES = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.html?$/i.test(entry.name) && !EXCLUDED.has(path.relative(ROOT, full).split(path.sep).join('/'))) {
      HTML_FILES.push(full);
    }
  }
}

function attr(tag, name) {
  const namePattern = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp('\\b' + namePattern + '\\s*=\\s*(?:"([^"]*)"|\\'([^\\']*)\\'|([^\\s>]+))', 'i'));
  return match ? (match[1] ?? match[2] ?? match[3] ?? null) : null;
}
function tags(head, tagName, predicate) {
  const re = new RegExp('<' + tagName + '\\b[^>]*>', 'gi');
  return [...head.matchAll(re)].map(match => match[0]).filter(predicate || (() => true));
}
function findLinks(head, rel) {
  return tags(head, 'link', tag => (attr(tag, 'rel') || '').toLowerCase().split(/\s+/).includes(rel));
}
function findMeta(head, keyName, keyValue) {
  return tags(head, 'meta', tag => (attr(tag, keyName) || '').toLowerCase() === keyValue.toLowerCase());
}
function publicUrl(relativePath) {
  let rel = relativePath.split(path.sep).join('/');
  // GitHub Pages serves a root index as the slash-ending directory URL.
  if (rel === 'index.html') return SITE + '/';
  if (/\/index\.html$/i.test(rel)) return SITE + '/' + rel.slice(0, -'index.html'.length);
  return SITE + '/' + rel;
}
function normalizedUrl(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.origin !== SITE) return null;
    if (u.search || u.hash) return null;
    return u.href;
  } catch (_) { return null; }
}
function expectedLanguage(relativePath, html) {
  const first = relativePath.split(path.sep)[0];
  if (relativePath.includes(path.sep) && LANG_DIRS.has(first)) {
    // The locale lives in the directory; html[lang] is validated separately.
    return first;
  }
  return 'en';
}

walk(ROOT);
const publishedPaths = new Set(HTML_FILES.map(f => path.relative(ROOT, f).split(path.sep).join('/')));
const errors = [];
const warnings = [];

for (const file of HTML_FILES) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');
  const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) {
    errors.push(rel + ': missing <head>');
    continue;
  }
  const head = headMatch[1];
  const canonicalTags = findLinks(head, 'canonical');
  const canonical = canonicalTags.map(t => attr(t, 'href'));
  const expected = publicUrl(rel);

  if (canonical.length !== 1) {
    errors.push(rel + ': expected exactly one canonical, found ' + canonical.length);
  } else {
    const valid = normalizedUrl(canonical[0]);
    if (!valid) errors.push(rel + ': canonical must be absolute HTTPS on the canonical host, without query/hash: ' + canonical[0]);
    if (canonical[0] !== expected) errors.push(rel + ': canonical does not match this page URL; expected ' + expected + ', found ' + canonical[0]);
  }

  const ogUrlTags = findMeta(head, 'property', 'og:url');
  const ogUrls = ogUrlTags.map(t => attr(t, 'content'));
  if (ogUrls.length !== 1) errors.push(rel + ': expected exactly one og:url, found ' + ogUrls.length);
  else if (canonical.length === 1 && ogUrls[0] !== canonical[0]) errors.push(rel + ': og:url differs from canonical (' + ogUrls[0] + ')');

  const langAttr = attr((html.match(/<html\b[^>]*>/i) || [''])[0], 'lang');
  if (!langAttr) errors.push(rel + ': missing html lang');
  else if (langAttr.toLowerCase() !== expectedLanguage(rel, html).toLowerCase()) {
    errors.push(rel + ': html lang "' + langAttr + '" differs from expected path locale "' + expectedLanguage(rel, html) + '"');
  }

  const alternates = findLinks(head, 'alternate').filter(t => attr(t, 'hreflang'));
  const codes = alternates.map(t => attr(t, 'hreflang'));
  const targets = alternates.map(t => attr(t, 'href'));
  const seen = new Set();
  for (let i = 0; i < alternates.length; i++) {
    const code = codes[i], target = targets[i];
    if (seen.has(code)) errors.push(rel + ': duplicate hreflang code ' + code);
    seen.add(code);
    const valid = normalizedUrl(target);
    if (!valid) {
      errors.push(rel + ': hreflang ' + code + ' must target same-site HTTPS without query/hash: ' + target);
      continue;
    }
    const pathname = new URL(target).pathname;
    let targetPath = decodeURIComponent(pathname).replace(/^\/+/, '');
    if (!targetPath) targetPath = 'index.html';
    else if (targetPath.endsWith('/')) targetPath += 'index.html';
    if (!publishedPaths.has(targetPath)) errors.push(rel + ': hreflang ' + code + ' points to missing local HTML ' + targetPath);
  }
  if (seen.has('zh-Hans') && seen.has('zh-CN')) errors.push(rel + ': use one consistent Chinese hreflang code, not both zh-Hans and zh-CN');
  if (seen.has('x-default') && !targets[codes.indexOf('x-default')]) errors.push(rel + ': x-default has empty target');
  if (canonical.length === 1 && seen.has(langAttr) && targets[codes.indexOf(langAttr)] !== canonical[0]) {
    errors.push(rel + ': hreflang for own html lang does not point to its canonical URL');
  }
  if (!seen.has('x-default')) warnings.push(rel + ': no x-default alternate found');

  const ogImageTags = findMeta(head, 'property', 'og:image');
  if (ogImageTags.length < 1) warnings.push(rel + ': missing og:image');
  else if (!/^https:\/\/[^/]+\/.+/i.test(attr(ogImageTags[0], 'content') || '')) {
    errors.push(rel + ': og:image must be an absolute HTTPS URL');
  }
}

console.log('HTML pages checked: ' + HTML_FILES.length);
console.log('Errors: ' + errors.length);
console.log('Warnings: ' + warnings.length);
for (const error of errors) console.error('ERROR ' + error);
for (const warning of warnings) console.warn('WARN  ' + warning);
if (errors.length) process.exitCode = 1;
