'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'zombie-maker.html'), 'utf8');

assert.match(html, /const makerApiFetch = \(url, options = \{\}, timeoutMs = 15000\) => fetch\(url, \{[\s\S]*?signal: options\.signal \|\| AbortSignal\.timeout\(timeoutMs\)/,
  'Zombie Lab API helper must enforce a bounded request timeout');
assert.match(html, /makerApiFetch\(API \+ '\/api\/zombie-maker'[\s\S]*?\}, 90000\)/,
  'AI image generation must have a 90-second timeout');
assert.match(html, /makerApiFetch\(API \+ '\/api\/zombie-share'[\s\S]*?\}, 30000\)/,
  'Telegram photo sharing must have a 30-second timeout');
assert.match(html, /makerApiFetch\(API \+ '\/api\/zombie-caption'[\s\S]*?\}, 45000\)/,
  'AI caption generation must have a 45-second timeout');
assert.match(html, /id="mutation-label"[^>]*>SELECT YOUR MUTATION/);
assert.match(html, /class="styles" role="group" aria-labelledby="mutation-label"/,
  'Mutation style buttons must be exposed as a labelled control group');
assert.match(html, /The AI transformation timed out/);
assert.match(html, /Telegram delivery timed out/);
assert.match(html, /AI caption request timed out/);

const rawApiCalls = [...html.matchAll(/\bfetch\(API\s*\+\s*'([^']+)'/g)].map(match => match[1]);
assert.deepEqual(rawApiCalls, ['/api/survival/maker-saved'],
  'Only the non-blocking keepalive maker-save receipt may bypass the bounded API helper');
assert.match(html, /fetch\(API \+ '\/api\/survival\/maker-saved'[\s\S]*?keepalive:\s*true/,
  'The save receipt remains a non-blocking keepalive request');

console.log('PASS: Zombie Lab image, caption and Telegram requests are bounded; timeout recovery and mutation-group accessibility are guarded.');
