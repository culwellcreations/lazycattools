// Giveaway Winner Picker. Logic first (also used by the Node test), then the page.
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('../../assets/js/rand.js') : root.Rand;

  const MIN = 2, MAX = 1000;

  const parse = (raw) => String(raw).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

  // Duplicates match when the lines are the same apart from capital letters
  // and extra spaces, so "@Sam" and "@sam" count as one person.
  const keyOf = (s) => s.toLocaleLowerCase().replace(/\s+/g, ' ');

  function prepare(lines, dedupe) {
    if (!dedupe) return { entries: lines, removed: 0 };
    const seen = new Set();
    const entries = [];
    for (const l of lines) {
      const k = keyOf(l);
      if (seen.has(k)) continue;
      seen.add(k);
      entries.push(l);
    }
    return { entries, removed: lines.length - entries.length };
  }

  function draw(lines, { dedupe, winners, alternates }) {
    if (lines.length > MAX) return { error: `That's ${lines.length.toLocaleString()} entries. The limit is ${MAX.toLocaleString()}.` };
    const { entries, removed } = prepare(lines, dedupe);
    if (entries.length < MIN) return { error: `Add at least ${MIN} entries${removed ? ` (after removing ${removed} duplicate${removed === 1 ? '' : 's'})` : ''}.` };
    if (!Number.isInteger(winners) || winners < 1 || winners > 10) return { error: 'Pick 1 to 10 winners.' };
    if (!Number.isInteger(alternates) || alternates < 0 || alternates > 5) return { error: 'Pick 0 to 5 alternates.' };
    if (winners + alternates > entries.length) {
      return { error: `${winners} winner${winners === 1 ? '' : 's'} plus ${alternates} alternate${alternates === 1 ? '' : 's'} is ${winners + alternates} people, but there ${entries.length === 1 ? 'is' : 'are'} only ${entries.length} entries${dedupe && removed ? ' after removing duplicates' : ''}.` };
    }
    // Without replacement: everyone drawn is a different entry.
    const picked = R.sample(entries.map((_, i) => i), winners + alternates);
    return {
      winners: picked.slice(0, winners).map((i) => entries[i]),
      alternates: picked.slice(winners).map((i) => entries[i]),
      pool: entries.length,
      removed,
      dedupe,
    };
  }

  const logic = { MIN, MAX, parse, prepare, draw, keyOf };
  if (isNode) { module.exports = logic; return; }

  // ─── Page ──────────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  let last = null;

  function updateCount() {
    const lines = parse($('entries').value);
    const dedupe = $('dedupe').checked;
    const { entries, removed } = prepare(lines, dedupe);
    let txt = `${entries.length.toLocaleString()} ${entries.length === 1 ? 'entry' : 'entries'}`;
    if (dedupe && removed) txt = `${removed} duplicate${removed === 1 ? '' : 's'} removed, ${txt} in the draw`;
    if (!dedupe) {
      const dupes = lines.length - prepare(lines, true).entries.length;
      if (dupes) txt += ` (${dupes} duplicate${dupes === 1 ? '' : 's'} count as extra chances)`;
    }
    $('entry-count').textContent = txt;
  }

  function stamp(d) {
    return d.toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'short' });
  }

  function run() {
    const res = draw(parse($('entries').value), {
      dedupe: $('dedupe').checked,
      winners: Number($('winners').value),
      alternates: Number($('alternates').value),
    });
    if (res.error) { $('form-error').textContent = res.error; $('form-error').hidden = false; return; }
    $('form-error').hidden = true;
    res.at = new Date();
    last = res;
    render(res);
  }

  function fillList(ol, names) {
    ol.innerHTML = '';
    names.forEach((n, i) => {
      const li = document.createElement('li');
      const k = document.createElement('span'); k.className = 'n'; k.textContent = `${i + 1}.`;
      const v = document.createElement('span'); v.className = 'grow'; v.textContent = n;
      li.append(k, v);
      ol.appendChild(li);
    });
  }

  function render(r) {
    $('results').hidden = false;
    $('results-heading').textContent = r.winners.length === 1 ? 'Winner' : `${r.winners.length} winners`;
    fillList($('winner-list'), r.winners);
    $('alt-block').hidden = r.alternates.length === 0;
    fillList($('alt-list'), r.alternates);
    $('stamp').textContent = `Drawn ${stamp(r.at)} from ${r.pool.toLocaleString()} entries${r.dedupe ? (r.removed ? `, ${r.removed} duplicate${r.removed === 1 ? '' : 's'} removed` : ', no duplicates') : ', duplicates kept'}.`;
    const card = $('draw-card');
    card.classList.remove('is-fresh'); void card.offsetWidth; card.classList.add('is-fresh');
    $('announce').textContent = `Winner${r.winners.length > 1 ? 's' : ''}: ${r.winners.join(', ')}.${r.alternates.length ? ` Alternates: ${r.alternates.join(', ')}.` : ''}`;
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function asText(r) {
    const lines = [`Giveaway draw: ${stamp(r.at)}`, `From ${r.pool} entries${r.dedupe ? (r.removed ? ` (${r.removed} duplicates removed)` : '') : ' (duplicates kept)'}`, '', r.winners.length === 1 ? 'Winner:' : 'Winners:'];
    r.winners.forEach((w, i) => lines.push(`${i + 1}. ${w}`));
    if (r.alternates.length) { lines.push('', 'Alternates:'); r.alternates.forEach((a, i) => lines.push(`${i + 1}. ${a}`)); }
    return lines.join('\n');
  }

  $('entries').addEventListener('input', updateCount);
  $('dedupe').addEventListener('change', updateCount);
  $('btn-clear').addEventListener('click', () => { $('entries').value = ''; updateCount(); $('entries').focus(); });
  $('btn-draw').addEventListener('click', run);
  $('btn-again').addEventListener('click', run);
  R.copyButton($('btn-copy'), () => (last ? asText(last) : ''), 'Copied the winners');
  updateCount();
})(typeof window !== 'undefined' ? window : globalThis);
