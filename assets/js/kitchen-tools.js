/* Lazy Cat Tools — kitchen tools, part 2
   Air fryer, meat temperatures, coffee, rice, substitutions, cup fractions,
   pressure cooker times and turkey. Same pattern as kitchen-converter.js: the
   build script requires this file for the chart tables, the tests require it
   for the math, and the browser runs it for the live tools. All numbers that
   come from a source are in the data at the top, with the source named. */
(function (root) {
  'use strict';

  var K = (typeof module === 'object' && module.exports) ? require('./kitchen-converter.js') : root.LCTKitchen;

  // ── Formatting ─────────────────────────────────────────────────────────────

  // 80 -> "1 hour 20 minutes", 45 -> "45 minutes", 120 -> "2 hours"
  function duration(min) {
    min = Math.round(min);
    var h = Math.floor(min / 60), m = min % 60, out = [];
    if (h) out.push(h + (h === 1 ? ' hour' : ' hours'));
    if (m || !h) out.push(m + (m === 1 ? ' minute' : ' minutes'));
    return out.join(' ');
  }
  function durationRange(lo, hi) {
    lo = Math.round(lo); hi = Math.round(hi);
    return lo === hi ? 'about ' + duration(lo) : 'about ' + duration(lo) + ' to ' + duration(hi);
  }
  // Hours as the USDA writes them: 3.75 -> "3¾ hours"
  function hoursText(h) {
    var fr = K.toFraction(h);
    return fr.text + (fr.value === 1 ? ' hour' : ' hours');
  }
  // [3, 3.75] -> "3 to 3¾ hours"
  function hoursRange(h) {
    if (h[0] === h[1]) return hoursText(h[0]);
    return K.toFraction(h[0]).text + ' to ' + hoursText(h[1]);
  }
  function fmtNum(n, places) {
    var m = Math.pow(10, places || 0);
    return String(Math.round(n * m) / m);
  }
  function cups(n) {
    var fr = K.toFraction(n);
    return (fr.exact ? '' : 'about ') + fr.text + (fr.value > 1 ? ' cups' : ' cup');
  }

  // ── 1. Air fryer ───────────────────────────────────────────────────────────
  // Rule of thumb used by air fryer makers and recipe sites: 25 °F (about
  // 15 °C) cooler and about 20% less time. Going back is the inverse.
  function airFryer(temp, unit, minutes, direction) {
    var toAir = direction !== 'to-oven';
    var step = unit === 'c' ? 15 : 25;
    var t = toAir ? temp - step : temp + step;
    var time = Math.max(1, Math.round(toAir ? minutes * 0.8 : minutes * 1.25));
    return { temp: t, unit: unit, minutes: time };
  }

  // ── 2. Meat temperatures ───────────────────────────────────────────────────
  // Temperatures and rest times: FoodSafety.gov "Safe Minimum Internal
  // Temperature Chart" (reviewed Nov 21, 2024). Roasting estimates are minutes
  // per pound in a 325 °F oven and are rough; the thermometer decides.
  var MEATS = [
    { id: 'beef-roast', label: 'Beef roast', f: 145, c: 63, rest: 3, perLb: [20, 25], note: 'Medium-rare to medium.' },
    { id: 'pork-roast', label: 'Pork roast', f: 145, c: 63, rest: 3, perLb: [20, 25] },
    { id: 'chicken-whole', label: 'Whole chicken', f: 165, c: 74, rest: 0, perLb: [20, 20], note: 'Check the thickest part of the thigh, not touching bone.' },
    { id: 'turkey-whole', label: 'Whole turkey', f: 165, c: 74, rest: 0, turkey: true },
    { id: 'ham-cooked', label: 'Ham, fully cooked, bone-in (to reheat)', f: 140, c: 60, rest: 0, perLb: [15, 18], note: '140 °F is for hams packaged in USDA-inspected plants. Reheat any other cooked ham, and leftovers, to 165 °F.' },
    { id: 'ham-raw', label: 'Ham, fresh (raw)', f: 145, c: 63, rest: 3 },
    { id: 'steak', label: 'Steaks and chops (beef, pork, lamb, veal)', f: 145, c: 63, rest: 3 },
    { id: 'ground', label: 'Ground meat and sausage (burgers)', f: 160, c: 71, rest: 0 },
    { id: 'poultry-pieces', label: 'Chicken or turkey pieces, ground poultry', f: 165, c: 74, rest: 0 },
    { id: 'fish', label: 'Fish', f: 145, c: 63, rest: 0, note: 'Or cook until the flesh is no longer see-through and flakes easily with a fork.' }
  ];
  function meatById(id) { for (var i = 0; i < MEATS.length; i++) if (MEATS[i].id === id) return MEATS[i]; return null; }

  // ── 8. Turkey (also used by the meat tool) ────────────────────────────────
  // USDA roasting timetable for a fresh or thawed whole turkey at 325 °F, in
  // hours (as reprinted by University of Illinois Extension).
  var TURKEY = [
    { from: 8, to: 12, unstuffed: [2.75, 3], stuffed: [3, 3.5] },
    { from: 12, to: 14, unstuffed: [3, 3.75], stuffed: [3.5, 4] },
    { from: 14, to: 18, unstuffed: [3.75, 4.25], stuffed: [4, 4.25] },
    { from: 18, to: 20, unstuffed: [4.25, 4.5], stuffed: [4.25, 4.75] },
    { from: 20, to: 24, unstuffed: [4.5, 5], stuffed: [4.75, 5.25] }
  ];
  var TURKEY_REST = 20; // minutes, USDA
  function turkey(lb, stuffed) {
    if (!(lb >= 8 && lb <= 24)) return null;
    var band = TURKEY[TURKEY.length - 1];
    for (var i = 0; i < TURKEY.length; i++) if (lb <= TURKEY[i].to) { band = TURKEY[i]; break; }
    var h = stuffed ? band.stuffed : band.unstuffed;
    return { band: band, hours: h, minutes: [h[0] * 60, h[1] * 60], thawDays: Math.ceil(lb / 4) };
  }

  function meat(id, lb) {
    var m = meatById(id);
    if (!m) return null;
    var out = { meat: m, time: null };
    if (m.turkey && lb > 0) {
      var t = turkey(lb, false);
      if (t) out.time = t.minutes;
    } else if (m.perLb && lb > 0) {
      // Rounded to 5 minutes: these are estimates, not timers.
      out.time = [Math.round(m.perLb[0] * lb / 5) * 5, Math.round(m.perLb[1] * lb / 5) * 5];
    }
    return out;
  }

  // ── 3. Coffee ──────────────────────────────────────────────────────────────
  // Ratios are grams of coffee to grams of water. A level tablespoon of ground
  // coffee is about 5 g (references give 5 to 6 g; a heaped one is nearer 7).
  var BREWS = [
    { id: 'pour', label: 'Drip / pour over', ratio: 16 },
    { id: 'press', label: 'French press', ratio: 14 },
    { id: 'cold', label: 'Cold brew (concentrate)', ratio: 8 },
    { id: 'espresso', label: 'Espresso', ratio: 2 }
  ];
  var G_PER_TBSP_COFFEE = 5;
  var ESPRESSO_DOSE = 18; // grams per shot (a standard double basket)
  function coffee(id, count, cupMl) {
    var b = null;
    for (var i = 0; i < BREWS.length; i++) if (BREWS[i].id === id) b = BREWS[i];
    if (!b || !(count > 0)) return null;
    var coffeeG, waterG;
    if (b.id === 'espresso') { coffeeG = ESPRESSO_DOSE * count; waterG = coffeeG * b.ratio; }
    else { if (!(cupMl > 0)) return null; waterG = count * cupMl; coffeeG = waterG / b.ratio; }
    return { brew: b, coffee: coffeeG, water: waterG, tbsp: coffeeG / G_PER_TBSP_COFFEE };
  }

  // ── 4. Rice ────────────────────────────────────────────────────────────────
  // Stovetop: cups of water per cup of dry rice, by volume. Instant Pot: the
  // Instant Pot manual's 1:1 grain-to-water ratio for white and brown rice,
  // with pressure times from the cooking-times table on this site.
  var RICE = [
    { id: 'white', label: 'White long-grain', water: 1.5, time: '15 to 18 minutes', ip: { water: 1, time: '4 minutes, then 10 minutes natural release' } },
    { id: 'jasmine', label: 'Jasmine', water: 1.5, time: '15 minutes', rinse: true, ip: { water: 1, time: '4 minutes, then 10 minutes natural release' } },
    { id: 'basmati', label: 'Basmati', water: 1.5, time: '15 minutes', rinse: true, ip: { water: 1, time: '4 minutes, then 10 minutes natural release' } },
    { id: 'brown', label: 'Brown rice', water: 2.5, time: '40 to 45 minutes', ip: { water: 1, time: '22 minutes, then 10 minutes natural release' } },
    { id: 'wild', label: 'Wild rice', water: 3, time: '45 to 55 minutes', ip: null },
    { id: 'sushi', label: 'Sushi rice', water: 1.2, time: '15 minutes', rinse: true, ip: { water: 1, time: '4 minutes, then 10 minutes natural release' } }
  ];
  function rice(id, dryCups, cooker) {
    var r = null;
    for (var i = 0; i < RICE.length; i++) if (RICE[i].id === id) r = RICE[i];
    if (!r || !(dryCups > 0)) return null;
    if (cooker === 'ip') {
      if (!r.ip) return { rice: r, cooker: cooker, unsupported: true };
      return { rice: r, cooker: cooker, ratio: r.ip.water, water: dryCups * r.ip.water, time: r.ip.time };
    }
    return { rice: r, cooker: cooker, ratio: r.water, water: dryCups * r.water, time: cooker === 'cooker' ? 'until the cooker switches to warm' : r.time };
  }

  // ── 5. Substitutions ───────────────────────────────────────────────────────
  // Eggs: Hershey's "Common Baking Ingredient Substitutes" (1 egg = ¼ cup
  // applesauce = ¼ cup mashed banana = 1 tbsp ground flax + 3 tbsp water).
  function eggSub(n) {
    return { applesauceCups: n / 4, bananaCups: n / 4, flaxTbsp: n, waterTbsp: n * 3 };
  }
  // Honey: ¾ cup honey for each cup of sugar. National Honey Board tips, per
  // cup of honey used: cut other liquid by ¼ cup, add ½ tsp baking soda,
  // and bake 25 °F lower.
  function honeyForSugar(sugarCups) {
    var honey = sugarCups * 0.75;
    return { honeyCups: honey, liquidCups: honey / 4, sodaTsp: honey / 2 };
  }
  function sugarForHoney(honeyCups) {
    return { sugarCups: honeyCups / 0.75, liquidCups: honeyCups / 4 };
  }
  // Cocoa for unsweetened chocolate: 3 tbsp natural cocoa + 1 tbsp fat per ounce.
  function cocoaForChocolate(oz) { return { cocoaTbsp: oz * 3, fatTbsp: oz }; }
  // Salt by weight per teaspoon. Table 6 g (as on this site's salt page and
  // King Arthur's chart: 18 g per tbsp); Morton kosher 4.8 g (Morton's chart:
  // 1 tsp table = 1¼ tsp kosher); Diamond Crystal kosher 2.7 g (King Arthur:
  // 8 g per tbsp).
  var SALTS = [
    { id: 'table', label: 'Table salt', short: 'table salt', gPerTsp: 6 },
    { id: 'morton', label: 'Morton kosher salt', short: 'Morton kosher', gPerTsp: 4.8 },
    { id: 'diamond', label: 'Diamond Crystal kosher salt', short: 'Diamond Crystal', gPerTsp: 8 / 3 }
  ];
  function saltById(id) { for (var i = 0; i < SALTS.length; i++) if (SALTS[i].id === id) return SALTS[i]; return null; }
  function salt(tsp, from, to) {
    var a = saltById(from), b = saltById(to);
    if (!a || !b || !(tsp >= 0)) return null;
    var grams = tsp * a.gPerTsp;
    return { grams: grams, tsp: grams / b.gPerTsp };
  }

  // ── 6. Cup fractions ───────────────────────────────────────────────────────
  // Snap to a real measuring-cup amount when the number is within 2% of one
  // (0.33 -> ⅓ cup), otherwise round to the nearest ⅛ teaspoon.
  var CUP_PARTS = [[3 / 4, '¾'], [2 / 3, '⅔'], [1 / 2, '½'], [1 / 3, '⅓'], [1 / 4, '¼'], [1 / 8, '⅛']];
  function cupFraction(n) {
    if (!(n > 0) || n > 100) return null;
    var tsp = n * 48;
    var whole = Math.floor(n + 1e-9);
    var candidates = [whole, whole + 1];
    for (var i = 0; i < CUP_PARTS.length; i++) candidates.push(whole + CUP_PARTS[i][0]);
    var snapped = false;
    for (var j = 0; j < candidates.length; j++) {
      var c = candidates[j];
      if (c > 0 && Math.abs(c - n) <= 0.02 * n) { tsp = c * 48; snapped = true; break; }
    }
    if (!snapped) tsp = Math.round(tsp * 8) / 8;
    // Largest whole cups + one measuring cup that fits, then spoons.
    var cupsWhole = Math.floor(tsp / 48 + 1e-9);
    var rest = tsp - cupsWhole * 48;
    var part = null;
    for (var k = 0; k < CUP_PARTS.length; k++) {
      if (CUP_PARTS[k][0] * 48 <= rest + 1e-9) { part = CUP_PARTS[k]; break; }
    }
    var restAfter = rest - (part ? part[0] * 48 : 0);
    var cupText = (cupsWhole ? String(cupsWhole) : '') + (part ? part[1] : '');
    var cupWord = (cupsWhole + (part ? part[0] : 0)) > 1 ? 'cups' : 'cup';
    var measure = [];
    if (cupText) measure.push(cupText + ' ' + cupWord);
    if (restAfter > 1e-9) measure.push(K.spoonsText(restAfter));
    return {
      tsp: tsp,
      snapped: snapped,
      exactCup: restAfter < 1e-9,
      measure: measure.join(' + ') || K.spoonsText(tsp),
      spoons: K.spoonsText(tsp),
      ml: K.formatMl(tsp)
    };
  }

  // ── 7. Pressure cooker times ───────────────────────────────────────────────
  // src 'manual': Instant Pot Duo Evo Plus user manual, "Pressure Cooking
  // Timetable" and "Recommended Cooking Times" (high pressure).
  // src 'common': widely used recipe times, not in that manual; marked on the page.
  // perLb: minutes per pound, for the weight calculator.
  // Release: 'quick', 'nr10' (natural 10 min, then quick), 'nr15', 'natural' (full).
  var PRESSURE = [
    // Poultry
    { food: 'Chicken breasts (boneless)', size: 'Fresh, per lb', min: [6, 8], perLb: [6, 8], release: 'nr10', cat: 'poultry', src: 'manual' },
    { food: 'Whole chicken', size: 'Fresh, per lb', min: [8, 8], perLb: [8, 8], release: 'nr15', cat: 'poultry', src: 'manual' },
    { food: 'Chicken thighs (bone-in)', size: 'Fresh', min: [12, 15], release: 'nr10', cat: 'poultry', src: 'common' },
    { food: 'Chicken bone broth', size: 'Bones covered in water', min: [40, 50], release: 'natural', cat: 'poultry', src: 'manual' },
    // Meat
    { food: 'Beef stew meat', size: 'Cubes, per lb', min: [20, 20], perLb: [20, 20], release: 'nr10', cat: 'meat', src: 'manual' },
    { food: 'Beef, large pieces (chuck, pot roast)', size: 'Per lb', min: [20, 25], perLb: [20, 25], release: 'nr10', cat: 'meat', src: 'manual' },
    { food: 'Beef ribs', size: 'Per lb', min: [20, 25], perLb: [20, 25], release: 'nr10', cat: 'meat', src: 'manual' },
    { food: 'Ground beef', size: '1 lb, frozen block', min: [20, 20], release: 'quick', cat: 'meat', src: 'common' },
    { food: 'Pork butt / shoulder roast', size: 'Per lb', min: [15, 15], perLb: [15, 15], release: 'nr10', cat: 'meat', src: 'manual' },
    { food: 'Pork baby back ribs', size: 'Per lb', min: [15, 20], perLb: [15, 20], release: 'nr10', cat: 'meat', src: 'manual' },
    { food: 'Pork chops', size: '1 inch thick', min: [8, 8], release: 'nr10', cat: 'meat', src: 'common' },
    { food: 'Lamb leg', size: 'Per lb', min: [15, 15], perLb: [15, 15], release: 'nr10', cat: 'meat', src: 'manual' },
    // Seafood
    { food: 'Fish, whole', size: 'Fresh', min: [4, 5], release: 'quick', cat: 'seafood', src: 'manual' },
    { food: 'Fish fillets', size: 'Fresh', min: [2, 3], release: 'quick', cat: 'seafood', src: 'manual' },
    { food: 'Lobster', size: 'Fresh', min: [2, 3], release: 'quick', cat: 'seafood', src: 'manual' },
    { food: 'Mussels', size: 'Fresh', min: [1, 2], release: 'quick', cat: 'seafood', src: 'manual' },
    { food: 'Shrimp or prawns', size: 'Fresh', min: [1, 3], release: 'quick', cat: 'seafood', src: 'manual' },
    { food: 'Seafood stock', size: 'Shells covered in water', min: [7, 8], release: 'natural', cat: 'seafood', src: 'manual' },
    // Beans and lentils (dry = unsoaked, soaked = soaked overnight)
    { food: 'Black beans', size: 'Dry', min: [20, 25], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Black beans', size: 'Soaked', min: [6, 8], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Black-eyed peas', size: 'Dry', min: [14, 18], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Black-eyed peas', size: 'Soaked', min: [4, 5], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Chickpeas', size: 'Dry', min: [35, 40], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Chickpeas', size: 'Soaked', min: [10, 15], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Kidney beans (red)', size: 'Dry', min: [20, 25], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Kidney beans (red)', size: 'Soaked', min: [7, 8], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Navy beans', size: 'Dry', min: [20, 25], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Navy beans', size: 'Soaked', min: [7, 8], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Kidney beans (white / cannellini)', size: 'Dry', min: [25, 30], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Kidney beans (white / cannellini)', size: 'Soaked', min: [6, 9], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Pinto beans', size: 'Dry', min: [25, 30], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Pinto beans', size: 'Soaked', min: [6, 9], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Lima beans', size: 'Dry', min: [12, 14], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Lima beans', size: 'Soaked', min: [6, 10], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Soybeans', size: 'Dry', min: [35, 45], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Soybeans', size: 'Soaked', min: [18, 20], release: 'nr10', cat: 'beans', src: 'manual' },
    { food: 'Lentils (green)', size: 'Dry, no soaking', min: [8, 10], release: 'quick', cat: 'beans', src: 'manual' },
    { food: 'Lentils (yellow)', size: 'Dry, no soaking', min: [1, 2], release: 'quick', cat: 'beans', src: 'manual' },
    // Grains
    { food: 'White rice', size: '1 cup rice : 1 cup water', min: [4, 4], release: 'nr10', cat: 'grains', src: 'common' },
    { food: 'Brown rice', size: '1 cup rice : 1 cup water', min: [22, 22], release: 'nr10', cat: 'grains', src: 'common' },
    { food: 'Steel cut oats', size: '1 cup oats : 3 cups water', min: [10, 10], release: 'nr10', cat: 'grains', src: 'common' },
    // Vegetables
    { food: 'Asparagus', size: 'Whole spears', min: [1, 2], release: 'quick', cat: 'veg', src: 'manual' },
    { food: 'Green or yellow beans', size: 'Trimmed', min: [1, 2], release: 'quick', cat: 'veg', src: 'manual' },
    { food: 'Broccoli', size: 'Florets', min: [1, 2], release: 'quick', cat: 'veg', src: 'manual' },
    { food: 'Brussels sprouts', size: 'Whole', min: [2, 3], release: 'quick', cat: 'veg', src: 'manual' },
    { food: 'Cabbage', size: 'Whole or halved', min: [2, 3], release: 'quick', cat: 'veg', src: 'manual' },
    { food: 'Butternut squash', size: 'Chunks', min: [4, 6], release: 'quick', cat: 'veg', src: 'manual' },
    { food: 'Carrots', size: 'Whole or chunks', min: [6, 8], release: 'quick', cat: 'veg', src: 'manual' },
    { food: 'Corn on the cob', size: 'Whole ears', min: [3, 5], release: 'quick', cat: 'veg', src: 'manual' },
    { food: 'Potatoes', size: 'Large, whole', min: [12, 15], release: 'quick', cat: 'veg', src: 'manual' },
    { food: 'Potatoes', size: 'Small, whole', min: [8, 10], release: 'quick', cat: 'veg', src: 'manual' },
    { food: 'Potatoes', size: 'Cubed', min: [3, 4], release: 'quick', cat: 'veg', src: 'manual' },
    { food: 'Sweet potatoes', size: 'Whole', min: [12, 15], release: 'quick', cat: 'veg', src: 'manual' },
    { food: 'Sweet potatoes', size: 'Cubed', min: [2, 4], release: 'quick', cat: 'veg', src: 'manual' },
    // Eggs and other
    { food: 'Hard-boiled eggs', size: 'Large, on the trivet', min: [5, 5], release: 'nr5', cat: 'other', src: 'manual', note: 'The 5-5-5 method: 5 minutes at pressure, 5 minutes natural release, 5 minutes in ice water.' },
    { food: 'Spaghetti and other dried pasta', size: 'Broken in half, covered in water', min: null, release: 'quick', cat: 'other', src: 'common', note: 'Half the time on the box, rounded down (a 10-minute pasta takes 5).' }
  ];
  var RELEASE = { quick: 'Quick', nr5: 'Natural 5 min', nr10: 'Natural 10 min', nr15: 'Natural 15 min', natural: 'Natural (full)' };
  var CATS = { poultry: 'Poultry', meat: 'Meat', seafood: 'Seafood', beans: 'Beans & lentils', grains: 'Grains', veg: 'Vegetables', other: 'Eggs & other' };
  function minText(r) {
    if (!r.min) return 'Half the box time';
    return (r.min[0] === r.min[1] ? r.min[0] : r.min[0] + '–' + r.min[1]) + ' min' + (r.perLb ? ' per lb' : '');
  }
  function pressureFor(index, lb) {
    var r = PRESSURE[index];
    if (!r || !r.perLb || !(lb > 0)) return null;
    return { row: r, min: [r.perLb[0] * lb, r.perLb[1] * lb] };
  }

  var api = {
    duration: duration, durationRange: durationRange, hoursText: hoursText, hoursRange: hoursRange, cups: cups,
    airFryer: airFryer,
    MEATS: MEATS, meat: meat, meatById: meatById,
    TURKEY: TURKEY, TURKEY_REST: TURKEY_REST, turkey: turkey,
    BREWS: BREWS, G_PER_TBSP_COFFEE: G_PER_TBSP_COFFEE, ESPRESSO_DOSE: ESPRESSO_DOSE, coffee: coffee,
    RICE: RICE, rice: rice,
    eggSub: eggSub, honeyForSugar: honeyForSugar, sugarForHoney: sugarForHoney, cocoaForChocolate: cocoaForChocolate, SALTS: SALTS, salt: salt,
    cupFraction: cupFraction,
    PRESSURE: PRESSURE, RELEASE: RELEASE, CATS: CATS, minText: minText, pressureFor: pressureFor
  };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.LCTKitchenTools = api;

  // ── Browser ────────────────────────────────────────────────────────────────
  var LB_PER_KG = 2.20462;
  function num(el) { var n = K.parseAmount(el.value); return isFinite(n) ? n : NaN; }
  function q(form, sel) { return form.querySelector(sel); }
  function setRows(form, rows) {
    var out = q(form, '[data-result-rows]');
    out.innerHTML = '';
    rows.forEach(function (r) {
      var dt = document.createElement('dt'); dt.textContent = r[0];
      var dd = document.createElement('dd'); dd.textContent = r[1];
      out.appendChild(dt); out.appendChild(dd);
    });
  }
  function show(form, main, rows, note) {
    var err = q(form, '[data-result-error]');
    if (err) err.hidden = true;
    q(form, '[data-result-main]').textContent = main;
    setRows(form, rows || []);
    var n = q(form, '[data-result-note]');
    if (n) { n.textContent = note || ''; n.hidden = !note; }
  }
  function fail(form, msg, el) {
    var err = q(form, '[data-result-error]');
    if (err) { err.textContent = msg; err.hidden = false; }
    if (el) el.setAttribute('aria-invalid', 'true');
    q(form, '[data-result-main]').textContent = '—';
    setRows(form, []);
    var n = q(form, '[data-result-note]');
    if (n) n.hidden = true;
  }
  function clearInvalid(form) {
    var els = form.querySelectorAll('[aria-invalid="true"]');
    for (var i = 0; i < els.length; i++) els[i].setAttribute('aria-invalid', 'false');
  }
  function live(form, render) {
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
    render();
  }
  function seg(form, name) { var b = q(form, '[data-seg="' + name + '"] [aria-pressed="true"]'); return b ? b.getAttribute('data-value') : null; }
  function wireSeg(form) {
    var groups = form.querySelectorAll('[data-seg]');
    for (var i = 0; i < groups.length; i++) (function (g) {
      g.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-value]');
        if (!b) return;
        var all = g.querySelectorAll('button[data-value]');
        for (var j = 0; j < all.length; j++) all[j].setAttribute('aria-pressed', String(all[j] === b));
        form.dispatchEvent(new Event('change'));
      });
    })(groups[i]);
  }
  function weightLb(form) {
    var w = num(q(form, '[name="weight"]'));
    return seg(form, 'wunit') === 'kg' ? w * LB_PER_KG : w;
  }

  function initAirFryer(form) {
    wireSeg(form);
    var tempEl = q(form, '[name="temp"]'), timeEl = q(form, '[name="time"]');
    function render() {
      clearInvalid(form);
      var unit = seg(form, 'unit'), dir = seg(form, 'dir');
      var t = num(tempEl), m = num(timeEl);
      var okT = unit === 'c' ? t >= 90 && t <= 290 : t >= 200 && t <= 550;
      if (!okT) return fail(form, unit === 'c' ? 'Enter an oven temperature from 90 to 290 °C.' : 'Enter an oven temperature from 200 to 550 °F.', tempEl);
      if (!(m > 0 && m <= 600)) return fail(form, 'Enter a time in minutes, like 20.', timeEl);
      var r = airFryer(t, unit, m, dir);
      var u = unit === 'c' ? ' °C' : ' °F';
      var toAir = dir !== 'to-oven';
      show(form, Math.round(r.temp) + u + ' · ' + r.minutes + ' min', [
        [toAir ? 'Air fryer temperature' : 'Oven temperature', Math.round(r.temp) + u],
        [toAir ? 'Air fryer time' : 'Oven time', 'about ' + duration(r.minutes)],
        ['Rule used', toAir ? (unit === 'c' ? '15 °C' : '25 °F') + ' lower, about 20% less time' : (unit === 'c' ? '15 °C' : '25 °F') + ' higher, about 25% more time']
      ], toAir ? 'Check it a few minutes early the first time, and shake the basket halfway through.' : 'Ovens heat more slowly than air fryers. Preheat fully and check for doneness near the end.');
    }
    live(form, render);
  }

  function initMeat(form) {
    wireSeg(form);
    var meatEl = q(form, '[name="meat"]'), wEl = q(form, '[name="weight"]');
    function render() {
      clearInvalid(form);
      var lb = weightLb(form);
      var res = meat(meatEl.value, lb);
      var m = res.meat;
      var rows = [['Safe internal temperature', m.f + ' °F (' + m.c + ' °C)'], ['Rest time', m.rest ? m.rest + ' minutes before cutting' : 'None needed']];
      var wField = q(form, '[data-weight-field]');
      var hasTime = !!(m.perLb || m.turkey);
      wField.hidden = !hasTime;
      if (hasTime) {
        if (!(lb > 0)) return fail(form, 'Enter the weight, like 4 or 4.5.', wEl);
        if (m.turkey && !(lb >= 8 && lb <= 24)) {
          rows.push(['Cooking time', 'The USDA turkey chart covers 8 to 24 lb whole turkeys.']);
        } else if (res.time) {
          rows.push(['Estimated cooking time', durationRange(res.time[0], res.time[1]) + ' at 325 °F']);
        }
      } else {
        rows.push(['Cooking time', 'Depends on thickness, not weight. Go by the thermometer.']);
      }
      show(form, m.f + ' °F', rows, m.note || '');
    }
    live(form, render);
  }

  function initCoffee(form) {
    var brewEl = q(form, '[name="brew"]'), countEl = q(form, '[name="count"]'), sizeEl = q(form, '[name="size"]');
    function render() {
      clearInvalid(form);
      var esp = brewEl.value === 'espresso';
      q(form, '[data-cups-label]').textContent = esp ? 'Shots' : 'Cups';
      q(form, '[data-size-field]').hidden = esp;
      var n = num(countEl);
      var max = esp ? 4 : 12;
      if (!(n >= 1 && n <= max && Math.round(n) === n)) return fail(form, esp ? 'Make 1 to 4 shots.' : 'Make 1 to 12 cups.', countEl);
      var size = num(sizeEl);
      if (!esp && !(size >= 30 && size <= 1000)) return fail(form, 'Enter a cup size in ml, like 240.', sizeEl);
      var r = coffee(brewEl.value, n, size);
      var rows = [
        ['Coffee', fmtNum(r.coffee, 1).replace(/\.0$/, '') + ' g'],
        [esp ? 'Espresso out' : 'Water', Math.round(r.water) + ' g (' + Math.round(r.water) + ' ml)'],
        ['Ratio', '1:' + r.brew.ratio],
        ['Without a scale', 'about ' + fmtNum(r.tbsp, 1).replace(/\.0$/, '') + ' level tbsp of ground coffee (approximate)']
      ];
      var note = esp ? 'A shot here is an 18 g dose pulled to about 36 g of espresso, the usual starting point for a double basket.'
        : brewEl.value === 'cold' ? 'This makes concentrate. Steep 12 to 24 hours in the fridge, strain, then dilute 1:1 with water or milk to serve.'
        : 'The grounds hold back some water, so you end up with a little less coffee in the cup than the water you pour.';
      show(form, fmtNum(r.coffee, 0) + ' g coffee', rows, note);
    }
    live(form, render);
  }

  function initRice(form) {
    wireSeg(form);
    var riceEl = q(form, '[name="rice"]'), amtEl = q(form, '[name="amount"]');
    function render() {
      clearInvalid(form);
      var n = num(amtEl);
      if (!(n > 0 && n <= 20)) return fail(form, 'Enter the dry rice in cups, like 1 or 1 1/2.', amtEl);
      var cooker = seg(form, 'cooker');
      var r = rice(riceEl.value, n, cooker);
      if (r.unsupported) return show(form, '—', [['Instant Pot', 'Wild rice is not in the Instant Pot manual’s tables. Use the stovetop ratio, or your cooker’s Multigrain setting.']], '');
      var rows = [['Ratio', '1 : ' + r.ratio + ' (rice : water, by volume)'], ['Cooking time', r.time]];
      var notes = [];
      if (r.rice.rinse) notes.push('Rinse the rice in cold water until it runs mostly clear, then drain well.');
      if (cooker === 'ip') notes.push('Instant Pot uses less water than the stovetop because almost none boils off.');
      if (cooker === 'cooker') notes.push('Measure with a US cup here; the cup that comes with a rice cooker is smaller (180 ml).');
      notes.push(cooker === 'ip' ? 'Fluff with a fork after the release.' : 'Let it rest 10 minutes with the lid on, then fluff.');
      show(form, cups(r.water) + ' water', rows, notes.join(' '));
    }
    live(form, render);
  }

  function initSub(form) {
    wireSeg(form);
    var kind = form.getAttribute('data-sub');
    var amtEl = q(form, '[name="amount"]');
    function render() {
      clearInvalid(form);
      var n = num(amtEl);
      if (!(n > 0 && n <= 100)) return fail(form, 'Type an amount, like 2, 1/2 or 1 1/2.', amtEl);
      if (kind === 'egg') {
        var e = eggSub(n);
        show(form, cups(e.applesauceCups) + ' applesauce', [
          ['Unsweetened applesauce', cups(e.applesauceCups)],
          ['Mashed ripe banana', cups(e.bananaCups)],
          ['Ground flaxseed + water', K.toFraction(e.flaxTbsp).text + ' tbsp flax + ' + K.toFraction(e.waterTbsp).text + ' tbsp water']
        ], 'For the flax version, stir and let it sit 5 minutes until it turns gel-like.');
      } else if (kind === 'honey') {
        if (seg(form, 'dir') === 'honey-to-sugar') {
          var s = sugarForHoney(n);
          show(form, cups(s.sugarCups) + ' sugar', [['Granulated sugar', cups(s.sugarCups)], ['Liquid to add', K.spoonsText(s.liquidCups * 48) + ' (' + cups(s.liquidCups) + ')']],
            'Add the extra liquid (water or milk) to make up for the honey you took out.');
        } else {
          var h = honeyForSugar(n);
          show(form, cups(h.honeyCups) + ' honey', [
            ['Honey', cups(h.honeyCups)],
            ['Cut other liquid by', K.spoonsText(h.liquidCups * 48) + ' (' + cups(h.liquidCups) + ')'],
            ['Add baking soda', K.spoonsText(h.sodaTsp)],
            ['Oven', '25 °F (about 15 °C) lower']
          ], 'Honey browns faster than sugar, which is why the oven goes down.');
        }
      } else if (kind === 'cocoa') {
        var c = cocoaForChocolate(n);
        show(form, K.spoonsText(c.cocoaTbsp * 3) + ' cocoa', [['Natural cocoa powder', K.spoonsText(c.cocoaTbsp * 3)], ['Butter or oil', K.spoonsText(c.fatTbsp * 3)]],
          'Use natural (not Dutch-process) cocoa, mixed with the melted butter or oil.');
      } else if (kind === 'salt') {
        var from = q(form, '[name="from"]').value, to = q(form, '[name="to"]').value;
        var r = salt(n, from, to);
        show(form, K.spoonsText(r.tsp) + ' ' + saltById(to).short, [['Weight', fmtNum(r.grams, 1).replace(/\.0$/, '') + ' g'], ['Same as', K.spoonsText(n) + ' ' + saltById(from).short]],
          'Volume is approximate because the crystals are different sizes. When it matters, weigh salt in grams.');
      }
    }
    live(form, render);
  }

  function initCupFraction(form) {
    var amtEl = q(form, '[name="amount"]');
    function render() {
      clearInvalid(form);
      var n = num(amtEl);
      if (!(n > 0 && n <= 100)) return fail(form, 'Type an amount in cups, like 0.66, 2/3 or 1 1/2.', amtEl);
      var r = cupFraction(n);
      var rows = [['Measure with', r.measure], ['In spoons', r.spoons], ['Milliliters', r.ml]];
      var note = r.snapped || Math.abs(r.tsp - n * 48) < 1e-6 ? '' : 'Rounded from ' + fmtNum(n * 48, 2) + ' teaspoons to the nearest ⅛ teaspoon.';
      show(form, r.measure, rows, note);
    }
    live(form, render);
  }

  function initPressure(form) {
    wireSeg(form);
    var foodEl = q(form, '[name="food"]');
    function render() {
      clearInvalid(form);
      var lb = weightLb(form);
      if (!(lb > 0 && lb <= 30)) return fail(form, 'Enter the weight, like 2 or 2.5.', q(form, '[name="weight"]'));
      var r = pressureFor(+foodEl.value, lb);
      var lo = Math.round(r.min[0]), hi = Math.round(r.min[1]);
      show(form, (lo === hi ? lo : lo + '–' + hi) + ' min', [
        ['Time at pressure', durationRange(r.min[0], r.min[1])],
        ['Release', RELEASE[r.row.release]],
        ['Based on', minText(r.row) + ', high pressure']
      ], 'A starting point. Check the center with a thermometer, and pressure cook a few more minutes if it needs it.');
    }
    live(form, render);
  }

  function initPressureTable(wrap) {
    var input = wrap.querySelector('[data-search]');
    var cat = wrap.querySelector('[data-cat]');
    var rows = wrap.querySelectorAll('tbody tr:not(.row-note)');
    var count = wrap.querySelector('[data-count]');
    function filter() {
      var words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      var c = cat.value, shown = 0;
      for (var i = 0; i < rows.length; i++) {
        var text = rows[i].textContent.toLowerCase();
        var ok = (!c || rows[i].getAttribute('data-cat') === c) && words.every(function (w) { return text.indexOf(w) !== -1; });
        rows[i].hidden = !ok;
        var next = rows[i].nextElementSibling;
        if (next && next.classList.contains('row-note')) next.hidden = !ok;
        if (ok) shown++;
      }
      count.textContent = shown === rows.length ? 'Showing all ' + shown + ' foods' : 'Showing ' + shown + ' of ' + rows.length;
      var empty = wrap.querySelector('[data-empty]');
      if (empty) empty.hidden = shown !== 0;
    }
    input.addEventListener('input', filter);
    cat.addEventListener('change', filter);
    wrap.hidden = false;
    var ctl = wrap.querySelector('[data-controls]');
    if (ctl) ctl.hidden = false;
    filter();
  }

  function initTurkey(form) {
    wireSeg(form);
    var wEl = q(form, '[name="weight"]'), serveEl = q(form, '[name="serve"]');
    function render() {
      clearInvalid(form);
      var lb = weightLb(form);
      var kg = seg(form, 'wunit') === 'kg';
      if (!(lb >= 8 && lb <= 24)) return fail(form, kg ? 'Enter a weight from 3.6 to 10.9 kg (the USDA chart covers 8 to 24 lb).' : 'Enter a weight from 8 to 24 lb.', wEl);
      var stuffed = seg(form, 'stuffed') === 'yes';
      var r = turkey(lb, stuffed);
      var rows = [
        ['Roast at 325 °F', 'about ' + hoursRange(r.hours)],
        ['Done at', '165 °F in the thickest part of the thigh' + (stuffed ? ', and 165 °F in the center of the stuffing' : '')],
        ['Rest', TURKEY_REST + ' minutes before carving'],
        ['Thawing in the fridge', r.thawDays + (r.thawDays === 1 ? ' day' : ' days')]
      ];
      var note = '';
      var sv = serveEl.value;
      if (/^\d{1,2}:\d{2}$/.test(sv)) {
        var p = sv.split(':');
        var serveMin = (+p[0]) * 60 + (+p[1]);
        var start = serveMin - r.minutes[1] - TURKEY_REST;
        var d = new Date(2000, 0, 1, 0, 0); d.setMinutes(start);
        var dayNote = start < 0 ? ' the day before' : '';
        var t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        rows.push(['Put it in the oven by', t + dayNote]);
        note = 'That allows for the longer roasting time plus the 20-minute rest. If the thermometer reads 165 °F early, take it out and keep it tented with foil.';
      }
      show(form, hoursRange(r.hours), rows, note);
    }
    live(form, render);
  }

  function boot() {
    var each = function (sel, fn) { var f = document.querySelectorAll(sel); for (var j = 0; j < f.length; j++) fn(f[j]); };
    each('[data-air-fryer]', initAirFryer);
    each('[data-meat]', initMeat);
    each('[data-coffee]', initCoffee);
    each('[data-rice]', initRice);
    each('[data-sub]', initSub);
    each('[data-cup-fraction]', initCupFraction);
    each('[data-pressure]', initPressure);
    each('[data-pressure-table]', initPressureTable);
    each('[data-turkey]', initTurkey);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : this);
