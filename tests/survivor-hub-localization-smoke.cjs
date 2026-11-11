'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const html = fs.readFileSync('survivor-hub.html', 'utf8');
const start = html.indexOf('const copy={');
const end = html.indexOf('\nlet lang=', start);
assert.notEqual(start, -1, 'Survivor Hub locale dictionary must exist');
assert.notEqual(end, -1, 'Survivor Hub locale dictionary must close before language initialization');
const dictionary = html.slice(start, end);
const locales = ['en', 'de', 'fr', 'it', 'ja', 'zh-CN', 'ru', 'tr', 'hi'];
for (const locale of locales) {
  const marker = locale === 'zh-CN' ? "'zh-CN':{" : locale + ':{';
  assert.ok(dictionary.includes(marker), 'Missing locale dictionary: ' + locale);
}
const zhStart = dictionary.indexOf("'zh-CN':{");
const zhEnd = dictionary.indexOf('},', zhStart);
const zh = dictionary.slice(zhStart, zhEnd < 0 ? dictionary.length : zhEnd);
const english = dictionary.match(/en:\{([\s\S]*?)\},de:\{/);
assert.ok(english, 'English source dictionary must exist');
const requiredKeys = [...english[1].matchAll(/([A-Za-z][A-Za-z0-9]*):'/g)].map(match => match[1]);
for (const key of requiredKeys) {
  assert.ok(zh.includes(key + ':'), 'zh-CN is missing ' + key);
}
assert.ok(html.includes("document.addEventListener('zombcash:languagechange'"), 'Survivor Hub must respond to shared language selector');
console.log('PASS: Survivor Hub has all 9 locale dictionaries and required zh-CN translations.');