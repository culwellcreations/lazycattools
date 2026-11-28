// Hand-designed kitchen tool pages (spoons, butter, oven, recipe scaler,
// recipe converter). Imported by build-kitchen.mjs, which passes in its shared
// helpers so every page has the same chrome. The second set of tools (air
// fryer, meat, coffee, rice, substitutions, cup fractions, pressure cooker,
// turkey) lives in kitchen-tools-2.mjs and uses the same toolPage().
import { KITCHEN_TOOLS_2, buildKitchenTools2 } from './kitchen-tools-2.mjs';

export function buildToolPages(h) {
  const { K, ING, esc, g, oz, head, FOOT, AD, crumbs, crumbsLd, faqHtml, faqLd, appLd, write, generated, ingUrl, JS_KITCHEN, JS_RECIPE } = h;

  function toolPage({ path, name, metaTitle, description, answer, tool, sections, faqs, scripts, appDesc }) {
    const crumbItems = [['Home', '/'], ['Kitchen', '/kitchen/'], [name, path]];
    const html = head({
      title: metaTitle,
      description,
      path,
      jsonld: [appLd(name, path, appDesc), crumbsLd(crumbItems), faqLd(faqs)],
    }) + `
  <main id="main-content" class="kitchen-main">
    ${crumbs(crumbItems)}
    <h1>${esc(name)}</h1>
    <p class="answer">${answer}</p>

    ${tool}
${AD}
    ${sections}

    ${faqHtml(faqs)}

    <section class="k-section" aria-labelledby="more-h">
      <h2 id="more-h">More kitchen tools</h2>
      <ul class="link-grid">
        ${TOOLS.filter((t) => t.path !== path).map((t) => `<li><a href="${t.path}">${esc(t.name)}</a></li>`).join('\n        ')}
      </ul>
    </section>

    ${h.guidesHtml}
  </main>
    ${scripts}
` + FOOT;
    write(path, html);
    generated.push(path);
  }

  const resultBox = (main = '—') => `<p class="conv-error" id="conv-error" data-result-error hidden>Type a number, like 1, 1.5, 1 1/2 or ¾.</p>
      <div class="conv-result" aria-live="polite">
        <div class="conv-result-main" data-result-main>${main}</div>
        <dl class="result-rows" data-result-rows></dl>
      </div>`;

  const field = (id, label, inner) => `<div class="conv-field"><label for="${id}">${label}</label>${inner}</div>`;
  const select = (id, name, opts, sel) => `<select id="${id}" name="${name}">${opts.map(([v, l]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  const amountInput = (val) => `<input id="conv-amount" name="amount" type="text" inputmode="decimal" autocomplete="off" value="${val}" aria-describedby="conv-error">`;

  // ── 1. Cups, tablespoons & teaspoons ──────────────────────────────────────
  const CUPS = [[1 / 8, '⅛ cup', '1-8-cup'], [1 / 4, '¼ cup', '1-4-cup'], [1 / 3, '⅓ cup', '1-3-cup'], [3 / 8, '⅜ cup', '3-8-cup'],
    [1 / 2, '½ cup', '1-2-cup'], [5 / 8, '⅝ cup', '5-8-cup'], [2 / 3, '⅔ cup', '2-3-cup'], [3 / 4, '¾ cup', '3-4-cup'],
    [7 / 8, '⅞ cup', '7-8-cup'], [1, '1 cup', '1-cup'], [2, '2 cups', '2-cups']];
  const spoonRows = CUPS.map(([c, label, id]) => {
    const tsp = c * 48;
    return `<tr id="${id}"><th scope="row">${label}</th><td class="num-main">${esc(K.spoonsText(tsp))}</td><td>${+tsp.toFixed(2)}</td><td>${+(tsp / 6).toFixed(2)}</td><td>${K.formatMl(tsp)}</td></tr>`;
  }).join('\n          ');
  const TBSP = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
  const tbspRows = TBSP.map((t) => {
    const v = K.formatVolume(t * 3);
    const cups = K.toFraction(t / 16);
    return `<tr id="${t}-tbsp"><th scope="row">${t} tbsp</th><td class="num-main">${cups.exact ? `${cups.text} cup` : `about ${cups.text} cup`}</td><td>${t * 3} tsp</td><td>${K.formatMl(t * 3)}</td></tr>`;
  }).join('\n          ');

  // ── 2. Butter ─────────────────────────────────────────────────────────────
  const STICK_G = 453.592 / 4;
  const STICKS = [[1 / 4, '¼ stick'], [1 / 2, '½ stick'], [3 / 4, '¾ stick'], [1, '1 stick'], [1.5, '1½ sticks'], [2, '2 sticks'], [3, '3 sticks'], [4, '4 sticks']];
  const butterRows = STICKS.map(([s, label]) => {
    const grams = s * STICK_G;
    const cups = K.toFraction(s / 2);
    return `<tr id="${String(s).replace('.', '-')}-stick"><th scope="row">${label}</th><td class="num-main">${g(grams)}</td><td>${cups.text} cup</td><td>${s * 8} tbsp</td><td>${oz(grams)}</td></tr>`;
  }).join('\n          ');
  const BLOCK = [[100, '100 g'], [125, '125 g'], [200, '200 g'], [250, '250 g (European block)'], [500, '500 g']];
  const blockRows = BLOCK.map(([grams, label]) => {
    const s = grams / STICK_G;
    return `<tr><th scope="row">${label}</th><td class="num-main">${K.toFraction(s).exact ? '' : 'about '}${K.toFraction(s).text} sticks</td><td>${K.formatVolume(K.gramsToTsp(grams, 226.8)).text}</td><td>${+(s * 8).toFixed(1)} tbsp</td></tr>`;
  }).join('\n          ');

  // ── 3. Oven ───────────────────────────────────────────────────────────────
  const ovenRows = [];
  for (let f = 250; f <= 500; f += 25) {
    const c = K.fToC(f);
    const gas = K.nearestGas(f);
    ovenRows.push(`<tr id="${f}f"><th scope="row">${f} °F</th><td class="num-main">${Math.round(c)} °C</td><td>${Math.round(c / 10) * 10} °C</td><td>${gas ? K.gasLabel(gas[0]) : '—'}</td><td>${f - 25} °F / ${Math.round(c) - 20} °C</td></tr>`);
  }

  // ── 4/5. Recipe tools ─────────────────────────────────────────────────────
  const recipeBox = (controls, mode) => `<form class="converter recipe-tool" ${mode} aria-label="Recipe">
      <div class="conv-field">
        <label for="recipe">Ingredients <span class="hint">one per line</span></label>
        <textarea id="recipe" name="recipe" rows="9" spellcheck="false" placeholder="2 1/4 cups all-purpose flour&#10;1 tsp baking soda&#10;1 cup butter&#10;2 large eggs"></textarea>
        <div class="recipe-actions"><button type="button" class="btn-ghost" data-example>Try an example</button></div>
      </div>
      ${controls}
      <div class="recipe-result">
        <div class="recipe-result-head">
          <h2>Result</h2>
          <span class="copy-status" data-copy-status aria-live="polite"></span>
          <button type="button" class="btn-ghost" data-copy>Copy</button>
        </div>
        <p class="recipe-empty" data-recipe-empty>Paste a recipe above, or try the example.</p>
        <ol class="recipe-out" data-recipe-out aria-live="polite"></ol>
      </div>
    </form>`;

  const scalerControls = `<fieldset class="scale-controls">
        <legend>Scale by</legend>
        <div class="seg" role="group" aria-label="Quick scale">
          <button type="button" data-factor="1/2" aria-pressed="false">½×</button>
          <button type="button" data-factor="1.5" aria-pressed="false">1½×</button>
          <button type="button" data-factor="2" aria-pressed="true">2×</button>
          <button type="button" data-factor="3" aria-pressed="false">3×</button>
        </div>
        <div class="conv-row conv-row-3">
          ${field('factor', 'Custom', '<input id="factor" name="factor" type="text" inputmode="decimal" autocomplete="off" value="2" aria-describedby="factor-error">')}
          ${field('makes', 'Recipe makes', '<input id="makes" name="makes" type="text" inputmode="decimal" autocomplete="off" placeholder="12">')}
          ${field('need', 'I need', '<input id="need" name="need" type="text" inputmode="decimal" autocomplete="off" placeholder="30">')}
        </div>
        <p class="conv-error" id="factor-error" data-factor-error hidden>Use a number above 0, like 2, 1.5 or 1/2.</p>
      </fieldset>`;

  const converterControls = `<fieldset class="scale-controls">
        <legend>Convert to</legend>
        <div class="seg seg-radio">
          <label><input type="radio" name="target" value="grams" checked> Grams</label>
          <label><input type="radio" name="target" value="cups"> Cups &amp; spoons</label>
        </div>
      </fieldset>`;
  const recipeData = `<script id="kitchen-data" type="application/json">${JSON.stringify(ING.map((i) => ({ slug: i.slug, lower: i.lower, gpc: i.gpc, aliases: i.aliases })))}</script>`;
  const recipeScripts = `<script src="${JS_KITCHEN}" defer></script>\n    <script src="${JS_RECIPE}" defer></script>`;

  const TOOLS = [
    { path: '/kitchen/cups-to-grams/', name: 'Cups to Grams Converter' },
    { path: '/kitchen/cups-tablespoons-teaspoons/', name: 'Cups, Tablespoons & Teaspoons' },
    { path: '/kitchen/recipe-scaler/', name: 'Recipe Scaler' },
    { path: '/kitchen/recipe-converter/', name: 'Recipe Converter' },
    { path: '/kitchen/butter-converter/', name: 'Butter Converter' },
    { path: '/kitchen/oven-temperature/', name: 'Oven Temperature Converter' },
    { path: '/kitchen/pan-size-converter/', name: 'Pan Size Converter' },
    ...KITCHEN_TOOLS_2.map((t) => ({ path: t.path, name: t.name })),
  ];

  toolPage({
    path: '/kitchen/cups-tablespoons-teaspoons/',
    name: 'Cups, Tablespoons & Teaspoons',
    metaTitle: 'Cups to Tablespoons & Teaspoons Converter | Lazy Cat Tools',
    description: '1 cup = 16 tablespoons = 48 teaspoons. Convert cups, tablespoons, teaspoons, fluid ounces and ml, with a chart for ⅛ cup to 2 cups. Free, no sign-up.',
    answer: '<strong>1 cup = 16 tablespoons = 48 teaspoons.</strong> ½ cup is 8 tablespoons, ⅓ cup is 5 tablespoons plus 1 teaspoon, and ¼ cup is 4 tablespoons.',
    appDesc: 'Convert between US cups, tablespoons, teaspoons, fluid ounces and milliliters.',
    tool: `<form class="converter" data-volume-converter aria-label="Volume converter">
      <div class="conv-row">
        ${field('conv-amount', 'Amount', amountInput('1/3'))}
        ${field('conv-unit', 'Unit', select('conv-unit', 'unit', [['cup', 'cups'], ['tbsp', 'tablespoons'], ['tsp', 'teaspoons'], ['floz', 'fluid ounces'], ['ml', 'milliliters']], 'cup'))}
      </div>
      ${resultBox()}
      <p class="conv-note">US measuring cups and spoons. Volume only, so it works for any ingredient.</p>
    </form>`,
    scripts: `<script src="${JS_KITCHEN}" defer></script>`,
    sections: `<section class="k-section" aria-labelledby="chart-h">
      <h2 id="chart-h">Cups to tablespoons and teaspoons</h2>
      <div class="chart-wrap"><table class="chart">
        <caption>US cups in spoons, fluid ounces and milliliters</caption>
        <thead><tr><th scope="col">Cups</th><th scope="col">Spoons</th><th scope="col">Tsp</th><th scope="col">Fl oz</th><th scope="col">ml</th></tr></thead>
        <tbody>
          ${spoonRows}
        </tbody>
      </table></div>
    </section>

    <section class="k-section" aria-labelledby="tbsp-h">
      <h2 id="tbsp-h">Tablespoons to cups</h2>
      <div class="chart-wrap"><table class="chart">
        <caption>US tablespoons in cups, teaspoons and milliliters</caption>
        <thead><tr><th scope="col">Tbsp</th><th scope="col">Cups</th><th scope="col">Tsp</th><th scope="col">ml</th></tr></thead>
        <tbody>
          ${tbspRows}
        </tbody>
      </table></div>
    </section>

    <section class="k-section prose" aria-labelledby="about-h">
      <h2 id="about-h">The numbers to remember</h2>
      <p>Three teaspoons make a tablespoon, and sixteen tablespoons make a cup. Everything else follows from those two facts: ¼ cup is 4 tablespoons, ½ cup is 8, ¾ cup is 12. The awkward ones are thirds, because 16 doesn't divide by 3. That's why ⅓ cup is 5 tablespoons plus 1 teaspoon and ⅔ cup is 10 tablespoons plus 2 teaspoons.</p>
      <h3>Not every tablespoon is the same size</h3>
      <p>A US tablespoon holds 14.8 ml. The metric tablespoon used in the UK, Canada and New Zealand is 15 ml, close enough that it never matters. Australia is the exception: an Australian tablespoon is 20 ml, or 4 teaspoons instead of 3. If an Australian recipe calls for 2 tablespoons of something strong, like baking soda or salt, use 2 tablespoons plus 2 teaspoons of US spoons.</p>
      <p>These are all volume conversions, so they work the same for every ingredient. To turn spoons into grams, use the <a href="/kitchen/cups-to-grams/">cups to grams converter</a>, which knows what each ingredient weighs.</p>
    </section>`,
    faqs: [
      { q: 'How many tablespoons are in a cup?', a: '16 tablespoons are in 1 US cup. Half a cup is 8 tablespoons and a quarter cup is 4.' },
      { q: 'How many teaspoons are in ½ cup?', a: '24 teaspoons. There are 48 teaspoons in a cup, so half a cup is 24, which is also 8 tablespoons.' },
      { q: 'How many teaspoons are in ⅓ cup?', a: '16 teaspoons, which is 5 tablespoons plus 1 teaspoon.' },
      { q: 'How many teaspoons are in ¼ cup?', a: '12 teaspoons, or 4 tablespoons.' },
      { q: 'Is an Australian tablespoon different?', a: 'Yes. An Australian tablespoon is 20 ml, equal to 4 teaspoons. US and most other tablespoons are about 15 ml, or 3 teaspoons.' },
    ],
  });

  toolPage({
    path: '/kitchen/butter-converter/',
    name: 'Butter Converter',
    metaTitle: 'Butter Converter: Sticks to Cups, Grams & Tablespoons | Lazy Cat Tools',
    description: '1 stick of butter = ½ cup = 8 tablespoons = 113 g. Convert butter between sticks, cups, tablespoons, grams, ounces and pounds. Free, no sign-up.',
    answer: '<strong>1 stick of butter = ½ cup = 8 tablespoons = 113 g</strong> (4 oz). Four sticks make a pound.',
    appDesc: 'Convert butter between US sticks, cups, tablespoons, grams, ounces and pounds.',
    tool: `<form class="converter" data-butter-converter aria-label="Butter converter">
      <div class="conv-row">
        ${field('conv-amount', 'Amount', amountInput('1'))}
        ${field('conv-unit', 'Unit', select('conv-unit', 'unit', [['stick', 'sticks'], ['cup', 'cups'], ['tbsp', 'tablespoons'], ['tsp', 'teaspoons'], ['g', 'grams'], ['oz', 'ounces'], ['lb', 'pounds']], 'stick'))}
      </div>
      ${resultBox()}
      <p class="conv-note">US sticks: 1 pound = 4 sticks. Salted and unsalted weigh the same.</p>
    </form>`,
    scripts: `<script src="${JS_KITCHEN}" defer></script>`,
    sections: `<section class="k-section" aria-labelledby="chart-h">
      <h2 id="chart-h">Butter sticks chart</h2>
      <div class="chart-wrap"><table class="chart">
        <caption>US butter sticks in grams, cups, tablespoons and ounces</caption>
        <thead><tr><th scope="col">Sticks</th><th scope="col">Grams</th><th scope="col">Cups</th><th scope="col">Tbsp</th><th scope="col">Ounces</th></tr></thead>
        <tbody>
          ${butterRows}
        </tbody>
      </table></div>
    </section>

    <section class="k-section" aria-labelledby="g-h">
      <h2 id="g-h">Grams of butter to sticks</h2>
      <div class="chart-wrap"><table class="chart">
        <caption>Metric butter amounts in US sticks, cups and tablespoons</caption>
        <thead><tr><th scope="col">Grams</th><th scope="col">Sticks</th><th scope="col">Cups</th><th scope="col">Tbsp</th></tr></thead>
        <tbody>
          ${blockRows}
        </tbody>
      </table></div>
    </section>

    <section class="k-section prose" aria-labelledby="about-h">
      <h2 id="about-h">Sticks, blocks and pounds</h2>
      <p>American butter comes in 1-pound boxes of four sticks, and every stick is the same: 4 ounces, 113 grams, ½ cup or 8 tablespoons. The wrapper is marked in tablespoons, so cutting along the lines is as accurate as a scale. East Coast sticks are long and thin and West Coast sticks are short and stubby, but they weigh exactly the same.</p>
      <p>Most of the rest of the world sells butter in 250 g blocks, which is about 2¼ US sticks. When a European or Australian recipe says "1 block of butter", that's 250 g: two sticks plus about 2 tablespoons. Melted butter weighs the same as solid, so a recipe that calls for melted butter by the cup still means 113 g per half cup.</p>
      <p>For butter's other conversions, like ⅛ cup or 3 cups, see the <a href="${ingUrl(ING.find((i) => i.slug === 'butter'))}">butter cups to grams chart</a>.</p>
    </section>`,
    faqs: [
      { q: 'How many grams is a stick of butter?', a: 'One US stick of butter is 113 g, which is 4 ounces, ½ cup or 8 tablespoons.' },
      { q: 'How many sticks of butter are in a cup?', a: 'Two. One cup of butter is 2 sticks, 16 tablespoons or 227 g.' },
      { q: 'How many sticks is 250 g of butter?', a: '250 g is about 2¼ sticks: 2 sticks plus about 2 tablespoons. It’s the standard size of a European butter block.' },
      { q: 'Does melted butter measure the same as solid butter?', a: 'By weight, yes: 113 g is 113 g. By volume it’s close enough for most recipes, though solid butter packed into a cup can trap air. Weighing avoids the question.' },
    ],
  });

  toolPage({
    path: '/kitchen/oven-temperature/',
    name: 'Oven Temperature Converter',
    metaTitle: 'Oven Temperature Converter: °F, °C, Gas Mark & Fan | Lazy Cat Tools',
    description: '350 °F is 177 °C (recipes round to 180 °C) or gas mark 4. Convert oven temperatures between Fahrenheit, Celsius and gas marks, with fan oven adjustments.',
    answer: '<strong>350 °F = 177 °C</strong>, which recipes round to 180 °C, or gas mark 4. For a fan (convection) oven, lower the temperature by about 25 °F or 20 °C.',
    appDesc: 'Convert oven temperatures between Fahrenheit, Celsius and UK gas marks, with a fan oven adjustment.',
    tool: `<form class="converter" data-oven-converter aria-label="Oven temperature converter">
      <div class="conv-row">
        ${field('conv-amount', 'Temperature', '<input id="conv-amount" name="temp" type="text" inputmode="decimal" autocomplete="off" value="350" aria-describedby="conv-error">')}
        ${field('conv-unit', 'Unit', select('conv-unit', 'unit', [['f', '°F'], ['c', '°C'], ['gas', 'gas mark']], 'f'))}
      </div>
      <label class="check"><input type="checkbox" name="fan" checked> Show fan / convection oven setting</label>
      ${resultBox()}
    </form>`,
    scripts: `<script src="${JS_KITCHEN}" defer></script>`,
    sections: `<section class="k-section" aria-labelledby="chart-h">
      <h2 id="chart-h">Oven temperature chart</h2>
      <div class="chart-wrap"><table class="chart">
        <caption>Fahrenheit to Celsius, recipe-rounded Celsius, gas mark and fan setting</caption>
        <thead><tr><th scope="col">°F</th><th scope="col">°C</th><th scope="col">Recipe °C</th><th scope="col">Gas</th><th scope="col">Fan oven</th></tr></thead>
        <tbody>
          ${ovenRows.join('\n          ')}
        </tbody>
      </table></div>
    </section>

    <section class="k-section prose" aria-labelledby="about-h">
      <h2 id="about-h">Why recipes round the numbers</h2>
      <p>Exact conversions give awkward numbers: 350 °F is 176.7 °C. Recipe writers round to the nearest 10 °C, so 350 °F becomes 180 °C and 180 °C becomes 350 °F. The 3-degree difference is far smaller than the error in most home ovens, which can run 10–25 degrees hot or cold. An oven thermometer that hangs from the rack is the cheapest way to find out what yours actually does.</p>
      <h3>Fan and convection ovens</h3>
      <p>A fan oven blows hot air around the food, so it cooks faster and more evenly at the same setting. Most UK and European recipes list both temperatures; American recipes usually assume a conventional oven. The usual rule is to set a fan oven about 25 °F or 20 °C lower, or keep the temperature and start checking 5–10 minutes early.</p>
      <h3>Gas marks</h3>
      <p>Gas marks come from British gas cookers and still appear in older UK recipes. Mark 4 is the classic baking temperature, 350 °F or 180 °C. Each mark above 1 adds about 25 °F, and the lowest settings are ¼ and ½.</p>
    </section>`,
    faqs: [
      { q: 'What is 350 °F in Celsius?', a: '350 °F is 176.7 °C, which recipes round to 180 °C. It’s gas mark 4, or about 160 °C in a fan oven.' },
      { q: 'What is 180 °C in Fahrenheit?', a: '180 °C is 356 °F. Recipes treat it as 350 °F, the standard baking temperature.' },
      { q: 'How do I convert a recipe for a fan oven?', a: 'Lower the temperature by about 20 °C (25 °F), or keep it the same and check for doneness 5 to 10 minutes early.' },
      { q: 'What temperature is gas mark 6?', a: 'Gas mark 6 is 400 °F or 200 °C, a hot oven used for roasting vegetables and baking bread rolls.' },
    ],
  });

  // ── Pan size ──────────────────────────────────────────────────────────────
  const panArea = (id) => { const p = K.panById(id); return K.panArea(p.shape, p.a, p.b); };
  const panOpts = (sel) => `<optgroup label="Round">${K.PANS.filter((p) => p.shape === 'round').map((p) => `<option value="${p.id}"${p.id === sel ? ' selected' : ''}>${p.label}</option>`).join('')}</optgroup>
          <optgroup label="Square &amp; rectangle">${K.PANS.filter((p) => p.shape === 'rect' && !p.id.startsWith('l')).map((p) => `<option value="${p.id}"${p.id === sel ? ' selected' : ''}>${p.label}</option>`).join('')}</optgroup>
          <optgroup label="Loaf">${K.PANS.filter((p) => p.id.startsWith('l')).map((p) => `<option value="${p.id}"${p.id === sel ? ' selected' : ''}>${p.label}</option>`).join('')}</optgroup>
          <optgroup label="Other size"><option value="custom-round">Custom round</option><option value="custom-square">Custom square</option><option value="custom-rect">Custom rectangle</option></optgroup>`;
  const panSide = (k, legend, sel) => `<fieldset class="pan-set" data-pan="${k}">
        <legend>${legend}</legend>
        <div class="conv-row pan-row">
          ${field(`${k}-pan`, 'Pan', `<select id="${k}-pan" name="${k}-pan">${panOpts(sel)}</select>`)}
          ${field(`${k}-count`, 'How many', `<input id="${k}-count" name="${k}-count" type="text" inputmode="numeric" autocomplete="off" value="1">`)}
        </div>
        <div class="conv-row conv-row-3" data-custom hidden>
          <div class="conv-field"><label for="${k}-a" data-a-label>Diameter</label><input id="${k}-a" name="${k}-a" type="text" inputmode="decimal" autocomplete="off" value="${k === 'from' ? '20' : '23'}"></div>
          <div class="conv-field" data-b hidden><label for="${k}-b">Width</label><input id="${k}-b" name="${k}-b" type="text" inputmode="decimal" autocomplete="off" value="20"></div>
          ${field(`${k}-unit`, 'Unit', select(`${k}-unit`, `${k}-unit`, [['in', 'inches'], ['cm', 'cm']], 'cm'))}
        </div>
      </fieldset>`;
  const panChartRows = K.PANS.map((p) => {
    const a = panArea(p.id);
    return `<tr id="pan-${p.id}"><th scope="row">${p.label}</th><td class="num-main">${(+a.toFixed(1)).toLocaleString('en-US')} sq in</td><td>${Math.round(a * 6.4516).toLocaleString('en-US')} cm²</td><td>×${(a / panArea('r9')).toFixed(2)}</td></tr>`;
  }).join('\n          ');
  const SWAPS = [
    ['r8', 1, 'r9', 1], ['r9', 1, 's8', 1], ['p9x13', 1, 'r9', 2], ['p9x13', 1, 's8', 2], ['r8', 2, 'p9x13', 1],
    ['s8', 1, 'p9x13', 1], ['p9x13', 1, 'p18x13', 1], ['s9', 1, 's8', 1], ['r10', 1, 'r9', 1], ['l9', 1, 'l85', 1],
  ];
  const panName = (id, n) => { const l = K.panById(id).label; return n === 1 ? l : `${['', 'one', 'two', 'three'][n]} ${l}s`; };
  const swapRows = SWAPS.map(([a, n, b, m]) => {
    const r = (panArea(b) * m) / (panArea(a) * n);
    const adv = K.panAdvice(r);
    return `<tr><th scope="row">${panName(a, n)}</th><td>${panName(b, m)}</td><td class="num-main">${adv.kind === 'scale' ? `×${r.toFixed(2)}` : 'Same recipe'}</td></tr>`;
  }).join('\n          ');

  toolPage({
    path: '/kitchen/pan-size-converter/',
    name: 'Pan Size Converter',
    metaTitle: 'Pan Size Converter: Swap Cake Pans & Resize Recipes | Lazy Cat Tools',
    description: 'Baking in a different pan? Compare pan sizes by area and get the number to multiply your recipe by. An 8-inch to 9-inch round needs 1¼× the batter. Free, no sign-up.',
    answer: 'Pick the pan the recipe uses and the pan you have. <strong>An 8-inch round recipe needs 1¼× the batter for a 9-inch round</strong>, and a 9×13 recipe fills two 9-inch rounds as written.',
    appDesc: 'Compare baking pans by area and get the factor to scale a recipe for a different pan size.',
    tool: `<form class="converter" data-pan-converter aria-label="Pan size converter">
      ${panSide('from', 'Recipe pan', 'r8')}
      ${panSide('to', 'Your pan', 'r9')}
      <p class="conv-error" data-result-error hidden>Check the sizes: use numbers above 0, and 1 to 12 pans.</p>
      <div class="conv-result" aria-live="polite">
        <div class="conv-result-main" data-result-main>—</div>
        <dl class="result-rows" data-result-rows></dl>
        <p class="pan-note" data-pan-note></p>
      </div>
      <a class="btn-ghost pan-scale" data-pan-scale href="/kitchen/recipe-scaler/" hidden>Scale your recipe</a>
      <p class="conv-note">Measure across the top, inside edge to inside edge. Sizes compare by area, assuming the same pan depth.</p>
    </form>`,
    scripts: `<script src="${JS_KITCHEN}" defer></script>`,
    sections: `<section class="k-section" aria-labelledby="swap-h">
      <h2 id="swap-h">Common pan swaps</h2>
      <div class="chart-wrap"><table class="chart">
        <caption>How much to multiply a recipe by when you change pans</caption>
        <thead><tr><th scope="col">Recipe uses</th><th scope="col">You have</th><th scope="col">Multiply by</th></tr></thead>
        <tbody>
          ${swapRows}
        </tbody>
      </table></div>
    </section>

    <section class="k-section" aria-labelledby="chart-h">
      <h2 id="chart-h">Baking pan sizes chart</h2>
      <div class="chart-wrap"><table class="chart">
        <caption>Area of common US baking pans, and how each compares with a 9-inch round</caption>
        <thead><tr><th scope="col">Pan</th><th scope="col">Area</th><th scope="col">Metric</th><th scope="col">vs 9-inch round</th></tr></thead>
        <tbody>
          ${panChartRows}
        </tbody>
      </table></div>
    </section>

    <section class="k-section prose" aria-labelledby="about-h">
      <h2 id="about-h">Why pans are compared by area</h2>
      <p>Bake time depends mostly on how deep the batter is. If two pans have the same area, the same recipe fills them to the same depth and bakes in about the same time, whatever their shape. So the converter works out the area of each pan (π × radius² for a round, length × width for the rest) and tells you how much more or less batter you need to fill yours to the same depth.</p>
      <p>Round pans hold less than their size suggests. A 9-inch round has about the same area as an 8-inch square, and going up one inch on a round pan adds about 25% more room. That's why an 8-inch layer cake recipe looks thin in 9-inch pans.</p>
      <h3>If you don't want to scale the recipe</h3>
      <p>Within about 10% either way, the recipe works as written. Past that, the batter ends up noticeably deeper or thinner. A deeper batter needs longer in the oven, and the edges can overbake before the middle sets, so lower the temperature by 25 °F and test with a toothpick. A thinner batter bakes faster, so start checking about two thirds of the way through the time. To change the amounts, the <a href="/kitchen/recipe-scaler/">recipe scaler</a> multiplies every line for you.</p>
      <h3>Glass and dark pans</h3>
      <p>Glass and dark nonstick pans absorb more heat than shiny metal and brown the edges faster. Many bakers lower the oven by 25 °F when using them, especially for cakes and brownies.</p>
    </section>`,
    faqs: [
      { q: 'Can I use a 9×13 pan instead of two 9-inch rounds?', a: 'Yes. Two 9-inch rounds hold about 127 square inches and a 9×13 holds 117, so the batter sits a little deeper in the 9×13. Use the recipe as written and expect it to need a few extra minutes.' },
      { q: 'What size round pan equals an 8×8 square?', a: 'A 9-inch round. Both are about 64 square inches, so they take the same recipe and a similar bake time.' },
      { q: 'How much more batter does a 9-inch round need than an 8-inch?', a: 'About 27% more, so multiply the recipe by 1¼. A 9-inch round is 63.6 square inches and an 8-inch round is 50.3.' },
      { q: 'How do I use a recipe written for a pan in centimeters?', a: 'Choose a custom round, square or rectangle, switch the unit to cm and enter the size. A 20 cm round is close to an 8-inch round, and a 23 cm round is close to a 9-inch.' },
      { q: 'Does pan depth matter?', a: 'The converter assumes both pans are the same depth, which is true of most cake pans (2 inches). Fill cake pans about half to two thirds full, so a deep pan with the same area doesn’t need more batter.' },
    ],
  });

  const knownList = ING.map((i) => `<a href="${ingUrl(i)}">${esc(i.lower)}</a>`).join(', ');

  toolPage({
    path: '/kitchen/recipe-scaler/',
    name: 'Recipe Scaler',
    metaTitle: 'Recipe Scaler: Double, Halve or Resize Any Recipe | Lazy Cat Tools',
    description: 'Paste a recipe and scale it: half, double, triple, or from 12 servings to 30. Amounts are tidied into real kitchen measures like ⅓ cup or 2 tbsp. Free, no sign-up.',
    answer: 'Paste the ingredient list, pick how much to make, and copy the result. Amounts come out as real kitchen measures: 1 teaspoon tripled is <strong>1 tbsp</strong>, and 4 tablespoons doubled is <strong>½ cup</strong>.',
    appDesc: 'Scale a pasted recipe by any factor or number of servings, with amounts rounded to kitchen measures.',
    tool: recipeBox(scalerControls, 'data-recipe-scaler'),
    scripts: recipeScripts,
    sections: `<section class="k-section prose" aria-labelledby="how-h">
      <h2 id="how-h">How it works</h2>
      <p>Each line is read for an amount, a unit and the ingredient. The amount is multiplied, then written back in the unit you'd actually reach for: 12 teaspoons becomes ¼ cup, and half of ¼ cup becomes 2 tablespoons. Fractions are rounded to the nearest ⅛, and anything that wouldn't round cleanly stays in spoons, so nothing is quietly off by more than a few percent. Lines without an amount, like "pinch of salt", are left alone.</p>
      <p>It understands fractions (1 1/2, 1½, ¾), ranges (2–3 cups), abbreviations (c, tbsp, T, tsp, t, oz, g, ml) and weights in brackets like "1 cup (120 g) flour". Everything happens in your browser; the recipe isn't sent anywhere.</p>
      <h3>What doesn't scale in a straight line</h3>
      <p>Ingredients scale cleanly; cooking doesn't always. A doubled cake batter needs a bigger pan or two pans, and a deeper pan bakes longer. Eggs don't split well, so round to whole eggs or beat one and use part of it. Salt and strong spices are safest scaled a little under and adjusted to taste. Baking soda and baking powder scale fine for doubling, but for very large batches many bakers cut back slightly.</p>
    </section>`,
    faqs: [
      { q: 'How do I scale a recipe by servings?', a: 'Enter how many the recipe makes and how many you need. The scaler divides one by the other, so a recipe for 12 scaled to 30 is multiplied by 2.5.' },
      { q: 'How do I halve ⅓ cup?', a: 'Half of ⅓ cup is 2⅔ tablespoons, which is 2 tablespoons plus 2 teaspoons. The scaler switches to spoons automatically, because ⅙ cup isn’t on any measuring set.' },
      { q: 'What do I do with half an egg?', a: 'Beat the egg, then use about half by weight or volume: a large egg is roughly 50 g or 3 tablespoons, so half is about 25 g or 1½ tablespoons.' },
      { q: 'Does it change baking time?', a: 'No. Time and pan size depend on how deep the batter is, not just how much there is. If you double a recipe, use a second pan of the same size and the original time will be close.' },
    ],
  });

  toolPage({
    path: '/kitchen/recipe-converter/',
    name: 'Recipe Converter',
    metaTitle: 'Recipe Converter: Cups to Grams for a Whole Recipe | Lazy Cat Tools',
    description: 'Paste a whole recipe and convert every line from cups and spoons to grams, or grams back to cups, using the weight of each ingredient. Free, no sign-up.',
    answer: 'Paste a recipe and every line with a known ingredient is converted at once: <strong>2¼ cups all-purpose flour becomes 270 g</strong>, ¾ cup brown sugar 160 g. Switch to cups to go the other way.',
    appDesc: 'Convert a pasted recipe between cups and grams line by line, using ingredient-specific weights.',
    tool: recipeBox(converterControls, 'data-recipe-converter') + '\n    ' + recipeData,
    scripts: recipeScripts,
    sections: `<section class="k-section prose" aria-labelledby="how-h">
      <h2 id="how-h">How it works</h2>
      <p>Each line is read for an amount, a unit and the ingredient, and the ingredient is matched to its weight per cup: flour, sugar, butter, milk and the rest of the ${ING.length} ingredients in the <a href="/kitchen/">kitchen charts</a>. "Flour" is read as all-purpose, "sugar" as granulated and "salt" as fine table salt, which is what most recipes mean. The original amount stays in brackets so you can check it.</p>
      <p>Lines the converter doesn't have a weight for, like vanilla extract or kosher salt, are left as they are and marked, rather than guessed. Eggs and other counted items are left alone. Everything happens in your browser.</p>
      <h3>Ingredients it knows</h3>
      <p>${knownList}.</p>
    </section>`,
    faqs: [
      { q: 'Why convert a recipe to grams?', a: 'Weighing is faster and more consistent than cups. A cup of flour can weigh anywhere from 120 to 150 g depending on how it’s scooped; 120 g is always 120 g. It also means fewer measuring cups to wash.' },
      { q: 'Why was a line left unchanged?', a: 'Either it has no amount and unit (like "2 eggs" or "pinch of salt"), or the ingredient isn’t one the converter has a weight for. Unknown ingredients are marked instead of guessed.' },
      { q: 'Which flour does "flour" mean?', a: 'All-purpose flour, at 120 g per cup spooned and leveled. Bread flour weighs the same; cake flour is a little lighter at about 113 g. Write the flour type in the line to get its exact weight.' },
      { q: 'Can it convert grams back to cups?', a: 'Yes. Choose "Cups & spoons" and lines measured in grams, ounces or pounds are converted to cups, tablespoons or teaspoons.' },
    ],
  });

  buildKitchenTools2({ ...h, toolPage, field, select });

  return TOOLS;
}
