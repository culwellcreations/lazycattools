// Random Number Generator. Logic first (also used by the Node test), then the page.
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('../../assets/js/rand.js') : root.Rand;

  const LIMIT = 1e9;

  function fmt(n) { return n.toLocaleString('en-US', { maximumFractionDigits: 6 }); }

  // opts: { min, max, count, decimals, places, repeats }
  function generate(o) {
    const isInt = (v) => Number.isInteger(v);
    if (!isInt(o.min) || !isInt(o.max)) return { error: 'Use whole numbers for the minimum and maximum.' };
    if (Math.abs(o.min) > LIMIT || Math.abs(o.max) > LIMIT) return { error: `Keep the range between −${fmt(LIMIT)} and ${fmt(LIMIT)}.` };
    if (o.max <= o.min) return { error: `The maximum (${fmt(o.max)}) has to be bigger than the minimum (${fmt(o.min)}).` };
    if (!isInt(o.count) || o.count < 1 || o.count > 100) return { error: 'Generate between 1 and 100 numbers at a time.' };
    const places = o.decimals ? o.places : 0;
    if (!isInt(places) || places < 0 || places > 6) return { error: 'Pick 0 to 6 decimal places.' };

    const scale = 10 ** places;
    const steps = (o.max - o.min) * scale + 1; // how many different values exist
    if (!o.repeats && o.count > steps) {
      return { error: `You asked for ${o.count} unique numbers, but ${fmt(o.min)}–${fmt(o.max)}${places ? ` to ${places} decimal place${places === 1 ? '' : 's'}` : ''} only has ${fmt(steps)}.` };
    }

    let idx;
    if (o.repeats) {
      idx = Array.from({ length: o.count }, () => R.int(steps));
    } else if (steps <= 5000) {
      idx = R.sample([...Array(steps).keys()], o.count);
    } else {
      const seen = new Set();
      while (seen.size < o.count) seen.add(R.int(steps));
      idx = R.shuffle([...seen]);
    }
    const numbers = idx.map((i) => (places ? (o.min + i / scale).toFixed(places) : String(o.min + i)));
    return { numbers };
  }

  const logic = { generate, LIMIT };
  if (isNode) { module.exports = logic; return; }

  // ─── Page ──────────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const num = (id) => { const v = $(id).value.trim(); return v === '' ? NaN : Number(v); };
  let decimals = false;
  let history = [];
  let last = null;

  function setType(dec) {
    decimals = dec;
    $('type-int').setAttribute('aria-pressed', String(!dec));
    $('type-dec').setAttribute('aria-pressed', String(dec));
    $('places-field').hidden = !dec;
  }
  $('type-int').addEventListener('click', () => setType(false));
  $('type-dec').addEventListener('click', () => setType(true));

  function showError(msg) { $('form-error').textContent = msg; $('form-error').hidden = false; }

  function run() {
    const opts = {
      min: num('min'), max: num('max'), count: num('count'),
      decimals, places: Number($('places').value), repeats: $('repeats').checked,
    };
    ['min', 'max', 'count'].forEach((id) => $(id).removeAttribute('aria-invalid'));
    const res = generate(opts);
    if (res.error) {
      showError(res.error);
      if (/maximum|minimum|whole|range/.test(res.error)) { $('min').setAttribute('aria-invalid', 'true'); $('max').setAttribute('aria-invalid', 'true'); }
      if (/at a time|unique/.test(res.error)) $('count').setAttribute('aria-invalid', 'true');
      return;
    }
    $('form-error').hidden = true;
    last = res.numbers;
    render(opts, res.numbers);
    history.unshift({ opts, numbers: res.numbers, at: new Date() });
    history = history.slice(0, 5);
    renderHistory();
  }

  function render(o, nums) {
    $('results').hidden = false;
    const range = `${Number(o.min).toLocaleString()} to ${Number(o.max).toLocaleString()}`;
    $('results-heading').textContent = nums.length === 1 ? 'Your number' : `Your ${nums.length} numbers`;
    const single = $('single'), list = $('list');
    if (nums.length === 1) {
      single.hidden = false; list.hidden = true;
      $('single-value').textContent = Number(nums[0]).toLocaleString('en-US', { minimumFractionDigits: o.decimals ? o.places : 0, maximumFractionDigits: 6 });
      $('single-sub').textContent = `from ${range}`;
      single.classList.remove('is-fresh'); void single.offsetWidth; single.classList.add('is-fresh');
    } else {
      single.hidden = true; list.hidden = false;
      list.innerHTML = '';
      nums.forEach((n, i) => {
        const li = document.createElement('li');
        const k = document.createElement('span'); k.className = 'n'; k.textContent = `${i + 1}.`;
        const v = document.createElement('span'); v.className = 'grow'; v.textContent = n;
        li.append(k, v);
        list.appendChild(li);
      });
      list.classList.remove('is-fresh'); void list.offsetWidth; list.classList.add('is-fresh');
    }
    $('announce').textContent = nums.length === 1 ? `Your number is ${nums[0]}` : `Generated ${nums.length} numbers: ${nums.slice(0, 20).join(', ')}${nums.length > 20 ? ', and more' : ''}`;
  }

  function renderHistory() {
    const ul = $('history-list');
    ul.innerHTML = '';
    history.forEach((h) => {
      const li = document.createElement('li');
      const shown = h.numbers.slice(0, 12).join(', ') + (h.numbers.length > 12 ? ` … (${h.numbers.length})` : '');
      li.textContent = `${shown} `;
      const when = document.createElement('span');
      when.className = 'when';
      when.textContent = `· ${h.opts.min}–${h.opts.max}, ${h.at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}`;
      li.appendChild(when);
      ul.appendChild(li);
    });
    $('history').hidden = history.length === 0;
  }

  $('btn-generate').addEventListener('click', run);
  $('btn-again').addEventListener('click', run);
  $('btn-clear-history').addEventListener('click', () => { history = []; renderHistory(); });
  R.copyButton($('btn-copy'), () => (last ? last.join('\n') : ''), 'Copied');
  ['min', 'max', 'count'].forEach((id) => $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); }));
})(typeof window !== 'undefined' ? window : globalThis);
