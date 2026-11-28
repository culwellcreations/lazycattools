// Scrabble Word Finder page. The search and scoring are WordGames.scrabble in /assets/js/word-games.js.
(function () {
  'use strict';
  const W = window.WordGames;
  const $ = (id) => document.getElementById(id);
  const input = $('letters');
  let found = [];
  let searched = false;

  const up = (s) => s.toUpperCase();
  const blankText = (b) => (b.length === 1 ? `blank = ${up(b)}` : `blanks = ${b.split('').map(up).join(', ')}`);
  const pts = (n) => `${n} ${n === 1 ? 'pt' : 'pts'}`;

  function updateCount() {
    const s = input.value.toLowerCase();
    const n = s.replace(/[^a-z?_]/g, '').length;
    $('letter-count').textContent = `${n} ${n === 1 ? 'tile' : 'tiles'}`;
  }

  function render(res) {
    found = res.words;
    const box = $('word-groups');
    box.innerHTML = '';
    const r = res.rack;
    $('results-heading').textContent = `Words from ${up(r.real)}${'?'.repeat(r.blanks)}`;
    $('summary').textContent = W.summary(found.length, 'word');

    if (!found.length) {
      const p = document.createElement('p');
      p.className = 'wg-empty';
      p.textContent = W.anyFilter(W.readFilters($('filters')))
        ? 'No words match these filters. Try clearing one.'
        : 'No words found on this rack.';
      box.appendChild(p);
    } else {
      const ul = document.createElement('ul');
      ul.className = 'wg-words scored';
      for (const m of found.slice(0, W.MAX_SHOWN)) {
        const extra = document.createElement('span');
        extra.className = 'wg-pts';
        extra.textContent = pts(m.score);
        const li = W.wordItem(m.word, extra);
        const word = li.querySelector('.wg-word');
        if (m.blanks) {
          const b = document.createElement('span');
          b.className = 'wg-blank';
          b.textContent = ` (${blankText(m.blanks)})`;
          word.appendChild(b);
        }
        ul.appendChild(li);
      }
      box.appendChild(ul);
    }

    $('btn-copy-all').hidden = !found.length;
    $('results').hidden = false;
    box.scrollTop = 0;
    $('announce').textContent = `${W.summary(found.length, 'word')}${found.length ? ` Top scores: ${found.slice(0, 5).map((m) => `${up(m.word)} ${pts(m.score)}${m.blanks ? `, ${blankText(m.blanks)}` : ''}`).join('; ')}.` : ''}`;
  }

  function run() {
    const res = W.scrabble(input.value, W.readFilters($('filters')));
    if (res.error) { W.showError($('form-error'), input, res.error); return; }
    W.showError($('form-error'), input, '');
    searched = true;
    render(res);
  }

  $('wg-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  input.addEventListener('input', () => { updateCount(); if (!input.value) W.showError($('form-error'), input, ''); });
  $('filters').addEventListener('input', () => { if (searched) run(); });
  $('btn-clear-filters').addEventListener('click', () => { W.clearFilters($('filters')); if (searched) run(); });
  W.copyAll($('btn-copy-all'), () => found.map((m) => m.word));
  updateCount();
})();
