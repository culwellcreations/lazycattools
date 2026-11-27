// Yes or No Decision Maker. Logic first (also used by the Node test), then the page.
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('../../assets/js/rand.js') : root.Rand;

  const ANSWERS = ['Yes', 'No', 'Maybe'];
  const LINES = { Yes: 'Go for it.', No: 'Not this time.', Maybe: 'Could go either way. Ask again in a minute.' };

  // Weights are 0–100 each and don't have to add up to 100; they're used as
  // shares of their total. Up to 2 decimal places count.
  function decide(weights) {
    if (weights.length !== 3 || weights.some((w) => !Number.isFinite(w))) return { error: 'Enter a number from 0 to 100 for each answer.' };
    if (weights.some((w) => w < 0 || w > 100)) return { error: 'Keep each weight between 0 and 100.' };
    const ints = weights.map((w) => Math.round(w * 100));
    if (ints.every((w) => w === 0)) return { error: 'Set at least one weight above 0.' };
    const i = R.weighted(ints);
    const answer = ANSWERS[i];
    return { answer, line: LINES[answer] };
  }

  // The chance of each answer, as whole percents, for the note under the inputs.
  function odds(weights) {
    const total = weights.reduce((a, b) => a + (Number.isFinite(b) && b > 0 ? b : 0), 0);
    if (!total) return null;
    return weights.map((w) => (Number.isFinite(w) && w > 0 ? (w / total) * 100 : 0));
  }

  const logic = { ANSWERS, decide, odds };
  if (isNode) { module.exports = logic; return; }

  // ─── Page ──────────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const ids = ['w-yes', 'w-no', 'w-maybe'];
  const weights = () => ids.map((id) => ($(id).value.trim() === '' ? NaN : Number($(id).value)));
  let history = [];

  function updateOdds() {
    const o = odds(weights());
    $('odds').textContent = o
      ? `Chances right now: Yes ${fmt(o[0])}, No ${fmt(o[1])}, Maybe ${fmt(o[2])}.`
      : 'Set at least one weight above 0.';
  }
  const fmt = (p) => `${p < 1 && p > 0 ? p.toFixed(1) : Math.round(p)}%`;

  function run() {
    const res = decide(weights());
    if (res.error) { $('form-error').textContent = res.error; $('form-error').hidden = false; return; }
    $('form-error').hidden = true;
    const q = $('question').value.trim();
    $('results').hidden = false;
    $('asked').textContent = q;
    $('asked').hidden = !q;
    const box = $('answer-box');
    box.dataset.answer = res.answer.toLowerCase();
    $('answer').textContent = `${res.answer}.`;
    $('answer-line').textContent = res.line;
    box.classList.remove('is-fresh'); void box.offsetWidth; box.classList.add('is-fresh');
    $('announce').textContent = `${q ? q + ' ' : ''}${res.answer}. ${res.line}`;
    history.unshift({ q, a: res.answer });
    history = history.slice(0, 10);
    renderHistory();
  }

  function renderHistory() {
    const ol = $('history-list');
    ol.innerHTML = '';
    history.forEach((h) => {
      const li = document.createElement('li');
      const s = document.createElement('strong');
      s.textContent = h.a;
      if (h.q) {
        const q = document.createElement('span');
        q.className = 'when';
        q.textContent = `${h.q} `;
        li.append(q, '→ ', s);
      } else {
        li.append(s);
      }
      ol.appendChild(li);
    });
    $('history').hidden = history.length === 0;
  }

  ids.forEach((id) => $(id).addEventListener('input', updateOdds));
  $('btn-reset-odds').addEventListener('click', () => { $('w-yes').value = 45; $('w-no').value = 45; $('w-maybe').value = 10; updateOdds(); });
  $('btn-decide').addEventListener('click', run);
  $('btn-again').addEventListener('click', run);
  $('question').addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
  $('btn-clear-history').addEventListener('click', () => { history = []; renderHistory(); });
  updateOdds();
})(typeof window !== 'undefined' ? window : globalThis);
