// Checks the 8 newer kitchen tools against their spec checklists and sources.
// Run: node _build/test-kitchen-tools-2.mjs (after node _build/build-kitchen.mjs)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KITCHEN_TOOLS_2 } from './kitchen-tools-2.mjs';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = require('../assets/js/kitchen-tools.js');
const page = (p) => readFileSync(join(ROOT, p, 'index.html'), 'utf8');

let fails = 0, passes = 0;
function check(cond, msg) { if (cond) passes++; else { fails++; console.log('FAIL', msg); } }
const eq = (a, b, msg) => check(JSON.stringify(a) === JSON.stringify(b), `${msg} (got ${JSON.stringify(a)})`);

// 1. Air fryer
eq(T.airFryer(400, 'f', 20), { temp: 375, unit: 'f', minutes: 16 }, '400 °F 20 min -> 375 °F 16 min');
eq(T.airFryer(350, 'f', 30), { temp: 325, unit: 'f', minutes: 24 }, '350 °F 30 min -> 325 °F 24 min');
eq(T.airFryer(375, 'f', 16, 'to-oven'), { temp: 400, unit: 'f', minutes: 20 }, 'reverse adds 25 °F and 25%');
check(T.airFryer(400, 'f', 1).minutes === 1, 'never below 1 minute');
check(Number.isInteger(T.airFryer(400, 'f', 17).minutes), 'whole minutes');
check(T.airFryer(200, 'c', 20).temp === 185, '°C drops 15');

// 2. Meat (temperatures from FoodSafety.gov)
const M = (id) => T.meatById(id);
check(M('steak').f === 145 && M('steak').rest === 3, 'steaks 145 °F, rest 3');
check(M('beef-roast').f === 145 && M('pork-roast').f === 145, 'roasts 145 °F');
check(M('ground').f === 160 && M('ground').rest === 0, 'ground 160 °F, no rest');
check(M('chicken-whole').f === 165 && M('poultry-pieces').f === 165 && M('turkey-whole').f === 165, 'poultry 165 °F');
check(M('ham-raw').f === 145 && M('ham-raw').rest === 3, 'fresh ham 145 °F, rest 3');
check(M('ham-cooked').f === 140 && /165/.test(M('ham-cooked').note), 'cooked ham 140 °F with the 165 °F caveat');
check(M('fish').f === 145, 'fish 145 °F');
eq(T.meat('chicken-whole', 4).time, [80, 80], 'chicken 4 lb about 80 min');
eq(T.meat('beef-roast', 4).time, [80, 100], 'beef roast 4 lb 80–100 min');
check(T.meat('steak', 2).time === null, 'no time estimate for steaks');
check(T.durationRange(80, 100) === 'about 1 hour 20 minutes to 1 hour 40 minutes', 'range text');
const meatHtml = page('kitchen/meat-temperature');
['145 °F (63 °C)', '160 °F (71 °C)', '165 °F (74 °C)', '140 °F (60 °C)'].forEach((s) => check(meatHtml.includes(s), `meat table shows ${s}`));

// 3. Coffee
const c1 = T.coffee('pour', 2, 240);
check(c1.water === 480 && c1.coffee === 30, 'pour over 2 x 240 -> 480 g water, 30 g coffee');
const c2 = T.coffee('press', 4, 240);
check(c2.water === 960 && Math.round(c2.coffee) === 69, 'French press 4 cups -> 960 g, ~69 g');
check(T.coffee('espresso', 1).coffee === 18 && T.coffee('espresso', 1).water === 36, 'espresso 1:2');
check(T.coffee('cold', 1, 240).coffee === 30, 'cold brew 1:8');
check(/approximate/.test(page('kitchen/coffee-ratio')), 'tablespoons labelled approximate');

// 4. Rice
const r1 = T.rice('white', 2, 'stove');
check(r1.water === 3 && r1.time === '15 to 18 minutes', 'white 2 cups stovetop -> 3 cups, 15–18 min');
const r2 = T.rice('brown', 1, 'stove');
check(r2.water === 2.5 && r2.time === '40 to 45 minutes', 'brown 1 cup -> 2.5 cups, 40–45 min');
check(T.rice('white', 2, 'ip').water === 2, 'Instant Pot 1:1 (Instant Pot manual)');
check(T.rice('wild', 1, 'ip').unsupported, 'wild rice not claimed for Instant Pot');
['jasmine', 'basmati', 'sushi'].forEach((id) => check(T.RICE.find((r) => r.id === id).rinse, `${id} has rinse note`));

// 5. Substitutions
const e2 = T.eggSub(2);
check(e2.applesauceCups === 0.5 && e2.flaxTbsp === 2 && e2.waterTbsp === 6, '2 eggs -> ½ cup applesauce, 2 tbsp flax + 6 tbsp water');
const h1 = T.honeyForSugar(1);
check(h1.honeyCups === 0.75 && Math.abs(h1.liquidCups - 0.1875) < 1e-9, '1 cup sugar -> ¾ cup honey, cut liquid by ¼ cup per cup of honey (3 tbsp)');
check(Math.abs(T.sugarForHoney(0.75).sugarCups - 1) < 1e-9, 'honey -> sugar inverse');
check(T.cocoaForChocolate(1).cocoaTbsp === 3 && T.cocoaForChocolate(1).fatTbsp === 1, '1 oz chocolate -> 3 tbsp cocoa + 1 tbsp fat');
check(Math.abs(T.salt(1, 'table', 'morton').tsp - 1.25) < 1e-9, '1 tsp table = 1¼ tsp Morton kosher (Morton chart)');
check(Math.abs(T.salt(1, 'table', 'diamond').tsp - 2.25) < 1e-9, '1 tsp table = 2¼ tsp Diamond Crystal (King Arthur weights)');
check(T.salt(1, 'table', 'table').tsp === 1, 'same salt is 1:1');
const salt = JSON.parse(readFileSync(join(ROOT, '_build/kitchen/ingredients.json'), 'utf8')).ingredients.find((i) => i.slug === 'salt');
check(salt.gpt === T.SALTS[0].gPerTsp, 'table salt weight matches the salt page (6 g/tsp)');
const subHtml = page('kitchen/ingredient-substitutions');
check((subHtml.match(/Not good for:/g) || []).length === 4, 'each swap says what it is not good for');

// 6. Cup fractions
const cf = (n) => T.cupFraction(n);
check(cf(0.66).measure === '⅔ cup' && cf(0.66).spoons === '10 tbsp + 2 tsp', '0.66 -> ⅔ cup, 10 tbsp + 2 tsp');
check(cf(0.33).measure === '⅓ cup' && cf(0.33).spoons === '5 tbsp + 1 tsp', '0.33 -> ⅓ cup, 5 tbsp + 1 tsp');
check(cf(1.5).measure === '1½ cups', '1.5 -> 1½ cups');
check(cf(0.125).measure === '⅛ cup' && cf(0.125).spoons === '2 tbsp', '0.125 -> ⅛ cup, 2 tbsp');
check(cf(0.25).measure === '¼ cup' && cf(0.5).measure === '½ cup' && cf(0.75).measure === '¾ cup', 'quarter, half, three-quarter');
check(cf(2 / 3).measure === '⅔ cup' && cf(2).measure === '2 cups', 'exact fractions and wholes');
for (let i = 1; i <= 400; i++) {
  const n = i / 100;
  const r = cf(n);
  check(Math.abs(r.tsp - n * 48) <= Math.max(0.0625, 0.02 * n * 48) + 1e-9, `${n} cups stays within rounding (${r.measure})`);
}

// 7. Pressure cooker
const P = T.PRESSURE;
const cb = P.find((r) => r.food === 'Chicken breasts (boneless)');
check(cb.min[0] === 6 && cb.min[1] === 8 && cb.src === 'manual', 'chicken breast 6–8 min per lb (Instant Pot manual)');
check(P.find((r) => /Hard-boiled/.test(r.food)).note.includes('5-5-5'), 'eggs show the 5-5-5 method');
check(P.every((r) => T.RELEASE[r.release] && T.CATS[r.cat]), 'every row has a release type and category');
const pHtml = page('kitchen/pressure-cooker-times');
const rows = (pHtml.match(/<tr data-cat=/g) || []).length;
check(rows === P.length, 'every food is a plain HTML table row');
check(/<table class="chart pressure-table">/.test(pHtml) && !/<tbody>\s*<\/tbody>/.test(pHtml), 'table is in the HTML, not built by script');
check(pHtml.includes(`${P.length} Foods`), 'title uses the real food count');
const chickenRows = P.filter((r) => /chicken/i.test(`${r.food} ${r.size}`));
check(chickenRows.length >= 3, 'search “chicken” has rows to find');
eq(T.pressureFor(P.indexOf(cb), 2).min, [12, 16], 'calculator: 2 lb chicken breasts 12–16 min');

// 8. Turkey (USDA timetable at 325 °F)
const t14 = T.turkey(14, false);
check(t14.hours[0] === 3 && t14.hours[1] === 3.75, '14 lb unstuffed: 3 to 3¾ hours (contains 3½)');
const t14s = T.turkey(14, true);
check(t14s.hours[0] === 3.5 && t14s.hours[1] === 4, '14 lb stuffed: 3½ to 4 hours (USDA, not 4h40)');
check(T.turkey(12, false).thawDays === 3 && T.turkey(20, false).thawDays === 5, 'thaw 1 day per 4 lb');
check(T.turkey(24, true).hours[1] === 5.25 && T.turkey(8, false).hours[0] === 2.75, 'chart ends');
check(T.turkey(7, false) === null && T.turkey(25, false) === null, 'outside 8–24 lb');
check(T.TURKEY_REST === 20, 'rest 20 minutes');
const tHtml = page('kitchen/turkey-cooking-time');
check(/Never thaw a turkey on the counter/.test(tHtml) && /never the night before/.test(tHtml), 'thaw and stuffing warnings');

// Every new page: in sitemap at 0.8, linked from the hub and homepage, says it's private, has the More block
const sm = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const hub = page('kitchen');
const home = readFileSync(join(ROOT, 'index.html'), 'utf8');
for (const t of KITCHEN_TOOLS_2) {
  const html = page(t.path.replace(/^\/|\/$/g, ''));
  check(new RegExp(`<loc>https://lazycattools.com${t.path}</loc>\\s*<changefreq>monthly</changefreq>\\s*<priority>0.8</priority>`).test(sm), `${t.path} in sitemap at 0.8`);
  check(hub.includes(`href="${t.path}"`) && home.includes(`href="${t.path}"`), `${t.path} on hub and homepage`);
  check(/runs in your browser/.test(html), `${t.path} says it runs in the browser`);
  ['/kitchen/cups-to-grams/', '/kitchen/recipe-scaler/', '/kitchen/recipe-converter/', '/kitchen/oven-temperature/', '/kitchen/pan-size-converter/']
    .forEach((p) => check(html.includes(`href="${p}"`), `${t.path} links to ${p}`));
  check(html.includes('kitchen-tools.js'), `${t.path} loads the tools script`);
}
// Older kitchen pages link to the new ones
const oven = page('kitchen/oven-temperature');
KITCHEN_TOOLS_2.forEach((t) => check(oven.includes(`href="${t.path}"`), `oven page links to ${t.path}`));
check(!/Math\.random/.test(readFileSync(join(ROOT, 'assets/js/kitchen-tools.js'), 'utf8')), 'no randomness needed or used');

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
