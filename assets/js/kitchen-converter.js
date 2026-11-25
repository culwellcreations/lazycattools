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
    ml:   { type: 'vol', tsp: 1 / ML_PER_TSP, one: 'ml', many: 'ml' },
    g:    { type: 'wt', g: 1, one: 'g', many: 'g' },
    oz:   { type: 'wt', g: G_PER_OZ, one: 'oz', many: 'oz' }
  };

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

  var api = {
    UNITS: UNITS,
    parseAmount: parseAmount,
    toGrams: toGrams,
    gramsToTsp: gramsToTsp,
    toFraction: toFraction,
    formatVolume: formatVolume,
    formatGrams: formatGrams,
    formatOunces: formatOunces,
    formatMl: formatMl
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

  function boot() {
    var forms = document.querySelectorAll('[data-kitchen-converter]');
    for (var i = 0; i < forms.length; i++) init(forms[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : this);
