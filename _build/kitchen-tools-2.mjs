// Kitchen tools, part 2: air fryer, meat temperatures, coffee, rice,
// substitutions, cup fractions, pressure cooker times and turkey.
// Called from tool-pages.mjs with the same toolPage() as the first set.
// The math and every sourced number live in assets/js/kitchen-tools.js.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require('../assets/js/kitchen-tools.js');

export const JS_TOOLS2 = '/assets/js/kitchen-tools.js?v=1';

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

// Order here is the order on the kitchen hub and the homepage.
export const KITCHEN_TOOLS_2 = [
  { path: '/kitchen/air-fryer-converter/', name: 'Air Fryer Converter', blurb: 'Turn oven temperature and time into air fryer settings, and back.',
    icon: svg('<rect x="5" y="3" width="14" height="18" rx="3"/><line x1="5" y1="9" x2="19" y2="9"/><line x1="10" y1="14" x2="14" y2="14"/>') },
  { path: '/kitchen/meat-temperature/', name: 'Meat Temperature & Cooking Time', blurb: 'Safe USDA temperatures, rest times and roasting estimates.',
    icon: svg('<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>') },
  { path: '/kitchen/coffee-ratio/', name: 'Coffee Ratio Calculator', blurb: 'Grams of coffee and water for drip, French press, cold brew or espresso.',
    icon: svg('<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>') },
  { path: '/kitchen/rice-to-water-ratio/', name: 'Rice to Water Ratio', blurb: 'Water and cooking time for six kinds of rice, stovetop or Instant Pot.',
    icon: svg('<path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M8 7c0-1 1-2 2-2M12 7c0-1.5 1-2.5 2-3"/>') },
  { path: '/kitchen/ingredient-substitutions/', name: 'Ingredient Substitutions', blurb: 'Out of eggs, honey, chocolate or the right salt? Swap with the right amount.',
    icon: svg('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>') },
  { path: '/kitchen/cup-fraction-calculator/', name: 'Cup Fraction Calculator', blurb: 'Turn 0.66 cups into ⅔ cup, or the spoons that add up to it.',
    icon: svg('<path d="M5 8h14l-1.5 11a2 2 0 0 1-2 1.7h-7a2 2 0 0 1-2-1.7Z"/><line x1="7" y1="13" x2="17" y2="13"/>') },
  { path: '/kitchen/pressure-cooker-times/', name: 'Instant Pot Cooking Times', blurb: 'Searchable pressure cooker times and release types.',
    icon: svg('<path d="M4 10h16v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z"/><path d="M2 10h20"/><path d="M9 6h6l1 4H8Z"/>') },
  { path: '/kitchen/turkey-cooking-time/', name: 'Turkey Cooking Time Calculator', blurb: 'Roasting time, temperature, rest and thawing days by weight.',
    icon: svg('<circle cx="12" cy="13" r="7"/><path d="M12 6V3M8.5 7 7 4.5M15.5 7 17 4.5"/>') },
];

export function buildKitchenTools2(h) {
  const { toolPage, field, select, esc, JS_KITCHEN } = h;
  const scripts = `<script src="${JS_KITCHEN}" defer></script>\n    <script src="${JS_TOOLS2}" defer></script>`;
  const seg = (name, label, opts, sel) => `<div class="conv-field"><span class="label" id="${name}-l">${label}</span><div class="seg" role="group" aria-labelledby="${name}-l" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-value="${v}" aria-pressed="${v === sel}">${l}</button>`).join('')}</div></div>`;
  const input = (id, name, val, mode = 'decimal', extra = '') => `<input id="${id}" name="${name}" type="text" inputmode="${mode}" autocomplete="off" value="${val}"${extra}>`;
  const result = `<p class="conv-error" data-result-error hidden></p>
      <div class="conv-result" aria-live="polite">
        <div class="conv-result-main" data-result-main>—</div>
        <dl class="result-rows" data-result-rows></dl>
        <p class="conv-note" data-result-note hidden></p>
      </div>`;
  const PRIVATE = 'It all runs in your browser. Nothing you type is sent anywhere or saved.';
  const table = (caption, head, rows) => `<div class="chart-wrap"><table class="chart">
        <caption>${caption}</caption>
        <thead><tr>${head.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map((r) => `<tr><th scope="row">${r[0]}</th>${r.slice(1).map((c, i) => `<td${i === 0 ? ' class="num-main"' : ''}>${c}</td>`).join('')}</tr>`).join('\n          ')}
        </tbody>
      </table></div>`;

  // ── 1. Air fryer ──────────────────────────────────────────────────────────
  const afRows = [350, 375, 400, 425, 450].map((f) => {
    const c = Math.round((f - 32) * 5 / 9 / 5) * 5;
    return [`${f} °F (${c} °C)`, `${f - 25} °F (${c - 15} °C)`, '20 min in the oven → about 16 min'];
  });
  toolPage({
    path: '/kitchen/air-fryer-converter/',
    name: 'Air Fryer Converter',
    metaTitle: 'Air Fryer Converter: Oven to Air Fryer Temp & Time | Lazy Cat Tools',
    description: 'Free air fryer converter. Enter your oven temperature and time and get air fryer settings: 25 °F lower and about 20% less time. No sign-up, nothing uploaded.',
    answer: 'Set the air fryer <strong>25 °F (about 15 °C) lower</strong> and cook for <strong>about 20% less time</strong>. 400 °F for 20 minutes in the oven becomes 375 °F for about 16 minutes in the air fryer.',
    appDesc: 'Convert oven temperatures and cooking times to air fryer settings, and air fryer settings back to the oven.',
    tool: `<form class="converter" data-air-fryer aria-label="Air fryer converter">
      ${seg('dir', 'Convert', [['to-air', 'Oven → air fryer'], ['to-oven', 'Air fryer → oven']], 'to-air')}
      <div class="conv-row conv-row-3">
        ${field('af-temp', 'Temperature', input('af-temp', 'temp', '400'))}
        ${seg('unit', 'Unit', [['f', '°F'], ['c', '°C']], 'f')}
        ${field('af-time', 'Time (minutes)', input('af-time', 'time', '20', 'numeric'))}
      </div>
      ${result}
    </form>`,
    scripts,
    sections: `<section class="k-section" aria-labelledby="chart-h">
      <h2 id="chart-h">Oven to air fryer chart</h2>
      ${table('Air fryer temperature for common oven settings', ['Oven', 'Air fryer', 'Time'], afRows)}
      <p class="source">Air fryers vary. Check the food a few minutes early the first time, and shake the basket halfway through.</p>
    </section>

    <section class="k-section prose" aria-labelledby="how-h">
      <h2 id="how-h">How it works</h2>
      <p>An air fryer is a small convection oven: a fan blows hot air around food in a small space, so it browns and cooks faster than a regular oven. The usual rule is to set it <strong>25 °F lower</strong> (about 15 °C) and cut the time by <strong>about 20%</strong>. The converter rounds the time to the nearest whole minute and never goes below 1 minute.</p>
      <p>Going the other way, from an air fryer recipe to the oven, it adds 25 °F back and adds about 25% to the time, which undoes the 20% cut. ${PRIVATE}</p>
      <h3>Ways to use it</h3>
      <ul>
        <li><strong>Baked recipes.</strong> Cookies, muffins and small bakes, in batches that fit the basket.</li>
        <li><strong>Frozen foods.</strong> Fries, nuggets and pizza rolls: take the oven time on the bag and convert it.</li>
        <li><strong>Leftovers.</strong> Reheating pizza or fried chicken gets it crisp instead of soggy.</li>
        <li><strong>Roasted vegetables.</strong> Spread them in one layer so the air can get around them.</li>
        <li><strong>Chicken and fries.</strong> Check chicken with a thermometer (165 °F) rather than trusting the time.</li>
      </ul>
    </section>`,
    faqs: [
      { q: 'Why is the air fryer temperature lower?', a: 'The fan moves hot air right across the food in a small space, so the outside browns faster than in a regular oven. Lowering the temperature by 25 °F gives the middle time to cook before the outside burns.' },
      { q: 'How much shorter is the time?', a: 'About 20% shorter. A 20-minute oven recipe takes about 16 minutes, and a 30-minute one about 24. Start checking a few minutes before that the first time, because air fryers vary.' },
      { q: 'Do I still preheat?', a: 'Most air fryers heat up in 2 to 3 minutes. Preheat if your manual says to, or add a couple of minutes to the time if you start cold.' },
      { q: 'What if my air fryer only shows Celsius?', a: 'Switch the converter to °C. It takes off 15 °C, so a 200 °C oven recipe becomes 185 °C in the air fryer.' },
      { q: 'Is anything saved?', a: 'No. The converter runs in your browser, and nothing you type is sent anywhere or saved.' },
    ],
  });

  // ── 2. Meat temperature ───────────────────────────────────────────────────
  const meatRows = [
    ['Beef, pork, lamb, veal: steaks, roasts, chops', '145 °F (63 °C)', '3 minutes'],
    ['Ground beef, pork, lamb, veal; sausage', '160 °F (71 °C)', 'None'],
    ['Poultry: whole, pieces and ground (chicken, turkey, duck)', '165 °F (74 °C)', 'None'],
    ['Ham, fresh (raw)', '145 °F (63 °C)', '3 minutes'],
    ['Ham, fully cooked, to reheat', '140 °F (60 °C) if packaged in a USDA-inspected plant; otherwise 165 °F (74 °C)', 'None'],
    ['Fish', '145 °F (63 °C), or until the flesh is opaque and flakes easily', 'None'],
  ];
  const timeRows = [
    ['Beef roast', '20 to 25 min per lb', 'Medium-rare to medium'],
    ['Pork roast', '20 to 25 min per lb', ''],
    ['Whole chicken', 'About 20 min per lb', ''],
    ['Whole turkey', 'USDA chart by weight (12 lb: 2¾ to 3 hours)', `See the <a href="/kitchen/turkey-cooking-time/">turkey calculator</a>`],
    ['Ham, bone-in, fully cooked (reheat)', '15 to 18 min per lb', ''],
  ];
  toolPage({
    path: '/kitchen/meat-temperature/',
    name: 'Meat Temperature & Cooking Time Calculator',
    metaTitle: 'Meat Temperature Chart & Cooking Time Calculator | Lazy Cat Tools',
    description: 'Free meat temperature chart and cooking time calculator. Safe USDA internal temperatures, rest times, and minutes per pound for roasts. No sign-up.',
    answer: 'Cook <strong>steaks, roasts and chops to 145 °F</strong> and rest 3 minutes, <strong>ground meat to 160 °F</strong>, and <strong>all poultry to 165 °F</strong>. Always check with a thermometer; times are only estimates.',
    appDesc: 'Look up safe internal temperatures and rest times for meat, poultry and fish, with roasting time estimates by weight.',
    tool: `<form class="converter" data-meat aria-label="Meat temperature and cooking time">
      <div class="conv-row">
        ${field('meat', 'What are you cooking?', select('meat', 'meat', T.MEATS.map((m) => [m.id, m.label]), 'chicken-whole'))}
      </div>
      <div class="conv-row" data-weight-field>
        ${field('meat-w', 'Weight', input('meat-w', 'weight', '4'))}
        ${seg('wunit', 'Unit', [['lb', 'lb'], ['kg', 'kg']], 'lb')}
      </div>
      ${result}
    </form>`,
    scripts,
    sections: `<section class="k-section" aria-labelledby="chart-h">
      <h2 id="chart-h">Safe minimum internal temperatures</h2>
      ${table('From the USDA chart on FoodSafety.gov', ['Food', 'Internal temperature', 'Rest time'], meatRows)}
      <p class="source">Source: <a href="https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures" rel="noopener">FoodSafety.gov safe minimum internal temperature chart</a> (USDA). Always use a food thermometer.</p>
    </section>

    <section class="k-section" aria-labelledby="time-h">
      <h2 id="time-h">Roasting time estimates at 325 °F</h2>
      ${table('Approximate minutes per pound in a 325 °F oven', ['Roast', 'Time', 'Note'], timeRows)}
      <p class="source">Estimates only. Ovens, pans and the starting temperature of the meat all change the time, so start checking early and go by the thermometer, not the clock.</p>
    </section>

    <section class="k-section prose" aria-labelledby="how-h">
      <h2 id="how-h">How it works</h2>
      <p>Pick what you're cooking and the calculator shows the safe internal temperature and rest time from the USDA chart. For roasts, enter the weight and it multiplies by the minutes per pound in the table above to give a time range at 325 °F. Steaks, chops, burgers and fish depend on thickness rather than weight, so for those it only gives the temperature. ${PRIVATE}</p>
      <h3>Where to put the thermometer</h3>
      <p>In the thickest part of the meat, not touching bone, fat or the pan. For a whole bird, that's the innermost part of the thigh. Check a large roast in a couple of places.</p>
      <h3>Ways to use it</h3>
      <ul>
        <li><strong>Roasting a chicken.</strong> 165 °F in the thigh, about 20 minutes per pound.</li>
        <li><strong>Checking a steak.</strong> 145 °F, then rest 3 minutes.</li>
        <li><strong>A pork roast.</strong> 145 °F is safe, and still a little pink in the middle.</li>
        <li><strong>Reheating ham.</strong> 140 °F for a store-bought cooked ham.</li>
        <li><strong>Grilling burgers.</strong> Ground meat needs 160 °F, more than a steak.</li>
      </ul>
    </section>`,
    faqs: [
      { q: 'Why does steak rest but ground beef doesn’t need to?', a: 'On a whole steak or roast, germs are on the surface, and the 3-minute rest lets the heat keep working through the meat. Grinding mixes the surface into the middle, so ground meat has to reach a higher temperature, 160 °F, all the way through instead.' },
      { q: 'Is 145 °F safe for pork?', a: 'Yes. The USDA lowered the safe temperature for whole cuts of pork to 145 °F with a 3-minute rest. It may still look slightly pink, and that’s fine. Ground pork needs 160 °F.' },
      { q: 'Why is chicken 165 °F?', a: 'Poultry can carry salmonella throughout the meat, not just on the surface. At 165 °F those bacteria are killed almost instantly, so no rest time is needed for safety.' },
      { q: 'Can I trust the time alone?', a: 'No. Oven temperatures, pan sizes and how cold the meat was when it went in all change the time. Use the estimate to plan, and a thermometer to decide when it’s done.' },
      { q: 'Where do I put the thermometer?', a: 'In the thickest part, not touching bone, which conducts heat and reads high. For whole poultry, check the innermost part of the thigh and the thickest part of the breast.' },
    ],
  });

  // ── 3. Coffee ─────────────────────────────────────────────────────────────
  const coffeeRows = T.BREWS.map((b) => [b.label, `1:${b.ratio}`, b.id === 'espresso' ? '18 g coffee → 36 g espresso' : b.id === 'cold' ? `${Math.round(240 / b.ratio)} g per 240 ml, then dilute 1:1` : `${Math.round(240 / b.ratio)} g per 240 ml cup`]);
  toolPage({
    path: '/kitchen/coffee-ratio/',
    name: 'Coffee Ratio Calculator',
    metaTitle: 'Coffee Ratio Calculator: How Much Coffee Per Cup | Lazy Cat Tools',
    description: 'Free coffee ratio calculator. Pick a brew method and number of cups and get grams of coffee and water, with tablespoons if you don’t have a scale. No sign-up.',
    answer: 'For drip or pour over, use <strong>1 g of coffee for every 16 g of water</strong>: 15 g (about 3 level tablespoons) for a 240 ml cup. French press is stronger at 1:14.',
    appDesc: 'Work out grams of ground coffee and water for drip, pour over, French press, cold brew and espresso.',
    tool: `<form class="converter" data-coffee aria-label="Coffee ratio calculator">
      <div class="conv-row">
        ${field('brew', 'Brew method', select('brew', 'brew', T.BREWS.map((b) => [b.id, b.label]), 'pour'))}
      </div>
      <div class="conv-row">
        <div class="conv-field"><label for="cof-n" data-cups-label>Cups</label>${input('cof-n', 'count', '2', 'numeric')}</div>
        <div class="conv-field" data-size-field><label for="cof-size">Cup size (ml)</label>${input('cof-size', 'size', '240', 'numeric')}</div>
      </div>
      ${result}
    </form>`,
    scripts,
    sections: `<section class="k-section" aria-labelledby="chart-h">
      <h2 id="chart-h">Coffee ratios by brew method</h2>
      ${table('Coffee to water by weight', ['Method', 'Ratio', 'Per cup'], coffeeRows)}
      <p class="source">1 ml of water weighs 1 g, so the water in grams and in milliliters is the same number. Tablespoon amounts assume about 5 g per level tablespoon of ground coffee, and are approximate.</p>
    </section>

    <section class="k-section prose" aria-labelledby="how-h">
      <h2 id="how-h">How it works</h2>
      <p>A ratio like 1:16 means 1 gram of coffee for every 16 grams of water. The calculator multiplies your cups by the cup size to get the water, then divides by the ratio to get the coffee. For espresso it works per shot instead: an 18 g dose pulled to about 36 g of espresso. ${PRIVATE}</p>
      <p>Start with the ratio in the table, then adjust to taste: less water (1:15) for stronger coffee, more (1:17) for lighter. Change one thing at a time.</p>
      <h3>Ways to use it</h3>
      <ul>
        <li><strong>Morning pour over.</strong> Weigh 15 to 30 g and you’re done thinking about it.</li>
        <li><strong>French press for guests.</strong> Scale up to a full pot without guessing scoops.</li>
        <li><strong>Cold brew concentrate.</strong> A big batch at 1:8, diluted when you pour it.</li>
        <li><strong>A new bag of beans.</strong> Start from the standard ratio and adjust from there.</li>
      </ul>
    </section>`,
    faqs: [
      { q: 'What ratio should I start with?', a: '1:16 for drip and pour over, 1:14 for French press, 1:8 for cold brew concentrate and 1:2 for espresso. Then adjust a little at a time to taste.' },
      { q: 'Why grams instead of scoops?', a: 'A scoop of coarse coffee and a scoop of fine coffee weigh different amounts, and scoops come in different sizes. Grams are the same every time, so the coffee tastes the same every time.' },
      { q: 'How strong is cold brew concentrate?', a: 'At 1:8 it’s about twice as strong as regular coffee. Mix it 1:1 with water or milk when you serve it, or a bit less if you like it strong.' },
      { q: 'Can I use tablespoons?', a: 'Yes, roughly. A level tablespoon of ground coffee is about 5 g, so the calculator shows a tablespoon amount too. It varies with the grind, so a scale is better if you have one.' },
      { q: 'Is anything saved?', a: 'No. The calculator runs in your browser and nothing is saved or sent anywhere.' },
    ],
  });

  // ── 4. Rice ───────────────────────────────────────────────────────────────
  const riceRows = T.RICE.map((r) => [r.label, `1 : ${r.water}`, r.time, r.rinse ? 'Rinse first' : '']);
  toolPage({
    path: '/kitchen/rice-to-water-ratio/',
    name: 'Rice to Water Ratio Calculator',
    metaTitle: 'Rice to Water Ratio Calculator: Water Per Cup of Rice | Lazy Cat Tools',
    description: 'Free rice to water ratio calculator. Pick your rice and cooker and get the water and cooking time for white, jasmine, basmati, brown, wild or sushi rice. No sign-up.',
    answer: 'On the stovetop, use <strong>1½ cups of water for 1 cup of white rice</strong> and simmer 15 to 18 minutes. <strong>Brown rice takes 2½ cups</strong> and 40 to 45 minutes. In an Instant Pot, use 1 cup of water per cup of rice.',
    appDesc: 'Work out how much water to use for white, jasmine, basmati, brown, wild and sushi rice on the stovetop, in a rice cooker or in an Instant Pot.',
    tool: `<form class="converter" data-rice aria-label="Rice to water ratio calculator">
      <div class="conv-row">
        ${field('rice', 'Rice', select('rice', 'rice', T.RICE.map((r) => [r.id, r.label]), 'white'))}
        ${field('rice-amt', 'Dry rice (cups)', input('rice-amt', 'amount', '1'))}
      </div>
      ${seg('cooker', 'Cooking in', [['stove', 'Stovetop'], ['cooker', 'Rice cooker'], ['ip', 'Instant Pot']], 'stove')}
      ${result}
    </form>`,
    scripts,
    sections: `<section class="k-section" aria-labelledby="chart-h">
      <h2 id="chart-h">Rice to water ratios</h2>
      ${table('Stovetop, by volume: cups of water for 1 cup of dry rice', ['Rice', 'Rice : water', 'Simmer', 'Rinse'], riceRows)}
      <p class="source">Instant Pot: 1 cup of water per cup of white or brown rice, from the Instant Pot manual’s grain-to-water table. White rice cooks 4 minutes and brown rice 22 minutes at high pressure, then 10 minutes natural release.</p>
    </section>

    <section class="k-section prose" aria-labelledby="how-h">
      <h2 id="how-h">How it works</h2>
      <p>The calculator multiplies your dry rice by the ratio for that rice and cooker. On the stovetop: bring the water to a boil, add the rice, cover, and simmer on low for the time shown. Then take it off the heat and <strong>let it rest 10 minutes with the lid on before you fluff it</strong>. ${PRIVATE}</p>
      <p>A rice cooker uses about the same ratio as the stovetop. Measure with a regular US cup, not the small cup that comes with the cooker, which holds 180 ml. An Instant Pot uses less water because almost nothing boils off with the lid locked.</p>
      <h3>Ways to use it</h3>
      <ul>
        <li><strong>Weeknight white rice.</strong> 1 cup dry makes about 3 cups cooked.</li>
        <li><strong>Brown rice meal prep.</strong> Cook a big pot, cool it fast, and refrigerate.</li>
        <li><strong>Sushi rice.</strong> Rinse well and use less water so it stays sticky but firm.</li>
        <li><strong>Rice cooker vs stovetop.</strong> Same ratio, different measuring cup.</li>
      </ul>
    </section>`,
    faqs: [
      { q: 'Should I rinse the rice?', a: 'For jasmine, basmati and sushi rice, yes: rinse in cold water until it runs mostly clear. It washes off loose starch, so the grains don’t clump. Plain long-grain white rice is fine either way.' },
      { q: 'Why does brown rice take longer?', a: 'Brown rice still has its bran layer, which water has to soak through. It needs more water and about 40 to 45 minutes, against 15 to 18 for white rice.' },
      { q: 'Can I use the same ratio in a rice cooker?', a: 'Yes, measured with a regular US cup. Or measure with the cooker’s own cup and fill to the matching line in the bowl. Just don’t mix the two cups.' },
      { q: 'What if I lift the lid?', a: 'Try not to. Lifting the lid lets the steam out, and the steam is doing the cooking. Wait until the time is up, then let it rest covered for 10 minutes.' },
      { q: 'Is anything saved?', a: 'No. The calculator runs in your browser and nothing is saved or sent anywhere.' },
    ],
  });

  // ── 5. Substitutions ──────────────────────────────────────────────────────
  const subForm = (kind, label, defVal, extra, unitHint) => `<form class="converter sub-form" data-sub="${kind}" aria-label="${label}">
        ${extra || ''}
        <div class="conv-row">
          ${field(`${kind}-amt`, unitHint, input(`${kind}-amt`, 'amount', defVal))}
        </div>
        ${result}
      </form>`;
  const saltOpts = T.SALTS.map((s) => [s.id, s.label]);
  const saltRows = [1, 2, 3].map((n) => [`${n} tsp table salt`, T.salt(n, 'table', 'morton').tsp, T.salt(n, 'table', 'diamond').tsp, `${n * 6} g`])
    .map(([a, m, d, g]) => [a, `${h.K.toFraction(m).text} tsp`, `${h.K.toFraction(d).text} tsp`, g]);
  toolPage({
    path: '/kitchen/ingredient-substitutions/',
    name: 'Ingredient Substitutions',
    metaTitle: 'Ingredient Substitutions: Egg, Honey, Cocoa & Salt Swaps | Lazy Cat Tools',
    description: 'Free ingredient substitution calculator. Swap eggs, honey and sugar, cocoa for chocolate, and table salt for kosher salt, with the right amounts. No sign-up.',
    answer: '<strong>1 egg = ¼ cup applesauce</strong> or 1 tbsp ground flax + 3 tbsp water. <strong>¾ cup honey replaces 1 cup sugar.</strong> 3 tbsp cocoa + 1 tbsp butter replaces 1 oz unsweetened chocolate. 1 tsp table salt = 1¼ tsp Morton kosher = about 2¼ tsp Diamond Crystal.',
    appDesc: 'Work out substitute amounts for eggs, honey and sugar, cocoa for unsweetened chocolate, and table salt for kosher salt.',
    tool: `<div class="sub-glance">
      ${table('The four swaps at a glance', ['Out of', 'Use', 'Watch out for'], [
        ['1 egg', '¼ cup applesauce, ¼ cup mashed banana, or 1 tbsp ground flax + 3 tbsp water', 'Not for meringues or custards'],
        ['1 cup sugar', '¾ cup honey, and cut other liquid by 3 tbsp', 'Add a little baking soda; bake 25 °F lower'],
        ['1 oz unsweetened chocolate', '3 tbsp natural cocoa + 1 tbsp butter or oil', 'Natural and Dutch cocoa aren’t interchangeable'],
        ['1 tsp table salt', '1¼ tsp Morton kosher, or about 2¼ tsp Diamond Crystal', 'Volume is approximate; weigh when it matters'],
      ])}
    </div>`,
    scripts,
    sections: `<section class="k-section sub-section" aria-labelledby="egg-h">
      <h2 id="egg-h">Egg substitutes</h2>
      <p>One egg = ¼ cup unsweetened applesauce, ¼ cup mashed ripe banana, or 1 tablespoon ground flaxseed stirred into 3 tablespoons water and left 5 minutes to thicken.</p>
      ${subForm('egg', 'Egg substitute calculator', '2', '', 'Eggs to replace')}
      <p class="sub-fit"><strong>Best for:</strong> muffins, pancakes, quick breads and brownies. <strong>Not good for:</strong> meringues, custards, soufflés or anything where eggs are the main ingredient.</p>
    </section>

    <section class="k-section sub-section" aria-labelledby="honey-h">
      <h2 id="honey-h">Honey for sugar (and back)</h2>
      <p>Use ¾ cup honey for each cup of sugar. Honey is about 17% water, so for each cup of honey you use, cut the other liquid by ¼ cup, add ½ teaspoon baking soda to balance its acidity, and bake 25 °F lower so it doesn’t brown too fast. Those adjustments follow the National Honey Board’s baking tips.</p>
      ${subForm('honey', 'Honey and sugar calculator', '1', seg('dir', 'Direction', [['sugar-to-honey', 'Sugar → honey'], ['honey-to-sugar', 'Honey → sugar']], 'sugar-to-honey'), 'Amount (cups)')}
      <p class="sub-fit"><strong>Best for:</strong> quick breads, muffins, granola and cakes that should stay moist. <strong>Not good for:</strong> crisp cookies, or recipes that cream butter and sugar for lift.</p>
    </section>

    <section class="k-section sub-section" aria-labelledby="cocoa-h">
      <h2 id="cocoa-h">Cocoa powder for unsweetened chocolate</h2>
      <p>For each ounce of unsweetened baking chocolate, use 3 tablespoons natural cocoa powder plus 1 tablespoon melted butter or oil. Natural and Dutch-process cocoa aren’t interchangeable in recipes that rely on baking soda, because only natural cocoa is acidic enough to react with it.</p>
      ${subForm('cocoa', 'Cocoa for chocolate calculator', '1', '', 'Unsweetened chocolate (oz)')}
      <p class="sub-fit"><strong>Best for:</strong> brownies, cakes and frostings. <strong>Not good for:</strong> dipping, ganache or anything where the chocolate needs to set firm.</p>
    </section>

    <section class="k-section sub-section" aria-labelledby="salt-h">
      <h2 id="salt-h">Table salt and kosher salt</h2>
      <p>A teaspoon of table salt weighs about 6 g. Kosher salt crystals are bigger and hollower, so a teaspoon holds less: Morton kosher about 4.8 g, Diamond Crystal about 2.7 g. That’s why 1 tsp table salt equals 1¼ tsp Morton kosher but about 2¼ tsp Diamond Crystal.</p>
      ${subForm('salt', 'Salt converter', '1', `<div class="conv-row">${field('salt-from', 'From', select('salt-from', 'from', saltOpts, 'table'))}${field('salt-to', 'To', select('salt-to', 'to', saltOpts, 'diamond'))}</div>`, 'Amount (teaspoons)')}
      ${table('Salt by volume, same saltiness', ['Table salt', 'Morton kosher', 'Diamond Crystal', 'Weight'], saltRows)}
      <p class="sub-fit"><strong>Best for:</strong> cooking, seasoning and most baking. <strong>Not good for:</strong> bread dough, brines and cures, where a small error matters; weigh the salt in grams for those.</p>
      <p class="source">Weights from <a href="https://www.mortonsalt.com/salt-conversion-chart/" rel="noopener">Morton’s conversion chart</a> (1 tsp table = 1¼ tsp kosher) and <a href="https://www.kingarthurbaking.com/learn/ingredient-weight-chart" rel="noopener">King Arthur’s ingredient weight chart</a> (table salt 18 g and Diamond Crystal 8 g per tablespoon). Volume is approximate because crystal size varies; weigh salt in grams when it matters.</p>
    </section>

    <section class="k-section prose" aria-labelledby="how-h">
      <h2 id="how-h">How it works</h2>
      <p>Each calculator multiplies your amount by the swap above and rounds to amounts you can measure. ${PRIVATE}</p>
      <h3>Ways to use it</h3>
      <ul>
        <li><strong>Out of eggs.</strong> Applesauce or flax gets muffins and pancakes done.</li>
        <li><strong>Honey and sugar.</strong> Swap honey in for sugar, or sugar in when a recipe calls for honey and you’re out.</li>
        <li><strong>A recipe calls for unsweetened chocolate.</strong> Cocoa and butter from the pantry do the job.</li>
        <li><strong>A different salt.</strong> Converting a recipe written for Diamond Crystal to table salt, or the other way.</li>
      </ul>
    </section>`,
    faqs: [
      { q: 'Can I replace eggs in any recipe?', a: 'No. Swaps work when eggs are there for moisture and binding, as in muffins, pancakes and quick breads. They don’t work when eggs are the structure, as in meringues, custards, soufflés and angel food cake.' },
      { q: 'Does honey make things sweeter than sugar?', a: 'Yes, cup for cup honey is sweeter, which is why ¾ cup replaces a full cup of sugar. It also browns faster and keeps baked goods moister.' },
      { q: 'Can I swap natural and Dutch cocoa?', a: 'Not in recipes that use baking soda. Natural cocoa is acidic and reacts with baking soda to make the cake rise; Dutch-process cocoa has been treated to remove that acidity. Recipes with baking powder are more forgiving.' },
      { q: 'Why does kosher salt measure differently?', a: 'The crystals are bigger and pack loosely, so a spoonful holds less salt. Diamond Crystal is especially light: you need about 2¼ teaspoons to match 1 teaspoon of table salt. Morton kosher is denser, at 1¼ teaspoons.' },
      { q: 'Is anything saved?', a: 'No. The calculators run in your browser and nothing is saved or sent anywhere.' },
    ],
  });

  // ── 6. Cup fractions ──────────────────────────────────────────────────────
  const fracRows = [[1 / 8, '⅛ cup'], [1 / 4, '¼ cup'], [1 / 3, '⅓ cup'], [1 / 2, '½ cup'], [2 / 3, '⅔ cup'], [3 / 4, '¾ cup'], [1, '1 cup']]
    .map(([c, l]) => [l, h.K.spoonsText(c * 48), (+c.toFixed(3)).toString(), h.K.formatMl(c * 48)]);
  toolPage({
    path: '/kitchen/cup-fraction-calculator/',
    name: 'Cup Fraction Calculator',
    metaTitle: 'Cup Fraction Calculator: Decimal Cups to Measuring Cups | Lazy Cat Tools',
    description: 'Free cup fraction calculator. Turn a decimal like 0.66 cups into ⅔ cup, or the tablespoons and teaspoons that add up to it. No sign-up.',
    answer: '<strong>0.66 cups is ⅔ cup</strong>, or 10 tablespoons + 2 teaspoons. 0.33 cups is ⅓ cup (5 tbsp + 1 tsp), and 0.75 is ¾ cup (12 tbsp).',
    appDesc: 'Convert a decimal or fraction of a cup into measuring cups, tablespoons and teaspoons.',
    tool: `<form class="converter" data-cup-fraction aria-label="Cup fraction calculator">
      <div class="conv-row">
        ${field('cf-amt', 'Amount in cups <span class="hint">decimal or fraction</span>', input('cf-amt', 'amount', '0.66'))}
      </div>
      ${result}
    </form>`,
    scripts,
    sections: `<section class="k-section" aria-labelledby="chart-h">
      <h2 id="chart-h">Cup fractions in spoons</h2>
      ${table('1 cup = 16 tablespoons = 48 teaspoons', ['Cup', 'Spoons', 'Decimal', 'Milliliters'], fracRows)}
      <p class="source">For baking, weighing in grams is more accurate. The <a href="/kitchen/cups-to-grams/">cups to grams converter</a> does the weights.</p>
    </section>

    <section class="k-section prose" aria-labelledby="how-h">
      <h2 id="how-h">How it works</h2>
      <p>Type an amount like 0.66, 2/3 or 1 1/2. If it’s within 2% of a real measuring-cup size, it snaps to that size, so 0.33 becomes ⅓ cup and 0.66 becomes ⅔ cup. Otherwise it uses the biggest measuring cup that fits and makes up the rest with tablespoons and teaspoons, rounded to the nearest ⅛ teaspoon. It also shows the same amount in spoons only, for small amounts or a missing cup. ${PRIVATE}</p>
      <h3>Ways to use it</h3>
      <ul>
        <li><strong>A scaled recipe.</strong> The scaler says 0.66 cups; this says ⅔ cup.</li>
        <li><strong>Halving a recipe.</strong> Half of ¾ cup is ⅜ cup, or ¼ cup + 2 tbsp.</li>
        <li><strong>Metric recipes.</strong> Convert milliliters to cups first, then here.</li>
        <li><strong>Spoon amounts.</strong> When the right measuring cup is in the dishwasher.</li>
      </ul>
    </section>`,
    faqs: [
      { q: 'Why not just use decimals?', a: 'Measuring cups are marked in fractions, not decimals. 0.66 cups is a number on a screen; ⅔ cup is a cup in your drawer.' },
      { q: 'How accurate is the rounding?', a: 'Amounts within 2% of a standard cup size snap to it. Anything else is measured out to the nearest ⅛ teaspoon, which is closer than most measuring cups are filled.' },
      { q: 'What is ⅔ cup in tablespoons?', a: '⅔ cup is 10 tablespoons plus 2 teaspoons. ⅓ cup is 5 tablespoons plus 1 teaspoon.' },
      { q: 'Should I weigh instead?', a: 'For baking, yes. A cup of flour can weigh anywhere from 120 to 150 g depending on how it’s scooped. Weighing in grams takes that out of the equation.' },
      { q: 'Is anything saved?', a: 'No. The calculator runs in your browser and nothing is saved or sent anywhere.' },
    ],
  });

  // ── 7. Pressure cooker ────────────────────────────────────────────────────
  const P = T.PRESSURE;
  const perLbOpts = P.map((r, i) => [r, i]).filter(([r]) => r.perLb).map(([r, i]) => [String(i), r.food]);
  const catOrder = ['poultry', 'meat', 'seafood', 'beans', 'grains', 'veg', 'other'];
  const pRows = catOrder.flatMap((c) => P.filter((r) => r.cat === c)).map((r) => `<tr data-cat="${r.cat}"><th scope="row">${esc(r.food)}${r.src === 'common' ? ' <span class="src-mark" title="Common recipe time, not from the Instant Pot manual">†</span>' : ''}</th><td>${esc(r.size)}</td><td class="num-main">${esc(T.minText(r))}</td><td>${T.RELEASE[r.release]}</td><td>${esc(T.CATS[r.cat])}</td></tr>${r.note ? `\n          <tr class="row-note" data-cat="${r.cat}"><td colspan="5">${esc(r.note)}</td></tr>` : ''}`).join('\n          ');
  const nFoods = P.length;
  toolPage({
    path: '/kitchen/pressure-cooker-times/',
    name: 'Instant Pot / Pressure Cooker Times',
    metaTitle: `Instant Pot Cooking Times: Pressure Cooker Chart for ${nFoods} Foods | Lazy Cat Tools`,
    description: `Free Instant Pot cooking times. Search pressure cooker times and release types for ${nFoods} foods, from chicken and beans to rice and potatoes. No sign-up.`,
    answer: '<strong>Chicken breasts: 6 to 8 minutes per pound</strong>, natural release 10 minutes. <strong>Hard-boiled eggs: 5 minutes</strong>, 5 minutes natural release, 5 minutes in ice water. Times are at high pressure and don’t include the time to come to pressure.',
    appDesc: 'Search pressure cooker and Instant Pot cooking times and release types, with a per-pound calculator for meat.',
    tool: `<form class="converter" data-pressure aria-label="Pressure cooker time by weight">
      <div class="conv-row">
        ${field('p-food', 'Meat or poultry', select('p-food', 'food', perLbOpts, perLbOpts[0][0]))}
      </div>
      <div class="conv-row">
        ${field('p-w', 'Weight', input('p-w', 'weight', '2'))}
        ${seg('wunit', 'Unit', [['lb', 'lb'], ['kg', 'kg']], 'lb')}
      </div>
      ${result}
    </form>`,
    scripts,
    sections: `<section class="k-section" aria-labelledby="chart-h" data-pressure-table>
      <h2 id="chart-h">Pressure cooking times</h2>
      <div class="table-controls" data-controls hidden>
        <div class="conv-field"><label for="p-search">Search</label><input id="p-search" type="search" placeholder="chicken, beans, potatoes…" autocomplete="off" data-search></div>
        <div class="conv-field"><label for="p-cat">Category</label><select id="p-cat" data-cat><option value="">All</option>${catOrder.map((c) => `<option value="${c}">${esc(T.CATS[c])}</option>`).join('')}</select></div>
        <p class="table-count" data-count aria-live="polite"></p>
      </div>
      <div class="chart-wrap"><table class="chart pressure-table">
        <caption>High pressure. Natural 10 min means let the pressure drop on its own for 10 minutes, then quick release the rest.</caption>
        <thead><tr><th scope="col">Food</th><th scope="col">Cut / size</th><th scope="col">Time at pressure</th><th scope="col">Release</th><th scope="col">Category</th></tr></thead>
        <tbody>
          ${pRows}
        </tbody>
      </table></div>
      <p class="table-empty" data-empty hidden>Nothing matches. Try one word, like “beans”.</p>
      <p class="source">Times marked without † are from the pressure cooking timetable in the Instant Pot Duo Evo Plus user manual, at high pressure. † marks common recipe times that aren’t in that manual; treat them as starting points. Release types follow the usual practice: quick for vegetables and seafood, natural for meat, beans and grains.</p>
    </section>

    <section class="k-section prose" aria-labelledby="how-h">
      <h2 id="how-h">How it works</h2>
      <p>The times are minutes <em>at pressure</em>. The pot takes another 5 to 15 minutes to build pressure first, depending on how full it is, so plan for that. For meat sold by weight, the calculator multiplies the minutes per pound by your weight. It’s a starting point: check large pieces with a thermometer and give them a few more minutes if they need it. ${PRIVATE}</p>
      <h3>Quick release vs natural release</h3>
      <p><strong>Quick release</strong> means turning the valve to venting as soon as the time is up, which stops the cooking fast. Use it for vegetables and seafood. <strong>Natural release</strong> means leaving the valve alone while the pressure drops by itself, which keeps cooking the food gently. Meat stays juicier, and beans and grains finish without spitting foam out of the valve.</p>
      <h3>Ways to use it</h3>
      <ul>
        <li><strong>Weeknight chicken.</strong> Breasts from the fridge in about 15 minutes at pressure for 2 lb.</li>
        <li><strong>Meal-prep beans.</strong> Dry black beans in 20 to 25 minutes, no soaking.</li>
        <li><strong>Rice.</strong> 1:1 water, 4 minutes for white.</li>
        <li><strong>Hard-boiled eggs.</strong> The 5-5-5 method peels easily.</li>
        <li><strong>A frozen roast.</strong> Add about half again to the time (see the FAQ).</li>
      </ul>
    </section>`,
    faqs: [
      { q: 'What does natural release mean?', a: 'You leave the valve closed when the time is up and let the pressure drop by itself. “Natural 10 min” means wait 10 minutes, then turn the valve to release whatever pressure is left. “Natural (full)” means wait until the float valve drops on its own.' },
      { q: 'Do I count the time to come to pressure?', a: 'No. The times are minutes at pressure, after the pot has sealed. Coming up to pressure adds roughly 5 to 15 minutes, more when the pot is full or the food is frozen.' },
      { q: 'Why are vegetables so short?', a: 'Pressure cooking is hot (about 240 °F inside), and vegetables don’t need much to soften. They also keep cooking while the pot comes to pressure, so a 1-minute setting is plenty for broccoli. Use quick release so they don’t turn to mush.' },
      { q: 'Can I cook frozen meat?', a: 'Yes. Cook frozen pieces about 50% longer than the time in the table, and check the center with a thermometer. Frozen pieces stuck together in a block take longer, so separate them if you can.' },
      { q: 'Is anything saved?', a: 'No. The table and calculator run in your browser and nothing is saved or sent anywhere.' },
    ],
  });

  // ── 8. Turkey ─────────────────────────────────────────────────────────────
  const turkeyRows = T.TURKEY.map((b) => [`${b.from} to ${b.to} lb`, T.hoursRange(b.unstuffed), T.hoursRange(b.stuffed)]);
  const thawRows = [8, 12, 16, 20, 24].map((lb) => [`${lb} lb`, `${Math.ceil(lb / 4)} days`]);
  toolPage({
    path: '/kitchen/turkey-cooking-time/',
    name: 'Turkey Cooking Time Calculator',
    metaTitle: 'Turkey Cooking Time Calculator: How Long to Roast a Turkey | Lazy Cat Tools',
    description: 'Free turkey cooking time calculator. Enter the weight and get USDA roasting times at 325 °F, the done temperature, rest time and thawing days. No sign-up.',
    answer: 'At 325 °F, a <strong>12 to 14 lb unstuffed turkey takes 3 to 3¾ hours</strong>; stuffed, 3½ to 4 hours. It’s done at <strong>165 °F</strong> in the thickest part of the thigh. <strong>Rest it 20 minutes before carving.</strong>',
    appDesc: 'Work out turkey roasting time at 325 °F by weight, stuffed or unstuffed, with the done temperature, rest time, thawing days and a start time.',
    tool: `<form class="converter" data-turkey aria-label="Turkey cooking time calculator">
      <div class="conv-row">
        ${field('tk-w', 'Turkey weight', input('tk-w', 'weight', '14'))}
        ${seg('wunit', 'Unit', [['lb', 'lb'], ['kg', 'kg']], 'lb')}
      </div>
      <div class="conv-row">
        ${seg('stuffed', 'Stuffing', [['no', 'Unstuffed'], ['yes', 'Stuffed']], 'no')}
        ${field('tk-serve', 'Serving time <span class="hint">optional</span>', '<input id="tk-serve" name="serve" type="time" autocomplete="off">')}
      </div>
      ${result}
    </form>`,
    scripts,
    sections: `<section class="k-section" aria-labelledby="chart-h">
      <h2 id="chart-h">USDA turkey roasting times at 325 °F</h2>
      ${table('Fresh or thawed whole turkey, oven at 325 °F', ['Weight', 'Unstuffed', 'Stuffed'], turkeyRows)}
      <p class="source">Source: USDA roasting timetable for fresh or thawed turkey at 325 °F, as published by <a href="https://extension.illinois.edu/turkey/traditional-roast-turkey-unstuffed" rel="noopener">University of Illinois Extension</a>. Times are approximate; the thermometer decides.</p>
    </section>

    <section class="k-section" aria-labelledby="thaw-h">
      <h2 id="thaw-h">Thawing in the refrigerator</h2>
      ${table('Allow about 1 day for every 4 pounds', ['Turkey', 'Days in the fridge'], thawRows)}
      <p class="source">Thaw in the refrigerator, breast side up, in its wrapper on a tray. <strong>Never thaw a turkey on the counter</strong>: the outside sits at room temperature long enough for bacteria to grow while the middle is still frozen.</p>
    </section>

    <section class="k-section prose" aria-labelledby="how-h">
      <h2 id="how-h">How it works</h2>
      <p>Enter the weight and whether it’s stuffed, and the calculator looks up the USDA time range for that weight at 325 °F. Add your serving time and it tells you when the turkey needs to go in: the longer end of the range plus the 20-minute rest. The USDA times are for 325 °F; don’t roast a turkey any lower than that. ${PRIVATE}</p>
      <h3>Done means 165 °F</h3>
      <p>Check the innermost part of the thigh, the wing and the thickest part of the breast. If it’s stuffed, the center of the stuffing has to reach 165 °F too. Then <strong>let it rest 20 minutes before carving</strong>, so the juices settle back into the meat.</p>
      <h3>About stuffing</h3>
      <p>Stuff the turkey just before it goes in the oven, never the night before, and stuff it loosely. The USDA recommends baking the stuffing in a separate dish, which cooks more evenly and takes time off the roast.</p>
      <h3>Ways to use it</h3>
      <ul>
        <li><strong>Thanksgiving.</strong> Work back from dinner time to when it goes in the oven, and from that to when it comes out of the freezer.</li>
        <li><strong>Christmas.</strong> Same math, a month later.</li>
        <li><strong>Meal prep.</strong> A whole turkey is a week of sandwiches and soup.</li>
      </ul>
    </section>`,
    faqs: [
      { q: 'How long per pound?', a: 'It isn’t a straight per-pound number, because big birds cook faster per pound than small ones. The USDA chart gives ranges by weight: 2¾ to 3 hours for 8 to 12 lb, up to 4½ to 5 hours for 20 to 24 lb, unstuffed at 325 °F.' },
      { q: 'Stuffed or unstuffed?', a: 'Unstuffed is faster and cooks more evenly, which is why the USDA suggests baking stuffing in a separate dish. A stuffed turkey takes about 15 to 30 minutes longer, and the stuffing must reach 165 °F.' },
      { q: 'What temperature is done?', a: '165 °F in the innermost part of the thigh, the wing and the thickest part of the breast, measured with a food thermometer. For a stuffed turkey, the center of the stuffing must reach 165 °F too.' },
      { q: 'How long do I rest it?', a: '20 minutes before carving. The temperature keeps rising a little and the juices settle, so the meat stays moist when you slice it.' },
      { q: 'How many days to thaw?', a: 'About 1 day in the refrigerator for every 4 pounds, so a 12 lb turkey needs 3 days and a 20 lb turkey needs 5. Never thaw it on the counter.' },
    ],
  });
}
