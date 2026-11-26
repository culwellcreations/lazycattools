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
check(urls.filter((u) => u.includes('/kitchen/')).length === 8 + DATA.ingredients.length + DATA.amounts.grams.length + DATA.amounts.cups.length, 'sitemap kitchen count');

// 6. Phase 3 tool pages and their charts.
const R = require(join(ROOT, 'assets/js/recipe-tools.js'));
const spoons = page('kitchen/cups-tablespoons-teaspoons');
check(/<tr id="1-3-cup"><th scope="row">⅓ cup<\/th><td class="num-main">5 tbsp \+ 1 tsp</.test(spoons), 'spoons: ⅓ cup = 5 tbsp + 1 tsp');
check(/<tr id="1-2-cup"><th scope="row">½ cup<\/th><td class="num-main">8 tbsp<\/td><td>24</.test(spoons), 'spoons: ½ cup = 8 tbsp = 24 tsp');
const butterTool = page('kitchen/butter-converter');
check(/<tr id="1-stick"><th scope="row">1 stick<\/th><td class="num-main">113 g</.test(butterTool), 'butter: 1 stick = 113 g');
const oven = page('kitchen/oven-temperature');
check(/<tr id="350f"><th scope="row">350 °F<\/th><td class="num-main">177 °C<\/td><td>180 °C<\/td><td>4</.test(oven), 'oven: 350 °F = 177 °C, gas 4');
check(existsSync(join(ROOT, 'kitchen/recipe-scaler/index.html')) && existsSync(join(ROOT, 'kitchen/recipe-converter/index.html')), 'recipe tool pages exist');

// Pan size converter.
const PA = (id) => { const p = K.panById(id); return K.panArea(p.shape, p.a, p.b); };
check(Math.abs(PA('r9') - 63.62) < 0.01, 'pan: 9-inch round = 63.6 sq in');
check(PA('p9x13') === 117 && PA('s8') === 64, 'pan: 9×13 = 117, 8×8 = 64');
check(K.panAdvice(PA('r9') / PA('r8')).main === 'Make 1¼×', 'pan: 8" → 9" round = 1¼×');
check(K.panAdvice(PA('s8') / PA('r9')).kind === 'same', 'pan: 9" round ≈ 8×8');
check(K.panAdvice((2 * PA('r9')) / PA('p9x13')).kind === 'close', 'pan: 9×13 → two 9" rounds works as written');
check(K.panAdvice(PA('p18x13') / PA('p9x13')).main === 'Make 2×', 'pan: half sheet = 2× a 9×13');
check(Math.abs(K.panArea('round', 20 / 2.54) - PA('r8')) / PA('r8') < 0.05, 'pan: 20 cm round ≈ 8-inch round');
const pan = page('kitchen/pan-size-converter');
check(/data-pan-converter/.test(pan) && /<tr id="pan-r9"><th scope="row">9-inch round<\/th><td class="num-main">63.6 sq in/.test(pan), 'pan page: chart row');
check(/<th scope="row">8-inch round<\/th><td>9-inch round<\/td><td class="num-main">×1.27</.test(pan), 'pan page: swap 8" → 9" = ×1.27');

// 7. Recipe reader, scaler and converter.
const match = R.makeMatcher(DATA.ingredients);
const scale = [
  ['2 1/4 cups all-purpose flour', 2, '4½ cups all-purpose flour'],
  ['2 1/4 cups all-purpose flour', 0.5, '1 cup + 2 tbsp all-purpose flour'],
  ['1 tsp salt', 3, '1 tbsp salt'],
  ['1/4 cup sugar', 0.5, '2 tbsp sugar'],
  ['1/3 cup sugar', 0.5, '2⅔ tbsp sugar'],
  ['3 tablespoons cocoa powder', 1.5, '4½ tbsp cocoa powder'],
  ['2 large eggs', 1.5, '3 large eggs'],
  ['2 large eggs', 0.5, '1 large egg'],
  ['1 egg', 2, '2 eggs'],
  ['1 medium potato, diced', 3, '3 medium potatoes, diced'],
  ['2 cloves garlic', 0.5, '1 clove garlic'],
  ['Pinch of salt', 2, 'Pinch of salt'],
  ['1 cup (120 g) flour', 2, '2 cups (240 g) flour'],
  ['2-3 cups water', 2, '4–6 cups water'],
  ['2 T honey', 2, '¼ cup honey'],
  ['1½ cups milk', 2, '3 cups milk'],
  ['3/4 cup sugar', 0.5, '6 tbsp sugar'],
  ['2 3/4 cups flour', 0.5, '1¼ cups + 2 tbsp flour'],
  ['2 1/4 cups flour', 1.5, '3¼ cups + 2 tbsp flour'],
];
for (const [line, f, want] of scale) { const got = R.scaleLine(line, f).text; check(got === want, `scale "${line}" x${f}: got "${got}", want "${want}"`); }
const conv = [
  ['2 1/4 cups all-purpose flour', 'grams', '270 g all-purpose flour (2¼ cups)'],
  ['1 cup butter, softened', 'grams', '227 g butter, softened (1 cup)'],
  ['3/4 cup packed brown sugar', 'grams', '160 g packed brown sugar (¾ cup)'],
  ['1 cup (120 g) flour', 'grams', '120 g flour (1 cup)'],
  ['1 stick butter', 'grams', '113 g butter (1 stick)'],
  ['200 g all-purpose flour', 'cups', '1⅔ cups all-purpose flour (200 g)'],
  ['100 g sugar', 'cups', '½ cup sugar (100 g)'],
];
for (const [line, t, want] of conv) { const got = R.convertLine(line, t, match).text; check(got === want, `convert "${line}" to ${t}: got "${got}", want "${want}"`); }
for (const line of ['1 cup buttermilk', '2 tsp kosher salt', '1 cup rice flour', '1 cup coconut milk', '2 tsp vanilla extract']) {
  check(R.convertLine(line, 'grams', match).status === 'unmatched', `"${line}" is left unmatched, not guessed`);
}
check(match('1/2 cup peanut butter').slug === 'peanut-butter', 'peanut butter is not butter');
check(match('confectioners\' sugar').slug === 'powdered-sugar', "confectioners' sugar");
check(match('1 cup plain flour').slug === 'all-purpose-flour', 'plain flour');
check(match('2 cups semisweet chocolate chips').slug === 'chocolate-chips', 'chocolate chips');

// 8. Guides.
const { loadGuides } = await import(join(ROOT, '_build/guides.mjs'));
for (const gd of loadGuides(ROOT)) {
  const html = page(gd.path.slice(1, -1));
  check(html.includes('"@type": "Article"'), `${gd.slug}: Article schema`);
  check(gd.words >= 600, `${gd.slug}: at least 600 words (has ${gd.words})`);
  check((gd.body.match(/—/g) || []).length <= 2, `${gd.slug}: at most 2 em dashes`);
  check(!/not just|it's not about|delve|crucial|testament|landscape|seamless/i.test(gd.body), `${gd.slug}: no flagged AI phrasing`);
  for (const m of gd.body.matchAll(/\]\((\/[^)]*)\)/g)) check(existsSync(join(ROOT, m[1], 'index.html')), `${gd.slug}: link ${m[1]} exists`);
  for (const r of gd.related) check(existsSync(join(ROOT, r.href, 'index.html')), `${gd.slug}: related ${r.href} exists`);
}

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
