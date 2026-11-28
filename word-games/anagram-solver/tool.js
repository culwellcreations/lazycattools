// Anagram Solver page. The search itself is WordGames.anagrams in /assets/js/word-games.js.
(function () {
  'use strict';
  const W = window.WordGames;
  const $ = (id) => document.getElementById(id);
  const input = $('letters');
  const form = $('wg-form');
  let found = [];
  let searched = false;

  function updateCount() {
    const n = W.letters(input.value).length;
    $('letter-count').textContent = `${n} ${n === 1 ? 'letter' : 'letters'}`;
  }

  function render(res, f) {
    found = res.words;
    const box = $('word-groups');
    box.innerHTML = '';
    $('results-heading').textContent = `Anagrams of ${res.letters.toUpperCase()}`;
    $('summary').textContent = W.summary(found.length, 'anagram');

    if (!found.length) {
      const p = document.createElement('p');
      p.className = 'wg-empty';
      if (f.contains) {
        p.textContent = `No anagram of these letters contains ${f.contains.toUpperCase()}. Try clearing Contains.`;
      } else {
        p.append('No anagram found for these letters. Try the ');
        const a = document.createElement('a');
        a.href = '/word-games/word-unscrambler/';
        a.textContent = 'Word Unscrambler';
        p.append(a, ' for shorter words.');
      }
      box.appendChild(p);
    } else {
      const ul = document.createElement('ul');
      ul.className = 'wg-words';
      found.slice(0, W.MAX_SHOWN).forEach((w) => ul.appendChild(W.wordItem(w)));
      box.appendChild(ul);
    }

    $('btn-copy-all').hidden = !found.length;
    $('results').hidden = false;
    $('announce').textContent = found.length
      ? `${W.summary(found.length, 'anagram')} ${found.slice(0, 10).map((w) => w.toUpperCase()).join(', ')}${found.length > 10 ? ', and more' : ''}.`
      : 'No anagram found for these letters. Try the Word Unscrambler for shorter words.';
  }

  function run() {
    const f = W.readFilters(form);
    const res = W.anagrams(input.value, f);
    if (res.error) { W.showError($('form-error'), input, res.error); return; }
    W.showError($('form-error'), input, '');
    searched = true;
    render(res, f);
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
  input.addEventListener('input', () => { updateCount(); if (!input.value) W.showError($('form-error'), input, ''); });
  $('f-contains').addEventListener('input', () => { if (searched) run(); });
  W.copyAll($('btn-copy-all'), () => found);
  updateCount();
})();
