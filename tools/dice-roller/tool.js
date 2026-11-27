// Dice Roller. Logic first (also used by the Node test), then the page.
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('../../assets/js/rand.js') : root.Rand;

  const SIDES = [4, 6, 8, 10, 12, 20, 100];

  function roll(sides, count, mod) {
    if (!SIDES.includes(sides)) return { error: 'Pick a die: d4, d6, d8, d10, d12, d20 or d100.' };
    if (!Number.isInteger(count) || count < 1 || count > 10) return { error: 'Roll 1 to 10 dice at a time.' };
    if (!Number.isInteger(mod) || mod < -10 || mod > 10) return { error: 'Keep the modifier between −10 and +10.' };
    const dice = Array.from({ length: count }, () => 1 + R.int(sides));
    const sum = dice.reduce((a, b) => a + b, 0);
    return { sides, count, mod, dice, sum, total: sum + mod };
  }

  const signed = (m) => (m < 0 ? `− ${Math.abs(m)}` : `+ ${m}`);

  // "4 + 6 + 2 + 3 = 15", with the modifier as its own term.
  function maths(r) {
    const terms = r.dice.join(' + ');
    if (r.mod === 0) return r.dice.length === 1 ? `${r.total}` : `${terms} = ${r.total}`;
    return `${terms} ${signed(r.mod)} = ${r.total}`;
  }

  function label(r) { return `${r.count}d${r.sides}${r.mod ? (r.mod > 0 ? `+${r.mod}` : `${r.mod}`) : ''}`; }

  // Natural 20s and 1s on d20s. A label only; the odds don't change.
  function d20Note(r) {
    if (r.sides !== 20) return '';
    const nat20 = r.dice.filter((d) => d === 20).length;
    const nat1 = r.dice.filter((d) => d === 1).length;
    const parts = [];
    if (nat20) parts.push(r.count === 1 ? 'Natural 20' : `${nat20} natural 20${nat20 > 1 ? 's' : ''}`);
    if (nat1) parts.push(r.count === 1 ? 'Natural 1' : `${nat1} natural 1${nat1 > 1 ? 's' : ''}`);
    return parts.join(' · ');
  }

  const logic = { SIDES, roll, maths, label, d20Note };
  if (isNode) { module.exports = logic; return; }

  // ─── Page ──────────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  let sides = 20;
  let history = [];

  function setSides(s) {
    sides = s;
    document.querySelectorAll('[data-sides]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.sides) === s)));
  }
  document.querySelectorAll('[data-sides]').forEach((b) => b.addEventListener('click', () => setSides(Number(b.dataset.sides))));

  function presetFill(s, count, mod, focusMod) {
    setSides(s);
    $('count').value = String(count);
    $('mod').value = String(mod);
    if (focusMod) { $('mod').focus(); $('mod').select(); }
    else $('btn-roll').focus();
  }
  $('p-d20').addEventListener('click', () => presetFill(20, 1, 0));
  $('p-2d6').addEventListener('click', () => presetFill(6, 2, 0));
  $('p-3d6').addEventListener('click', () => presetFill(6, 3, 0));
  $('p-attack').addEventListener('click', () => presetFill(20, 1, Number($('mod').value) || 0, true));

  function doRoll() {
    const res = roll(sides, Number($('count').value), Number($('mod').value || 0));
    if (res.error) { $('form-error').textContent = res.error; $('form-error').hidden = false; return; }
    $('form-error').hidden = true;
    render(res);
    history.unshift(res);
    history = history.slice(0, 20);
    renderHistory();
  }

  function render(r) {
    $('results').hidden = false;
    const tray = $('tray');
    tray.innerHTML = '';
    r.dice.forEach((d) => {
      const el = document.createElement('span');
      el.className = 'die' + (r.sides === 20 && d === 20 ? ' is-crit' : '') + (r.sides === 20 && d === 1 ? ' is-fumble' : '');
      el.textContent = d;
      el.setAttribute('aria-hidden', 'true');
      tray.appendChild(el);
    });
    tray.classList.remove('is-fresh'); void tray.offsetWidth; tray.classList.add('is-fresh');
    $('total').textContent = r.total;
    $('roll-label').textContent = label(r);
    $('maths').textContent = maths(r);
    const note = d20Note(r);
    $('crit').textContent = note;
    $('crit').hidden = !note;
    $('announce').textContent = `You rolled ${r.dice.join(', ')}. Total ${r.total}${r.mod ? ` with ${signed(r.mod)}` : ''}.${note ? ' ' + note + '.' : ''}`;
  }

  function renderHistory() {
    const ol = $('history-list');
    ol.innerHTML = '';
    history.forEach((r) => {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = r.total;
      li.append(strong, ` `);
      const when = document.createElement('span');
      when.className = 'when';
      const note = d20Note(r);
      when.textContent = `${label(r)}: ${maths(r)}${note ? ` (${note})` : ''}`;
      li.appendChild(when);
      ol.appendChild(li);
    });
    $('history').hidden = history.length === 0;
  }

  $('btn-roll').addEventListener('click', doRoll);
  $('btn-clear-history').addEventListener('click', () => { history = []; renderHistory(); });
  ['count', 'mod'].forEach((id) => $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') doRoll(); }));
})(typeof window !== 'undefined' ? window : globalThis);
