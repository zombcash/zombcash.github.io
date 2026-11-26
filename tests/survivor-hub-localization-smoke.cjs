'use strict';

const fs = require('node:fs');
const assert = require('node:assert/strict');

const ROOT = 'https://zombcash.github.io/';
const locales = ['en', 'de', 'fr', 'it', 'ja', 'zh-CN', 'ru', 'tr', 'hi'];
const localeTitles = {
  en: 'Survivor Hub: Referrals &amp; Leaderboard | ZombieCash',
  de: 'Überlebenden-Hub | Community &amp; Survival Points',
  fr: 'Espace des survivants — ZombieCash',
  it: 'Hub dei sopravvissuti — ZombieCash',
  ja: 'サバイバー・ハブ | ZombieCash コミュニティランキング',
  'zh-CN': '幸存者中心 | 生存积分与社区排行榜',
  ru: 'Центр выживших | Очки и рейтинг сообщества',
  tr: 'Hayatta Kalanlar Merkezi — ZombieCash',
  hi: 'सर्वाइवर हब | पॉइंट्स और लीडरबोर्ड',
};

function extractMeta(html, expression, label) {
  const match = html.match(expression);
  assert.ok(match, 'Missing ' + label);
  return match[1];
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractDictionary(html, label) {
  const start = html.indexOf('const copy={');
  const end = html.indexOf('\nlet lang=', start);
  assert.notEqual(start, -1, label + ' locale dictionary must exist');
  assert.notEqual(end, -1, label + ' locale dictionary must close before language initialization');
  return html.slice(start, end);
}

function extractLocaleBlock(dictionary, locale) {
  const marker = locale === 'zh-CN' ? "'zh-CN':{" : locale + ':{';
  const start = dictionary.indexOf(marker);
  assert.notEqual(start, -1, 'Missing locale dictionary: ' + locale);
  const open = dictionary.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = open; i < dictionary.length; i += 1) {
    const char = dictionary[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') quote = char;
    else if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return dictionary.slice(open, i + 1);
  }
  throw new Error('Unclosed locale dictionary: ' + locale);
}

function extractAlternates(html) {
  return [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)]
    .map(match => [match[1], match[2]]);
}

function assetVersion(html, fileName, label) {
  const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return extractMeta(html, new RegExp('<script src="([^"]*' + escaped + '\\?[^"]*)"', 'i'), label)
    .replace(/^\.\.\//, '');
}

const sourcePath = 'survivor-hub.html';
const source = fs.readFileSync(sourcePath, 'utf8');
const sourceDictionary = extractDictionary(source, 'English source');
const languageJs = fs.readFileSync('language.js', 'utf8');
const expectedRoutes = '"\/survivor-hub.html": ["de","fr","it","ja","zh-CN","ru","tr","hi"]';
assert.ok(languageJs.includes(expectedRoutes), 'language routing must use dedicated Survivor Hub locale URLs');

const expectedAlternates = [
  ['en', ROOT + 'survivor-hub.html'],
  ['de', ROOT + 'de/survivor-hub.html'],
  ['fr', ROOT + 'fr/survivor-hub.html'],
  ['it', ROOT + 'it/survivor-hub.html'],
  ['ja', ROOT + 'ja/survivor-hub.html'],
  ['zh-Hans', ROOT + 'zh-CN/survivor-hub.html'],
  ['ru', ROOT + 'ru/survivor-hub.html'],
  ['tr', ROOT + 'tr/survivor-hub.html'],
  ['hi', ROOT + 'hi/survivor-hub.html'],
  ['x-default', ROOT + 'survivor-hub.html'],
];

const sharedNavVersion = assetVersion(source, 'shared-nav.js', 'English shared navigation script');
const languageVersion = assetVersion(source, 'language.js', 'English language script');
const authVersion = assetVersion(source, 'survivor-auth.js', 'English survivor auth script');

for (const locale of locales) {
  const localizedPath = locale === 'en' ? sourcePath : locale + '/survivor-hub.html';
  const html = locale === 'en' ? source : fs.readFileSync(localizedPath, 'utf8');
  const dictionary = extractDictionary(html, localizedPath);
  assert.equal(dictionary, sourceDictionary, localizedPath + ' must use the shared locale dictionary');

  const localeBlock = extractLocaleBlock(dictionary, locale);
  assert.match(localeBlock, /online:'[^']+'/u, localizedPath + ' must translate the ONLINE badge');
  assert.match(localeBlock, /onlineNow:'[^']+'/u, localizedPath + ' must translate the online tooltip');

  const title = extractMeta(html, /<title>([^<]*)<\/title>/i, localizedPath + ' title');
  const description = extractMeta(html, /<meta name="description" content="([^"]*)"/i, localizedPath + ' description');
  const canonical = extractMeta(html, /<link rel="canonical" href="([^"]*)"/i, localizedPath + ' canonical');
  const ogTitle = extractMeta(html, /<meta property="og:title" content="([^"]*)"/i, localizedPath + ' Open Graph title');
  const twitterTitle = extractMeta(html, /<meta name="twitter:title" content="([^"]*)"/i, localizedPath + ' Twitter title');
  const ogDescription = extractMeta(html, /<meta property="og:description" content="([^"]*)"/i, localizedPath + ' Open Graph description');
  const twitterDescription = extractMeta(html, /<meta name="twitter:description" content="([^"]*)"/i, localizedPath + ' Twitter description');
  const ogUrl = extractMeta(html, /<meta property="og:url" content="([^"]*)"/i, localizedPath + ' Open Graph URL');

  assert.equal(title, localeTitles[locale], localizedPath + ' title must match the locale');
  assert.equal(ogTitle, title, localizedPath + ' Open Graph title must match the page title');
  assert.equal(twitterTitle, title, localizedPath + ' Twitter title must match the page title');
  assert.equal(ogDescription, description, localizedPath + ' Open Graph description must match the localized description');
  assert.equal(twitterDescription, description, localizedPath + ' Twitter description must match the localized description');
  assert.equal(canonical, ROOT + (locale === 'en' ? '' : locale + '/') + 'survivor-hub.html', localizedPath + ' must have a self-canonical URL');
  assert.equal(ogUrl, canonical, localizedPath + ' Open Graph URL must match canonical');

  const htmlLang = extractMeta(html, /<html lang="([^"]+)"/i, localizedPath + ' html language');
  assert.equal(htmlLang, locale, localizedPath + ' must declare its language');

  const alternates = extractAlternates(html);
  assert.deepEqual(alternates, expectedAlternates, localizedPath + ' must expose the same complete hreflang set');

  const navScript = assetVersion(html, 'shared-nav.js', localizedPath + ' shared navigation script');
  const localeScript = assetVersion(html, 'language.js', localizedPath + ' language script');
  const authScript = assetVersion(html, 'survivor-auth.js', localizedPath + ' survivor auth script');
  assert.equal(navScript, sharedNavVersion, localizedPath + ' must use the shared navigation asset version');
  assert.equal(localeScript, languageVersion, localizedPath + ' must use the shared language asset version');
  assert.equal(authScript, authVersion, localizedPath + ' must use the shared survivor auth asset version');
  assert.ok(html.includes('<header><button class="top-cta"'), localizedPath + ' must preserve the shared-header login mount');

  const schemaText = extractMeta(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i, localizedPath + ' JSON-LD');
  const schema = JSON.parse(schemaText);
  assert.equal(schema.inLanguage, locale, localizedPath + ' JSON-LD language must match the page');
  assert.equal(schema.name, decodeHtmlEntities(title), localizedPath + ' JSON-LD name must match the decoded page title');
  assert.equal(schema.url, canonical, localizedPath + ' JSON-LD URL must match the self-canonical URL');
  assert.equal(schema['@id'], canonical + '#webpage', localizedPath + ' JSON-LD @id must identify the localized canonical page');
  assert.equal(schema.description, description, localizedPath + ' JSON-LD description must match the localized description');
}

assert.ok(source.includes("document.addEventListener('zombcash:languagechange'"), 'Survivor Hub must respond to the shared language selector');
assert.ok(source.includes("name.title=tr('onlineNow')"), 'Online tooltip must use the active locale');
assert.ok(source.includes("online.textContent='● '+tr('online')"), 'Online badge must use the active locale');
assert.ok(source.includes('.leader-online{'), 'Online badge must use a translatable DOM element');
console.log('PASS: Survivor Hub navigation, all 9 locale dictionaries, dynamic online labels, canonical/hreflang and localized social/schema metadata.');
