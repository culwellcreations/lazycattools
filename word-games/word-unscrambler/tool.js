// Word Unscrambler page. The search itself is WordGames.unscramble in /assets/js/word-games.js.
(function () {
  'use strict';
  const W = window.WordGames;
  const $ = (id) => document.getElementById(id);
  const input = $('letters');
  let found = [];
  let searched = false;

  function updateCount() {
    const n = W.letters(input.value).length;
    $('letter-count').textContent = `${n} ${n === 1 ? 'letter' : 'letters'}`;
  }

  function render(res) {
    found = res.words;
    const box = $('word-groups');
    box.innerHTML = '';
    const shown = found.slice(0, W.MAX_SHOWN);
    const byLen = new Map();
    for (const w of found) byLen.set(w.length, (byLen.get(w.length) || 0) + 1);

    $('results-heading').textContent = `Words from ${res.letters.toUpperCase()}`;
    $('summary').textContent = W.summary(found.length, 'word');
    if (found.length > W.MAX_SHOWN) {
      const s = document.createElement('span');
      s.className = 'wg-sub';
      s.textContent = 'Use the filters to narrow it down.';
      $('summary').appendChild(s);
    }

    if (!found.length) {
      const p = document.createElement('p');
      p.className = 'wg-empty';
      p.textContent = W.anyFilter(W.readFilters($('filters')))
        ? 'No words match these filters. Try clearing one.'
        : 'No words found in these letters.';
      box.appendChild(p);
    }

    let i = 0;
    while (i < shown.length) {
      const len = shown[i].length;
      const group = document.createElement('div');
      group.className = 'wg-group';
      const h = document.createElement('h3');
      const ul = document.createElement('ul');
      ul.className = 'wg-words';
      let n = 0;
      while (i < shown.length && shown[i].length === len) { ul.appendChild(W.wordItem(shown[i])); i++; n++; }
      const all = byLen.get(len);
      h.textContent = `${len}-letter words (${n === all ? all : `${n} of ${all}`})`;
      group.append(h, ul);
      box.appendChild(group);
    }

    $('btn-copy-all').hidden = !found.length;
    $('results').hidden = false;
    box.scrollTop = 0;
    const top = shown.slice(0, 8).map((w) => w.toUpperCase()).join(', ');
    $('announce').textContent = `${W.summary(found.length, 'word')}${found.length ? ` Longest first: ${top}${found.length > 8 ? ', and more' : ''}.` : ''}`;
  }

  function run() {
    const res = W.unscramble(input.value, W.readFilters($('filters')));
    if (res.error) { W.showError($('form-error'), input, res.error); return; }
    W.showError($('form-error'), input, '');
    searched = true;
    render(res);
  }

  $('wg-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  input.addEventListener('input', () => { updateCount(); if (!input.value) W.showError($('form-error'), input, ''); });
  $('filters').addEventListener('input', () => { if (searched) run(); });
  $('btn-clear-filters').addEventListener('click', () => { W.clearFilters($('filters')); if (searched) run(); });
  W.copyAll($('btn-copy-all'), () => found);
  updateCount();
})();
