const fs = require('node:fs');
const assert = require('node:assert/strict');

const read = name => fs.readFileSync(name, 'utf8');
const script = read('script.js');
const auth = read('survivor-auth.js');
const nav = read('shared-nav.js');
const recovery = read('living-world-recovery.js');
const language = read('language.js');

assert.match(script, /const zcApiFetch = \(url, options = \{\}, timeoutMs = 15000\) => fetch\(url, \{[\s\S]*?signal: options\.signal \|\| AbortSignal\.timeout\(timeoutMs\)/,
  'site script helper must apply a default timeout and preserve explicit request signals');
const rawScriptFetches = script.split(/\r?\n/).filter(line => /\bfetch\(/.test(line));
assert.equal(rawScriptFetches.length, 2, 'only the timeout helper and fire-and-forget keepalive tracker may use raw fetch in script.js');
assert(rawScriptFetches.some(line => /keepalive:true/.test(line)), 'campaign tracking keepalive must remain fire-and-forget');
assert((script.match(/\bzcApiFetch\(/g) || []).length >= 20, 'all dashboard, market, game, vote and leaderboard requests must use zcApiFetch');

assert.match(auth, /const survivorApiFetch = \(url, options = \{\}, timeoutMs = 15000\) => fetch\(url, \{[\s\S]*?signal: options\.signal \|\| AbortSignal\.timeout\(timeoutMs\)/,
  'Survivor API helper must apply a default timeout and preserve explicit request signals');
assert.equal((auth.match(/\bfetch\(API\s*\+/g) || []).length, 0, 'no Survivor API call may bypass the bounded helper');
const authRequests = (auth.match(/\bsurvivorApiFetch\(API\s*\+/g) || []).length;
assert.equal(authRequests, 11, 'all 11 Telegram/profile/presence/referral API requests must use the bounded helper');

const refreshStart = nav.indexOf('const refresh = () => fetch(api,');
assert.notEqual(refreshStart, -1, 'shared navigation global-footprint refresh must exist');
const refreshBlock = nav.slice(refreshStart, refreshStart + 180);
assert.match(refreshBlock, /AbortSignal\.timeout\(10000\)/, 'shared navigation stats refresh must time out');
assert.match(nav, /fetch\(api, \{method:'POST',[^}]*keepalive:true\}/, 'visitor heartbeat must remain fire-and-forget');

assert.match(recovery, /signal: AbortSignal\.timeout\(timeout\)/, 'independent news/market recovery requests must remain bounded');
assert.equal((language.match(/\bfetch\(/g) || []).length, 0, 'language.js must remain free of unnecessary network requests');

console.log('PASS: first-party site, market, game, Telegram, profile, presence and shared-navigation API requests have bounded timeouts; fire-and-forget analytics is preserved.');
