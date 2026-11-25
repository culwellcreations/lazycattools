/* Lazy Cat Tools — recipe reader, scaler and converter.
   Needs kitchen-converter.js loaded first (window.LCTKitchen in the browser,
   require() in Node for the tests). Everything runs locally; nothing pasted
   here leaves the page. */
(function (root) {
  'use strict';

  var K = (typeof module === 'object' && module.exports) ? require('./kitchen-converter.js') : root.LCTKitchen;

  var VULG = '¼½¾⅓⅔⅛⅜⅝⅞';
  var NUM = '(?:\\d+\\s+\\d+\\/\\d+|\\d+\\s*[' + VULG + ']|\\d+\\/\\d+|\\d*\\.\\d+|\\d+|[' + VULG + '])';
  var QTY_RE = new RegExp('^(' + NUM + ')(?:\\s*(?:-|–|to)\\s*(' + NUM + '))?');

  // [unit id, spellings]. Single letters only count when nothing follows but
  // a space, a period or the end. Capital T is tablespoon, small t teaspoon.
  var UNIT_WORDS = [
    ['floz', ['fluid ounces', 'fluid ounce', 'fl. oz.', 'fl. oz', 'fl oz', 'floz']],
    ['cup', ['cups', 'cup', 'c']],
    ['tbsp', ['tablespoons', 'tablespoon', 'tbsps', 'tbsp', 'tbls', 'tbl', 'tbs', 'T']],
    ['tsp', ['teaspoons', 'teaspoon', 'tsps', 'tsp', 't']],
    ['oz', ['ounces', 'ounce', 'oz']],
    ['lb', ['pounds', 'pound', 'lbs', 'lb']],
    ['kg', ['kilograms', 'kilogram', 'kilos', 'kilo', 'kg']],
    ['g', ['grams', 'gram', 'gr', 'g']],
    ['ml', ['milliliters', 'millilitres', 'milliliter', 'millilitre', 'ml']],
    ['l', ['liters', 'litres', 'liter', 'litre', 'l']],
    ['stick', ['sticks', 'stick']]
  ];
  var CASE_SENSITIVE = { T: true, t: true };

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function matchUnit(s) {
    for (var i = 0; i < UNIT_WORDS.length; i++) {
      var words = UNIT_WORDS[i][1];
      for (var j = 0; j < words.length; j++) {
        var w = words[j];
        var re = new RegExp('^' + escRe(w) + '\\.?(?![a-z])', CASE_SENSITIVE[w] ? '' : 'i');
        var m = s.match(re);
        if (m) return { unit: UNIT_WORDS[i][0], length: m[0].length };
      }
    }
    return null;
  }

  // Words that, right before a generic name, mean it's a different ingredient.
  var NOT_GENERIC = {
    flour: /(rice|coconut|oat|rye|spelt|chickpea|corn|tapioca|potato|buckwheat|self[- ]rising|self[- ]raising|gluten[- ]free|semolina|bread|cake|almond|wheat|wholemeal|strong|plain|purpose|ap)\s+$/,
    sugar: /(coconut|maple|sanding|pearl|turbinado|demerara|raw|vanilla|brown|powdered|confectioners'?|icing|granulated|white|caster|superfine|cane)\s+$/,
    rice: /(cooked|uncooked|white|long[- ]grain|wild|brown)\s+$/,
    oats: /(steel[- ]cut|quick|rolled|old[- ]fashioned)\s+$/,
    salt: /(kosher|flaky|sea|garlic|onion|celery|seasoned|table|fine)\s+$/,
    milk: /(coconut|almond|oat|soy|rice|condensed|evaporated|whole|skim|2%)\s+$/,
    oil: /(coconut|sesame|truffle|chili|vegetable|canola|olive|sunflower|neutral)\s+$/,
    butter: /(peanut|almond|cashew|apple|nut|cocoa|unsalted|salted)\s+$/
  };
  var NOT_AFTER = { rice: /^\s*(flour|vinegar|krispies|cereal|paper|noodles)/, flour: /^\s*tortilla/, oats: /^\s*flour/ };

  function makeMatcher(ingredients) {
    var list = [];
    ingredients.forEach(function (ing) {
      (ing.aliases || []).forEach(function (a) { list.push({ alias: a.toLowerCase(), ing: ing }); });
    });
    list.sort(function (x, y) { return y.alias.length - x.alias.length; });
    return function (text) {
      var t = ' ' + text.toLowerCase() + ' ';
      for (var i = 0; i < list.length; i++) {
        var a = list[i].alias;
        var re = new RegExp('(^|[^a-z])' + escRe(a) + '(?![a-z])', 'g');
        var m;
        while ((m = re.exec(t))) {
          var start = m.index + m[1].length;
          var before = t.slice(0, start), after = t.slice(start + a.length);
          if (NOT_GENERIC[a] && NOT_GENERIC[a].test(before)) continue;
          if (NOT_AFTER[a] && NOT_AFTER[a].test(after)) continue;
          return list[i].ing;
        }
      }
      return null;
    };
  }

  // Splits one recipe line into quantity, unit and the rest.
  function parseLine(line) {
    var original = line;
    var s = line.replace(/^\s*(?:[-•*·]\s+|\d+[.)]\s+(?=[\d¼½¾⅓⅔⅛⅜⅝⅞]))/, '');
    var lead = line.slice(0, line.length - s.length);
    s = s.trim();
    var m = s.match(QTY_RE);
    if (!m) return { original: original, lead: lead, qty: null };
    var qty = K.parseAmount(m[1]);
    var qtyMax = m[2] ? K.parseAmount(m[2]) : null;
    var rest = s.slice(m[0].length).replace(/^\s+/, '');
    var unit = null;
    var u = matchUnit(rest);
    if (u) {
      unit = u.unit;
      rest = rest.slice(u.length).replace(/^\s+/, '').replace(/^of\s+/i, '');
    }
    return { original: original, lead: lead, qty: qty, qtyMax: qtyMax, unit: unit, rest: rest };
  }

  function round(n, p) { var m = Math.pow(10, p); return Math.round(n * m) / m; }

  function countText(n) {
    var f = K.toFraction(n);
    return f.exact ? f.text : String(round(n, 2));
  }

  // A volume in teaspoons, in the unit a recipe would use, without rounding
  // more than about 2.5%. When cups can't say it exactly, fall back to spoons.
  function volumeText(tsp) {
    var v = K.formatVolume(tsp);
    // Eighths of a cup (⅛ ⅜ ⅝ ⅞) aren't on most measuring sets: say them in
    // tablespoons, or as the cup amount below plus 2 tbsp.
    if (!v.approx && v.unit === 'cup' && /[⅛⅜⅝⅞]/.test(v.text)) {
      if (v.value < 1) return Math.round(v.value * 16) + ' tbsp';
      return volumeText((v.value - 0.125) * 48) + ' + 2 tbsp';
    }
    if (!v.approx) return v.text;
    var tb = K.toFraction(tsp / 3);
    if (tsp >= 3 && tb.exact && tsp < 48) return tb.text + ' tbsp';
    if (tsp < 24) return K.spoonsText(tsp);
    return 'about ' + v.text;
  }

  // Quantity + unit, tidied for a recipe card.
  function amountText(qty, unit) {
    var U = K.UNITS;
    if (unit === 'cup' || unit === 'tbsp' || unit === 'tsp') return volumeText(qty * U[unit].tsp);
    if (unit === 'floz') return countText(qty) + ' fl oz';
    if (unit === 'ml') return (qty >= 10 ? Math.round(qty) : round(qty, 1)) + ' ml';
    if (unit === 'l') return round(qty, 2) + (qty === 1 ? ' liter' : ' liters');
    if (unit === 'g') return (qty >= 10 ? Math.round(qty) : round(qty, 1)) + ' g';
    if (unit === 'kg') return round(qty, 2) + ' kg';
    if (unit === 'oz') return round(qty, 1) + ' oz';
    if (unit === 'lb') return round(qty, 2) + ' lb';
    if (unit === 'stick') return countText(qty) + (qty === 1 ? ' stick' : ' sticks');
    return countText(qty);
  }

  // Scale numbers in brackets like "(120 g)" along with the main amount.
  function scaleInline(rest, factor) {
    return rest.replace(/\((\d+(?:\.\d+)?)\s*(g|grams|ml|oz|kg|lb)\)/gi, function (all, n, u) {
      var v = parseFloat(n) * factor;
      return '(' + (v >= 10 ? Math.round(v) : round(v, 1)) + ' ' + u + ')';
    });
  }

  // Counted things: "2 eggs" halved is "1 egg", "1 egg" doubled is "2 eggs".
  var COUNTED = ['egg', 'yolk', 'white', 'clove', 'banana', 'lemon', 'lime', 'orange', 'apple', 'onion', 'carrot',
    'can', 'package', 'packet', 'sheet', 'slice', 'piece', 'stalk', 'sprig', 'potato', 'tomato'];
  var ES = { potato: 1, tomato: 1 };
  function fixPlural(rest, before, after) {
    var single = after <= 1, wasSingle = before <= 1;
    if (single === wasSingle) return rest;
    for (var i = 0; i < COUNTED.length; i++) {
      var w = COUNTED[i], pl = w + (ES[w] ? 'es' : 's');
      var re = new RegExp('^((?:\\S+\\s+){0,2}?)(' + (single ? pl : w) + ')\\b', 'i');
      if (re.test(rest)) return rest.replace(re, function (m, pre) { return pre + (single ? w : pl); });
    }
    return rest;
  }

  function joinLine(p, amount, rest) {
    return (p.lead || '') + [amount, rest].filter(Boolean).join(' ');
  }

  function scaleLine(line, factor) {
    var p = parseLine(line);
    if (!line.trim()) return { text: '', status: 'blank' };
    if (p.qty == null || !isFinite(p.qty)) return { text: line, status: 'unchanged' };
    var amt = amountText(p.qty * factor, p.unit);
    if (p.qtyMax != null && isFinite(p.qtyMax)) {
      var hi = amountText(p.qtyMax * factor, p.unit);
      var lo = p.unit ? amountText(p.qty * factor, p.unit).replace(/\s.*$/, '') : amt;
      amt = lo + '–' + hi;
    }
    var rest = scaleInline(p.rest, factor);
    if (!p.unit) rest = fixPlural(rest, p.qtyMax != null ? p.qtyMax : p.qty, (p.qtyMax != null ? p.qtyMax : p.qty) * factor);
    return { text: joinLine(p, amt, rest), status: 'scaled' };
  }

  var BUTTER_G_PER_STICK = 453.592 / 4;

  function convertLine(line, target, match) {
    var p = parseLine(line);
    if (!line.trim()) return { text: '', status: 'blank' };
    if (p.qty == null || !isFinite(p.qty) || !p.unit) return { text: line, status: 'unchanged' };
    var U = K.UNITS;
    var ing = match(p.rest);
    var isVol = p.unit === 'stick' || (U[p.unit] && U[p.unit].type === 'vol');
    var isWt = U[p.unit] && U[p.unit].type === 'wt';
    var range = p.qtyMax != null && isFinite(p.qtyMax);
    var orig = range ? countText(p.qty) + '–' + amountText(p.qtyMax, p.unit) : amountText(p.qty, p.unit);
    // Drop an existing "(120 g)" style note; the converted amount replaces it.
    var rest = p.rest.replace(/^\(\s*[\d.\/¼½¾⅓⅔⅛⅜⅝⅞ ]+\s*(g|grams|ml|oz|cups?|tbsp|tsp)\s*\)\s*/i, '');

    if (target === 'grams' && isVol) {
      if (!ing && !(p.unit === 'stick')) return { text: line, status: 'unmatched', note: 'No weight on file for this ingredient, so it was left as is.' };
      var toG = function (q) { return p.unit === 'stick' ? q * BUTTER_G_PER_STICK : K.toGrams(q, p.unit, ing.gpc); };
      var gText = range ? K.formatGrams(toG(p.qty)).replace(' g', '') + '–' + K.formatGrams(toG(p.qtyMax)) : K.formatGrams(toG(p.qty));
      return { text: joinLine(p, gText, rest + ' (' + orig + ')'), status: 'converted', ing: ing && ing.lower };
    }
    if (target === 'cups' && isWt) {
      if (!ing) return { text: line, status: 'unmatched', note: 'No weight on file for this ingredient, so it was left as is.' };
      var toV = function (q) { return volumeText(K.gramsToTsp(q * U[p.unit].g, ing.gpc)); };
      var vText = range ? toV(p.qty) + '–' + toV(p.qtyMax) : toV(p.qty);
      return { text: joinLine(p, vText, rest + ' (' + orig + ')'), status: 'converted', ing: ing.lower };
    }
    return { text: line, status: 'unchanged' };
  }

  var api = { parseLine: parseLine, makeMatcher: makeMatcher, scaleLine: scaleLine, convertLine: convertLine, amountText: amountText };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.LCTRecipe = api;

  // ── Browser UI ─────────────────────────────────────────────────────────────
  var EXAMPLE = [
    '2 1/4 cups all-purpose flour',
    '1 tsp baking soda',
    '1 tsp salt',
    '1 cup butter, softened',
    '3/4 cup granulated sugar',
    '3/4 cup packed brown sugar',
    '2 large eggs',
    '2 tsp vanilla extract',
    '2 cups chocolate chips'
  ].join('\n');

  function renderOutput(listEl, results) {
    listEl.innerHTML = '';
    results.forEach(function (r) {
      if (r.status === 'blank') return;
      var li = document.createElement('li');
      li.className = 'r-' + r.status;
      var span = document.createElement('span');
      span.textContent = r.text;
      li.appendChild(span);
      if (r.status === 'unmatched') {
        var note = document.createElement('small');
        note.textContent = r.note;
        li.appendChild(note);
      }
      listEl.appendChild(li);
    });
  }

  function wireCommon(tool, run) {
    var input = tool.querySelector('[name="recipe"]');
    var copyBtn = tool.querySelector('[data-copy]');
    var exampleBtn = tool.querySelector('[data-example]');
    var listEl = tool.querySelector('[data-recipe-out]');
    var emptyEl = tool.querySelector('[data-recipe-empty]');
    var statusEl = tool.querySelector('[data-copy-status]');
    var last = [];
    function update() {
      var lines = input.value.split(/\r?\n/);
      last = input.value.trim() ? run(lines) : [];
      emptyEl.hidden = last.length > 0;
      renderOutput(listEl, last);
    }
    tool.addEventListener('input', update);
    tool.addEventListener('change', update);
    exampleBtn.addEventListener('click', function () { input.value = EXAMPLE; update(); input.focus(); });
    copyBtn.addEventListener('click', function () {
      var text = last.filter(function (r) { return r.status !== 'blank'; }).map(function (r) { return r.text; }).join('\n');
      if (!text) return;
      var done = function () { statusEl.textContent = 'Copied.'; setTimeout(function () { statusEl.textContent = ''; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { statusEl.textContent = 'Copy failed. Select the text and copy it instead.'; });
    });
    tool.addEventListener('submit', function (e) { e.preventDefault(); update(); });
    return update;
  }

  function initScaler(tool) {
    var factorEl = tool.querySelector('[name="factor"]');
    var makesEl = tool.querySelector('[name="makes"]');
    var needEl = tool.querySelector('[name="need"]');
    var errEl = tool.querySelector('[data-factor-error]');
    var quick = tool.querySelectorAll('[data-factor]');
    function factor() {
      var mk = K.parseAmount(makesEl.value), nd = K.parseAmount(needEl.value);
      if (mk > 0 && nd > 0) return nd / mk;
      return K.parseAmount(factorEl.value);
    }
    var update = wireCommon(tool, function (lines) {
      var f = factor();
      var ok = f > 0 && isFinite(f);
      errEl.hidden = ok;
      factorEl.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok) return [];
      return lines.map(function (l) { return scaleLine(l, f); });
    });
    for (var i = 0; i < quick.length; i++) {
      quick[i].addEventListener('click', function (e) {
        factorEl.value = e.currentTarget.getAttribute('data-factor');
        makesEl.value = ''; needEl.value = '';
        for (var j = 0; j < quick.length; j++) quick[j].setAttribute('aria-pressed', String(quick[j] === e.currentTarget));
        update();
      });
    }
    factorEl.addEventListener('input', function () { makesEl.value = ''; needEl.value = ''; });
    update();
  }

  function initConverter(tool) {
    var data = JSON.parse(document.getElementById('kitchen-data').textContent);
    var match = makeMatcher(data);
    wireCommon(tool, function (lines) {
      var target = tool.querySelector('[name="target"]:checked').value;
      return lines.map(function (l) { return convertLine(l, target, match); });
    })();
  }

  function boot() {
    var s = document.querySelectorAll('[data-recipe-scaler]');
    for (var i = 0; i < s.length; i++) initScaler(s[i]);
    var c = document.querySelectorAll('[data-recipe-converter]');
    for (var j = 0; j < c.length; j++) initConverter(c[j]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : this);
