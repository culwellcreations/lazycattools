#!/usr/bin/env node
// Checks the generated kitchen pages against the data and known answers.
// Run after building:  node _build/test-kitchen.mjs
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const K = require(join(ROOT, 'assets/js/kitchen-converter.js'));
const DATA = JSON.parse(readFileSync(join(ROOT, '_build/kitchen/ingredients.json'), 'utf8'));

let fails = 0, passes = 0;
const check = (ok, msg) => { if (ok) passes++; else { fails++; console.log('FAIL ' + msg); } };
const page = (p) => readFileSync(join(ROOT, p, 'index.html'), 'utf8');
const rowValue = (html, id) => {
  const m = html.match(new RegExp(`<tr id="${id}"><th[^>]*>.*?</th><td class="num-main">(.*?)</td>`));
  return m && m[1].replace(/<[^>]+>/g, '');
};

// 1. Known answers people search for (from recipe labels and standard charts).
const known = [
  ['butter', '3-4-cup', '170 g'], ['butter', '1-2-cup', '113 g'], ['butter', 'extra-1', '113 g'], ['butter', '1-cup', '227 g'],
  ['all-purpose-flour', '1-cup', '120 g'], ['granulated-sugar', '1-cup', '200 g'], ['water', '1-cup', '237 g'],
  ['brown-sugar', '1-cup', '213 g'], ['honey', '1-tbsp', '21 g'], ['peanut-butter', '1-tbsp', '16 g'],
  ['milk', '1-cup', '244 g'], ['vegetable-oil', '1-cup', '218 g'],
];
for (const [slug, id, want] of known) {
  const html = page(`kitchen/${slug}-cups-to-grams`);
  check(rowValue(html, id) === want, `${slug} ${id}: got ${rowValue(html, id)}, want ${want}`);
}
const spoonKnown = [['salt', '1-tsp', '6 g'], ['baking-powder', '1-tsp', '4.6 g'], ['baking-soda', '1-tsp', '4.8 g'], ['salt', '1-tbsp', '18 g']];
for (const [slug, id, want] of spoonKnown) {
  const html = page(`kitchen/${slug}-teaspoons-to-grams`);
  check(rowValue(html, id) === want, `${slug} ${id}: got ${rowValue(html, id)}, want ${want}`);
}

// 2. Every ingredient page exists and its 1-cup / 1-tsp row matches the data.
for (const ing of DATA.ingredients) {
  const path = `kitchen/${ing.slug}-${ing.mode === 'spoon' ? 'teaspoons' : 'cups'}-to-grams`;
  check(existsSync(join(ROOT, path, 'index.html')), `missing page ${path}`);
  const html = page(path);
  const id = ing.mode === 'spoon' ? '1-tsp' : '1-cup';
  const want = K.formatGrams(ing.mode === 'spoon' ? ing.gpc / 48 : ing.gpc);
  check(rowValue(html, id) === want, `${ing.slug} ${id}: got ${rowValue(html, id)}, want ${want}`);
  check(html.includes(`<link rel="canonical" href="https://lazycattools.com/${path}/">`), `${ing.slug}: canonical`);
  check((html.match(/<h1>/g) || []).length === 1, `${ing.slug}: exactly one h1`);
  check(html.includes('"@type": "FAQPage"'), `${ing.slug}: FAQ schema`);
  check(ing.body.join(' ').split(/\s+/).length >= 80, `${ing.slug}: unique text is at least 80 words`);
  JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
}

// 3. Amount pages: spot-check values that appear in search results.
const g200 = page('kitchen/200-grams-to-cups');
check(g200.includes('200 g is 1⅔ cups of all-purpose flour, 1 cup of granulated sugar, or ⅞ cup of butter'), '200 g answer line');
const half = page('kitchen/half-cup-in-grams');
check(half.includes('½ cup of all-purpose flour weighs <strong>60 g</strong>'), '½ cup flour = 60 g');
const tq = page('kitchen/three-quarters-cup-in-grams');
check(/Butter<\/a><\/th><td class="num-main">170 g</.test(tq), '¾ cup butter = 170 g on amount page');

// 4. Parser handles the ways people type amounts.
for (const [input, want] of [['1 1/2', 1.5], ['1-1/2', 1.5], ['1½', 1.5], ['¾', 0.75], ['2 and 1/2', 2.5], ['0,5', 0.5], ['.25', 0.25]]) {
  check(Math.abs(K.parseAmount(input) - want) < 1e-9, `parseAmount(${input})`);
}
for (const bad of ['', 'abc', '1 2', '1/0', '-']) check(Number.isNaN(K.parseAmount(bad)), `parseAmount rejects "${bad}"`);

// 5. Sitemap lists every kitchen page once.
const sm = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const urls = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
check(new Set(urls).size === urls.length, 'sitemap has no duplicates');
check(urls.filter((u) => u.includes('/kitchen/')).length === 2 + DATA.ingredients.length + DATA.amounts.grams.length + DATA.amounts.cups.length, 'sitemap kitchen count');

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
