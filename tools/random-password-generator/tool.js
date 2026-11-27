// Random Password Generator. Logic first (also used by the Node test), then the page.
// Passwords are made with crypto.getRandomValues and never leave this page:
// nothing is saved, sent or logged.
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('../../assets/js/rand.js') : root.Rand;

  const SETS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digits: '0123456789',
    // Symbols most sites accept. Quotes, backslash, backtick, spaces and
    // angle brackets are left out because forms often reject or mangle them.
    symbols: '!@#$%^&*()-_=+[]{};:,.?/~',
  };
  const LOOKALIKES = new Set(['l', '1', 'I', 'O', '0']);
  const MIN_LEN = 8, MAX_LEN = 64;

  function pools(o) {
    const out = [];
    for (const k of ['lower', 'upper', 'digits', 'symbols']) {
      if (!o[k]) continue;
      let chars = SETS[k];
      if (o.noLookalikes) chars = [...chars].filter((c) => !LOOKALIKES.has(c)).join('');
      out.push(chars);
    }
    return out;
  }

  // Bits = length × log2(pool size): how many guesses it would take, as a
  // power of two, if someone knew exactly which settings you used.
  function strength(o) {
    const p = pools(o);
    const size = p.reduce((s, x) => s + x.length, 0);
    if (!size) return null;
    const bits = Math.round(o.length * Math.log2(size));
    const label = bits >= 90 ? 'Strong' : bits >= 60 ? 'Good' : 'Weak';
    return { bits, label, poolSize: size };
  }

  function generate(o) {
    if (!Number.isInteger(o.length) || o.length < MIN_LEN || o.length > MAX_LEN) return { error: `Pick a length from ${MIN_LEN} to ${MAX_LEN}.` };
    const p = pools(o);
    if (!p.length) return { error: 'Turn on at least one type of character.' };
    const all = p.join('');
    // One character from each type you turned on, so sites that require
    // "a number and a symbol" accept it; the rest from everything. Shuffled
    // so those guaranteed characters aren't always at the start.
    const chars = p.map((set) => set[R.int(set.length)]);
    while (chars.length < o.length) chars.push(all[R.int(all.length)]);
    return { password: R.shuffle(chars).join('') };
  }

  const logic = { SETS, LOOKALIKES, MIN_LEN, MAX_LEN, pools, strength, generate };
  if (isNode) { module.exports = logic; return; }

  // ─── Page ──────────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  let current = '';
  let shown = true;

  function settings() {
    return {
      length: Number($('length-num').value),
      lower: $('t-lower').checked,
      upper: $('t-upper').checked,
      digits: $('t-digits').checked,
      symbols: $('t-symbols').checked,
      noLookalikes: $('t-lookalikes').checked,
    };
  }

  function renderPassword() {
    const out = $('password');
    out.textContent = current ? (shown ? current : '•'.repeat(current.length)) : '';
    out.classList.toggle('is-masked', !shown);
    $('btn-show').textContent = shown ? 'Hide' : 'Show';
    $('btn-show').setAttribute('aria-pressed', String(!shown));
  }

  function renderStrength(o) {
    const s = strength(o);
    const meter = $('meter');
    if (!s) { meter.hidden = true; return; }
    meter.hidden = false;
    meter.dataset.level = s.label.toLowerCase();
    $('meter-fill').style.width = `${Math.min(100, (s.bits / 128) * 100)}%`;
    $('meter-label').textContent = `${s.label}: about ${s.bits} bits`;
    $('meter-note').textContent = s.label === 'Weak'
      ? 'Short or simple. Make it longer or turn on more character types.'
      : s.label === 'Good'
        ? 'Fine for most accounts. A few more characters makes it much harder to guess.'
        : 'Far longer to guess than a short password. Every extra bit doubles the guesses needed.';
  }

  function run() {
    const o = settings();
    renderStrength(o);
    const res = generate(o);
    if (res.error) {
      $('form-error').textContent = res.error; $('form-error').hidden = false;
      current = ''; renderPassword();
      $('btn-copy').disabled = true;
      return;
    }
    $('form-error').hidden = true;
    current = res.password;
    $('btn-copy').disabled = false;
    renderPassword();
    const box = $('pw-box');
    box.classList.remove('is-fresh'); void box.offsetWidth; box.classList.add('is-fresh');
    $('announce').textContent = `New ${current.length}-character password ready. Use Copy to copy it.`;
  }

  // Length: slider and number box stay in step.
  $('length').addEventListener('input', () => { $('length-num').value = $('length').value; run(); });
  $('length-num').addEventListener('change', () => {
    let v = Math.round(Number($('length-num').value));
    if (!Number.isFinite(v)) v = 16;
    v = Math.min(MAX_LEN, Math.max(MIN_LEN, v));
    $('length-num').value = v; $('length').value = v;
    run();
  });
  ['t-lower', 't-upper', 't-digits', 't-symbols', 't-lookalikes'].forEach((id) => $(id).addEventListener('change', run));

  $('btn-generate').addEventListener('click', run);
  $('btn-another').addEventListener('click', run);
  $('btn-show').addEventListener('click', () => { shown = !shown; renderPassword(); });
  R.copyButton($('btn-copy'), () => current, 'Password copied');
  run();
})(typeof window !== 'undefined' ? window : globalThis);
