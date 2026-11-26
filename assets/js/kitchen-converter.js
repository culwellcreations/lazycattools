/* Lazy Cat Tools — kitchen converter
   One file for both jobs: the build script requires it to write the chart
   tables, and the browser runs it to power the live converter. Keeping the math
   in one place means the charts and the converter can never disagree. */
(function (root) {
  'use strict';

  var TSP_PER_CUP = 48;
  var ML_PER_TSP = 4.92892;
  var G_PER_OZ = 28.3495;

  // Every volume unit expressed in teaspoons, every weight unit in grams.
  var UNITS = {
    cup:  { type: 'vol', tsp: 48, one: 'cup', many: 'cups' },
    tbsp: { type: 'vol', tsp: 3, one: 'tbsp', many: 'tbsp' },
    tsp:  { type: 'vol', tsp: 1, one: 'tsp', many: 'tsp' },
    floz: { type: 'vol', tsp: 6, one: 'fl oz', many: 'fl oz' },
    ml:   { type: 'vol', tsp: 1 / ML_PER_TSP, one: 'ml', many: 'ml' },
    l:    { type: 'vol', tsp: 1000 / ML_PER_TSP, one: 'liter', many: 'liters' },
    g:    { type: 'wt', g: 1, one: 'g', many: 'g' },
    kg:   { type: 'wt', g: 1000, one: 'kg', many: 'kg' },
    oz:   { type: 'wt', g: G_PER_OZ, one: 'oz', many: 'oz' },
    lb:   { type: 'wt', g: 453.592, one: 'lb', many: 'lb' }
  };

  // "5 tbsp + 1 tsp" style, for amounts people measure with spoons.
  function spoonsText(tsp) {
    var t = Math.round(tsp * 4) / 4; // nearest ¼ tsp
    var tbsp = Math.floor(t / 3 + 1e-9);
    var rest = Math.round((t - tbsp * 3) * 4) / 4;
    var parts = [];
    if (tbsp) parts.push(tbsp + ' tbsp');
    if (rest) parts.push(toFraction(rest).text + ' tsp');
    return parts.join(' + ') || '0 tsp';
  }

  function cToF(c) { return c * 9 / 5 + 32; }
  function fToC(f) { return (f - 32) * 5 / 9; }
  // UK gas marks, as printed on British ovens and in UK recipes.
  var GAS = [[0.25, 225, 110], [0.5, 250, 120], [1, 275, 140], [2, 300, 150], [3, 325, 170], [4, 350, 180],
    [5, 375, 190], [6, 400, 200], [7, 425, 220], [8, 450, 230], [9, 475, 240]];
  function gasLabel(m) { return m === 0.25 ? '¼' : m === 0.5 ? '½' : String(m); }
  function nearestGas(f) {
    if (f < 212 || f > 500) return null;
    var best = GAS[0];
    for (var i = 1; i < GAS.length; i++) if (Math.abs(GAS[i][1] - f) < Math.abs(best[1] - f)) best = GAS[i];
    return best;
  }

  var VULGAR = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875 };

  // Accepts "1", "1.5", "1,5", "3/4", "1 1/2", "1-1/2", "1½", "½", "2 and 1/2".
  function parseAmount(input) {
    if (input == null) return NaN;
    var s = String(input).trim().toLowerCase().replace(/\s+and\s+/g, ' ').replace(/,/g, '.');
    if (!s) return NaN;
    var total = 0;
    s = s.replace(/[¼½¾⅓⅔⅛⅜⅝⅞]/g, function (ch) { total += VULGAR[ch]; return ' '; }).trim();
    if (!s) return total;
    var parts = s.split(/[\s-]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > 2) return NaN;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (/^\d+\/\d+$/.test(p)) {
        var f = p.split('/');
        if (+f[1] === 0) return NaN;
        total += f[0] / f[1];
      } else if (/^\d*\.?\d+$/.test(p)) {
        if (i === 1) return NaN; // "1 2" is ambiguous
        total += parseFloat(p);
      } else {
        return NaN;
      }
    }
    return total;
  }

  // Convert any amount to grams for an ingredient (gpc = grams per US cup).
  function toGrams(amount, unit, gpc) {
    var u = UNITS[unit];
    if (u.type === 'wt') return amount * u.g;
    return (amount * u.tsp / TSP_PER_CUP) * gpc;
  }

  function gramsToTsp(grams, gpc) {
    return grams / gpc * TSP_PER_CUP;
  }

  var FRACTIONS = [
    [0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'],
    [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'], [1, '']
  ];

  // Nearest kitchen fraction. Returns { text, value, exact }.
  function toFraction(x) {
    var whole = Math.floor(x);
    var rest = x - whole;
    var best = FRACTIONS[0];
    for (var i = 1; i < FRACTIONS.length; i++) {
      if (Math.abs(FRACTIONS[i][0] - rest) < Math.abs(best[0] - rest)) best = FRACTIONS[i];
    }
    if (best[0] === 1) { whole += 1; best = FRACTIONS[0]; }
    var value = whole + best[0];
    var text = (whole ? String(whole) : '') + best[1];
    if (!text) text = '0';
    var exact = value === 0 ? x === 0 : Math.abs(value - x) / x <= 0.025;
    return { text: text, value: value, exact: exact };
  }

  // Express a volume (in teaspoons) the way a recipe would: cups when it's
  // at least ¼ cup, then tablespoons, then teaspoons.
  function formatVolume(tsp) {
    var unit, n;
    if (tsp >= 11.5) { unit = UNITS.cup; n = tsp / 48; }
    else if (tsp >= 2.9) { unit = UNITS.tbsp; n = tsp / 3; }
    else { unit = UNITS.tsp; n = tsp; }
    var fr = toFraction(n);
    if (fr.value === 0) return { text: 'less than ⅛ tsp', approx: true, unit: 'tsp', value: 0 };
    var label = fr.value > 1 ? unit.many : unit.one;
    return { text: fr.text + ' ' + label, approx: !fr.exact, unit: unit === UNITS.cup ? 'cup' : unit.one, value: fr.value };
  }

  function round(n, places) {
    var m = Math.pow(10, places);
    return Math.round(n * m) / m;
  }

  function formatGrams(g) {
    if (g >= 10) return String(Math.round(g)) + ' g';
    if (g >= 1) return String(round(g, 1)) + ' g';
    return String(round(g, 2)) + ' g';
  }

  function formatOunces(g) {
    var oz = g / G_PER_OZ;
    return String(oz >= 10 ? round(oz, 1) : round(oz, 2)).replace(/\.0+$/, '') + ' oz';
  }

  function formatMl(tsp) {
    var ml = tsp * ML_PER_TSP;
    return String(ml >= 10 ? Math.round(ml) : round(ml, 1)) + ' ml';
  }

  // ── Pans ──────────────────────────────────────────────────────────────────
  // Sizes in inches, measured across the top inside edge. Area drives the
  // conversion: same area means the same batter depth and a similar bake time.
  var PANS = [
    { id: 'r6', label: '6-inch round', shape: 'round', a: 6 },
    { id: 'r8', label: '8-inch round', shape: 'round', a: 8 },
    { id: 'r9', label: '9-inch round', shape: 'round', a: 9 },
    { id: 'r10', label: '10-inch round', shape: 'round', a: 10 },
    { id: 's8', label: '8×8 square', shape: 'rect', a: 8, b: 8 },
    { id: 's9', label: '9×9 square', shape: 'rect', a: 9, b: 9 },
    { id: 'p11x7', label: '11×7 rectangle', shape: 'rect', a: 11, b: 7 },
    { id: 'p9x13', label: '9×13 rectangle', shape: 'rect', a: 9, b: 13 },
    { id: 'p10x15', label: '10×15 jelly roll', shape: 'rect', a: 10, b: 15 },
    { id: 'p18x13', label: '18×13 half sheet', shape: 'rect', a: 18, b: 13 },
    { id: 'l85', label: '8½×4½ loaf', shape: 'rect', a: 8.5, b: 4.5 },
    { id: 'l9', label: '9×5 loaf', shape: 'rect', a: 9, b: 5 }
  ];
  var CM2_PER_IN2 = 6.4516;

  function panArea(shape, a, b) {
    if (shape === 'round') return Math.PI * a * a / 4;
    if (shape === 'square') return a * a;
    return a * b;
  }
  function panById(id) { for (var i = 0; i < PANS.length; i++) if (PANS[i].id === id) return PANS[i]; return null; }

  // Friendly multiplier text: 1.27 -> "1¼×" when within 3%, else "1.27×".
  function factorText(f) {
    var fr = toFraction(f);
    var near = Math.abs(fr.value - f) / f <= 0.03;
    return near && fr.text !== '0' ? fr.text + '×' : round(f, 2) + '×';
  }

  // What to tell the baker for a given area ratio (your pan ÷ recipe pan).
  // Within 10% the recipe works as written; the batter is just a little
  // deeper or thinner. Beyond that, scale it.
  function panAdvice(ratio) {
    var pct = Math.round((ratio - 1) * 100);
    var size = pct > 0 ? pct + '% bigger' : (-pct) + '% smaller';
    if (Math.abs(pct) <= 3) return { kind: 'same', main: 'Same recipe', note: 'The pans hold about the same, so use the recipe as written.' };
    if (Math.abs(pct) <= 10) return { kind: 'close', main: 'Same recipe', note: 'Your pan is ' + size + ', close enough to use the recipe as written. The batter will be a little ' + (pct > 0 ? 'thinner, so start checking a few minutes early.' : 'deeper, so it may need a few extra minutes.') };
    return { kind: 'scale', main: 'Make ' + factorText(ratio), note: 'Your pan is ' + size + '.' };
  }

  var api = {
    PANS: PANS,
    panArea: panArea,
    panById: panById,
    factorText: factorText,
    panAdvice: panAdvice,
    UNITS: UNITS,
    parseAmount: parseAmount,
    toGrams: toGrams,
    gramsToTsp: gramsToTsp,
    toFraction: toFraction,
    formatVolume: formatVolume,
    formatGrams: formatGrams,
    formatOunces: formatOunces,
    formatMl: formatMl,
    spoonsText: spoonsText,
    cToF: cToF,
    fToC: fToC,
    GAS: GAS,
    gasLabel: gasLabel,
    nearestGas: nearestGas
  };

  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.LCTKitchen = api;

  // ── Browser: live converter ────────────────────────────────────────────────
  function init(form) {
    var dataEl = document.getElementById('kitchen-data');
    if (!dataEl) return;
    var ingredients = JSON.parse(dataEl.textContent);
    var bySlug = {};
    ingredients.forEach(function (i) { bySlug[i.slug] = i; });

    var amountEl = form.querySelector('[name="amount"]');
    var unitEl = form.querySelector('[name="unit"]');
    var ingEl = form.querySelector('[name="ingredient"]');
    var mainEl = form.querySelector('[data-result-main]');
    var subEl = form.querySelector('[data-result-sub]');
    var errEl = form.querySelector('[data-result-error]');

    function render() {
      var amount = parseAmount(amountEl.value);
      var unit = unitEl.value;
      var ing = bySlug[ingEl.value];
      var bad = !(amount >= 0) || !isFinite(amount);
      amountEl.setAttribute('aria-invalid', bad ? 'true' : 'false');
      errEl.hidden = !bad;
      if (bad) { mainEl.textContent = '—'; subEl.textContent = ''; return; }

      var grams = toGrams(amount, unit, ing.gpc);
      var tsp = gramsToTsp(grams, ing.gpc);
      if (UNITS[unit].type === 'vol') {
        mainEl.textContent = formatGrams(grams);
        subEl.textContent = formatOunces(grams) + ' · ' + formatMl(tsp) + ' of ' + ing.lower;
      } else {
        var v = formatVolume(tsp);
        mainEl.textContent = (v.approx ? 'about ' : '') + v.text;
        var alt = [formatMl(tsp), formatGrams(grams) + ' of ' + ing.lower];
        // Under 4 cups, the tablespoon count helps people without a scale.
        if (v.unit === 'cup' && tsp < 48 * 4) alt.unshift(String(round(tsp / 3, 1)).replace(/\.0$/, '') + ' tbsp');
        subEl.textContent = alt.join(' · ');
      }
    }

    form.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
    render();
  }

  function setRows(form, rows) {
    var out = form.querySelector('[data-result-rows]');
    out.innerHTML = '';
    rows.forEach(function (r) {
      var dt = document.createElement('dt'); dt.textContent = r[0];
      var dd = document.createElement('dd'); dd.textContent = r[1];
      out.appendChild(dt); out.appendChild(dd);
    });
  }

  function badInput(form, el, bad) {
    el.setAttribute('aria-invalid', bad ? 'true' : 'false');
    form.querySelector('[data-result-error]').hidden = !bad;
    if (bad) { form.querySelector('[data-result-main]').textContent = '—'; setRows(form, []); }
  }

  // Volume only: cups, spoons, fl oz, ml.
  function initVolume(form) {
    var amountEl = form.querySelector('[name="amount"]');
    var unitEl = form.querySelector('[name="unit"]');
    var mainEl = form.querySelector('[data-result-main]');
    function render() {
      var n = parseAmount(amountEl.value);
      var bad = !(n >= 0) || !isFinite(n);
      badInput(form, amountEl, bad);
      if (bad) return;
      var tsp = n * UNITS[unitEl.value].tsp;
      var v = formatVolume(tsp);
      mainEl.textContent = unitEl.value === 'cup' ? spoonsText(tsp) : (v.approx ? 'about ' : '') + v.text;
      setRows(form, [
        ['Cups', (toFraction(tsp / 48).exact ? '' : 'about ') + toFraction(tsp / 48).text],
        ['Tablespoons', String(round(tsp / 3, 2))],
        ['Teaspoons', String(round(tsp, 2))],
        ['Fluid ounces', String(round(tsp / 6, 2))],
        ['Milliliters', formatMl(tsp)]
      ]);
    }
    form.addEventListener('input', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
    render();
  }

  // Butter: sticks and everything else. 1 stick = 8 tbsp = 113.4 g.
  function initButter(form) {
    var amountEl = form.querySelector('[name="amount"]');
    var unitEl = form.querySelector('[name="unit"]');
    var mainEl = form.querySelector('[data-result-main]');
    var G_PER_STICK = 453.592 / 4;
    var toG = { stick: G_PER_STICK, cup: G_PER_STICK * 2, tbsp: G_PER_STICK / 8, tsp: G_PER_STICK / 24, g: 1, oz: G_PER_OZ, lb: 453.592 };
    function render() {
      var n = parseAmount(amountEl.value);
      var bad = !(n >= 0) || !isFinite(n);
      badInput(form, amountEl, bad);
      if (bad) return;
      var g = n * toG[unitEl.value];
      var sticks = g / G_PER_STICK;
      var fr = toFraction(sticks);
      mainEl.textContent = unitEl.value === 'stick' ? formatGrams(g) : (fr.exact ? '' : 'about ') + fr.text + (fr.value === 1 ? ' stick' : ' sticks');
      setRows(form, [
        ['Sticks', (fr.exact ? '' : 'about ') + fr.text],
        ['Cups', (toFraction(sticks / 2).exact ? '' : 'about ') + toFraction(sticks / 2).text],
        ['Tablespoons', String(round(sticks * 8, 2))],
        ['Grams', formatGrams(g)],
        ['Ounces', formatOunces(g)]
      ]);
    }
    form.addEventListener('input', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
    render();
  }

  // Oven: °F, °C, gas mark, with a fan/convection adjustment.
  function initOven(form) {
    var tempEl = form.querySelector('[name="temp"]');
    var unitEl = form.querySelector('[name="unit"]');
    var fanEl = form.querySelector('[name="fan"]');
    var mainEl = form.querySelector('[data-result-main]');
    function render() {
      var n = unitEl.value === 'gas' ? parseAmount(tempEl.value) : parseFloat(String(tempEl.value).replace(',', '.'));
      var f;
      if (unitEl.value === 'gas') {
        var row = null;
        for (var i = 0; i < GAS.length; i++) if (GAS[i][0] === n) row = GAS[i];
        f = row ? row[1] : NaN;
      } else {
        f = unitEl.value === 'f' ? n : cToF(n);
      }
      var bad = !isFinite(f);
      badInput(form, tempEl, bad);
      if (bad) return;
      var c = fToC(f);
      var gas = nearestGas(f);
      var fanF = f - 25, fanC = c - 20;
      mainEl.textContent = unitEl.value === 'f' ? Math.round(c) + ' °C' : Math.round(f) + ' °F';
      var rows = [
        ['Fahrenheit', Math.round(f) + ' °F'],
        ['Celsius', Math.round(c) + ' °C'],
        ['Gas mark', gas ? gasLabel(gas[0]) : 'n/a']
      ];
      if (fanEl && fanEl.checked) rows.push(['Fan / convection', Math.round(fanF) + ' °F · ' + Math.round(fanC) + ' °C']);
      setRows(form, rows);
    }
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
    render();
  }

  // Pan size: compare two pans (or sets of pans) by area.
  function initPan(form) {
    var mainEl = form.querySelector('[data-result-main]');
    var errEl = form.querySelector('[data-result-error]');
    var noteEl = form.querySelector('[data-pan-note]');
    var linkEl = form.querySelector('[data-pan-scale]');
    var sides = ['from', 'to'].map(function (k) {
      var box = form.querySelector('[data-pan="' + k + '"]');
      return {
        box: box,
        pan: box.querySelector('[name="' + k + '-pan"]'),
        count: box.querySelector('[name="' + k + '-count"]'),
        custom: box.querySelector('[data-custom]'),
        a: box.querySelector('[name="' + k + '-a"]'),
        b: box.querySelector('[name="' + k + '-b"]'),
        bWrap: box.querySelector('[data-b]'),
        aLabel: box.querySelector('[data-a-label]'),
        unit: box.querySelector('[name="' + k + '-unit"]')
      };
    });

    function readSide(s) {
      var v = s.pan.value, shape, a, b, label;
      var isCustom = v.indexOf('custom-') === 0;
      s.custom.hidden = !isCustom;
      var count = parseAmount(s.count.value);
      var countBad = !(count >= 1 && count <= 12 && Math.round(count) === count);
      s.count.setAttribute('aria-invalid', countBad ? 'true' : 'false');
      if (isCustom) {
        shape = v.slice(7);
        s.bWrap.hidden = shape !== 'rect';
        s.aLabel.textContent = shape === 'round' ? 'Diameter' : shape === 'square' ? 'Side' : 'Length';
        var k = s.unit.value === 'cm' ? 1 / 2.54 : 1;
        a = parseAmount(s.a.value) * k;
        b = shape === 'rect' ? parseAmount(s.b.value) * k : a;
        var dimBad = !(a > 0 && isFinite(a)) || (shape === 'rect' && !(b > 0 && isFinite(b)));
        s.a.setAttribute('aria-invalid', !(a > 0) ? 'true' : 'false');
        if (s.b) s.b.setAttribute('aria-invalid', shape === 'rect' && !(b > 0) ? 'true' : 'false');
        if (dimBad || countBad) return null;
        label = 'your custom pan';
      } else {
        var p = panById(v);
        if (!p || countBad) return null;
        shape = p.shape; a = p.a; b = p.b; label = p.label;
      }
      return { area: panArea(shape, a, b) * count, count: count, label: label };
    }

    function sq(n) { return round(n, 1) + ' sq in'; }

    function render() {
      var from = readSide(sides[0]), to = readSide(sides[1]);
      var bad = !from || !to;
      errEl.hidden = !bad;
      if (bad) { mainEl.textContent = '—'; setRows(form, []); noteEl.textContent = ''; linkEl.hidden = true; return; }
      var ratio = to.area / from.area;
      var adv = panAdvice(ratio);
      mainEl.textContent = adv.main;
      var depth = from.area / to.area;
      var rows = [
        ['Recipe pan', sq(from.area)],
        ['Your pan', sq(to.area)],
        ['Multiply by', '×' + round(ratio, 2)]
      ];
      if (adv.kind !== 'same') rows.push(['Batter as written', Math.round(Math.abs(depth - 1) * 100) + '% ' + (depth > 1 ? 'deeper' : 'thinner')]);
      setRows(form, rows);
      var tip = '';
      if (adv.kind === 'scale') tip = ' Scaled to fit, the batter stays the same depth, so keep the temperature and start checking at the recipe’s time. ' +
        (depth > 1.25 ? 'As written, the full recipe would likely overfill the pan, so scale it down or bake the extra batter as cupcakes.'
          : depth > 1 ? 'If you use the recipe as written instead, the deeper batter needs longer: lower the oven by 25 °F and bake until a tester comes out clean.'
          : 'If you use the recipe as written instead, the thinner layer bakes faster: start checking about two thirds of the way through the time.');
      if (to.count > 1) adv = { kind: adv.kind, main: adv.main, note: adv.note.replace('Your pan is', 'Your pans are') };
      noteEl.textContent = adv.note + tip;
      var showLink = adv.kind !== 'same';
      linkEl.hidden = !showLink;
      if (showLink) {
        var f = String(round(ratio, 2));
        linkEl.href = '/kitchen/recipe-scaler/?factor=' + f;
        linkEl.textContent = 'Scale your recipe by ' + f + '× →';
      }
    }
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
    render();
  }

  function boot() {
    var forms = document.querySelectorAll('[data-kitchen-converter]');
    for (var i = 0; i < forms.length; i++) init(forms[i]);
    var each = function (sel, fn) { var f = document.querySelectorAll(sel); for (var j = 0; j < f.length; j++) fn(f[j]); };
    each('[data-volume-converter]', initVolume);
    each('[data-butter-converter]', initButter);
    each('[data-oven-converter]', initOven);
    each('[data-pan-converter]', initPan);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : this);
