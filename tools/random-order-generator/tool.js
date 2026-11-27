// Random Order Generator. Logic first (also used by the Node test), then the page.
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('../../assets/js/rand.js') : root.Rand;

  const MIN = 2, MAX = 500;

  // Blank lines are dropped; duplicates stay (they were typed twice on purpose).
  const parse = (raw) => String(raw).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

  function order(items) {
    if (items.length < MIN) return { error: `Add at least ${MIN} items to shuffle.` };
    if (items.length > MAX) return { error: `That's ${items.length} items. The limit is ${MAX}.` };
    return { order: R.shuffle(items) };
  }

  const asText = (list) => list.map((x, i) => `${i + 1}. ${x}`).join('\n');

  const logic = { MIN, MAX, parse, order, asText };
  if (isNode) { module.exports = logic; return; }

  // ─── Page ──────────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  let last = null;

  function updateCount() {
    const n = parse($('items').value).length;
    $('item-count').textContent = `${n} ${n === 1 ? 'item' : 'items'}`;
  }

  function run() {
    const res = order(parse($('items').value));
    if (res.error) { $('form-error').textContent = res.error; $('form-error').hidden = false; return; }
    $('form-error').hidden = true;
    last = res.order;
    $('results').hidden = false;
    const ol = $('order-list');
    ol.innerHTML = '';
    res.order.forEach((x, i) => {
      const li = document.createElement('li');
      const k = document.createElement('span'); k.className = 'n'; k.textContent = `${i + 1}.`;
      const v = document.createElement('span'); v.className = 'grow'; v.textContent = x;
      li.append(k, v);
      ol.appendChild(li);
    });
    ol.classList.remove('is-fresh'); void ol.offsetWidth; ol.classList.add('is-fresh');
    $('announce').textContent = `New order: ${res.order.slice(0, 15).map((x, i) => `${i + 1}, ${x}`).join('; ')}${res.order.length > 15 ? ', and more' : ''}.`;
  }

  $('items').addEventListener('input', updateCount);
  $('btn-clear').addEventListener('click', () => { $('items').value = ''; updateCount(); $('items').focus(); });
  $('btn-shuffle').addEventListener('click', run);
  $('btn-again').addEventListener('click', run);
  R.copyButton($('btn-copy'), () => (last ? asText(last) : ''), 'Copied the order');
  updateCount();
})(typeof window !== 'undefined' ? window : globalThis);
