// Word engine for the Word Unscrambler, Anagram Solver and Scrabble Word Finder.
// The words come from /assets/js/wordlist.js (window.WORDLIST), loaded first.
// Each search checks every word of a usable length against a 26-slot letter
// count of the input. That's about 60,000 quick checks, a few milliseconds,
// and no permutations are ever generated.
// Runs in the browser (window.WordGames) and in Node tests (module.exports).

(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const RAW = isNode ? require('./wordlist.js') : root.WORDLIST;

  const MAX_SHOWN = 200;
  const A = 97;

  let byLen = null;
  function lists() {
    if (!byLen) {
      byLen = [];
      for (const k of Object.keys(RAW)) byLen[+k] = RAW[k].split(' ');
    }
    return byLen;
  }
  const total = () => lists().reduce((s, l) => s + (l ? l.length : 0), 0);
  const has = (w) => { const l = lists()[w.length]; return !!l && l.includes(w); };

  const letters = (s) => String(s).toLowerCase().replace(/[^a-z]/g, '');

  function counts(s) {
    const c = new Int8Array(26);
    for (let i = 0; i < s.length; i++) c[s.charCodeAt(i) - A]++;
    return c;
  }

  // Letters of `w` not covered by `have`, as a string ('' when it fits).
  // `left` is scratch space so a search makes no garbage per word.
  const left = new Int8Array(26);
  function missing(w, have, budget) {
    left.set(have);
    let out = '';
    for (let i = 0; i < w.length; i++) {
      const k = w.charCodeAt(i) - A;
      if (left[k] > 0) left[k]--;
      else { out += w[i]; if (out.length > budget) return null; }
    }
    return out;
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  // { len: 'all' | '2'…'6' | '7+' | '7', starts, ends, contains } — one letter each.
  function cleanFilters(f) {
    f = f || {};
    const one = (v) => letters(v || '').slice(0, 1);
    return { len: f.len || 'all', starts: one(f.starts), ends: one(f.ends), contains: one(f.contains) };
  }
  function passes(w, f) {
    if (f.len !== 'all') {
      if (f.len.endsWith('+')) { if (w.length < parseInt(f.len, 10)) return false; }
      else if (w.length !== +f.len) return false;
    }
    if (f.starts && w[0] !== f.starts) return false;
    if (f.ends && w[w.length - 1] !== f.ends) return false;
    if (f.contains && w.indexOf(f.contains) < 0) return false;
    return true;
  }

  // ── Input checks ───────────────────────────────────────────────────────────
  function checkLetters(raw, min, max, noun) {
    const s = letters(raw);
    if (!s.length) return { error: `Type some letters to ${noun}.` };
    if (s.length < min) return { error: `Enter at least ${min} letters.` };
    if (s.length > max) return { error: `That's ${s.length} letters. The limit is ${max}.` };
    return { letters: s };
  }

  // ── 1. Unscrambler: every word that fits inside the letters ────────────────
  function unscramble(raw, filters) {
    const chk = checkLetters(raw, 2, 15, 'unscramble');
    if (chk.error) return chk;
    const s = chk.letters, have = counts(s), f = cleanFilters(filters), L = lists();
    const words = [];
    for (let n = Math.min(15, s.length); n >= 2; n--) {
      const list = L[n];
      if (!list) continue;
      for (const w of list) if (passes(w, f) && missing(w, have, 0) === '') words.push(w);
    }
    // Lists are alphabetical already, and we walked longest first.
    return { letters: s, words };
  }

  // ── 2. Anagram solver: words that use every letter exactly once ────────────
  function anagrams(raw, filters) {
    const chk = checkLetters(raw, 2, 15, 'search');
    if (chk.error) return chk;
    const s = chk.letters, have = counts(s), f = cleanFilters(filters);
    const words = (lists()[s.length] || []).filter((w) => passes(w, f) && missing(w, have, 0) === '');
    return { letters: s, words };
  }

  // ── 3. Scrabble: rack of up to 7 tiles, up to 2 blanks ─────────────────────
  // Standard English Scrabble tile values.
  const VALUES = { a: 1, e: 1, i: 1, o: 1, u: 1, l: 1, n: 1, s: 1, t: 1, r: 1, d: 2, g: 2, b: 3, c: 3, m: 3, p: 3,
    f: 4, h: 4, v: 4, w: 4, y: 4, k: 5, j: 8, x: 8, q: 10, z: 10 };
  const RACK_MAX = 7, BLANKS_MAX = 2;

  function score(w, blanks) {
    let s = 0;
    for (const ch of w) s += VALUES[ch];
    for (const ch of blanks || '') s -= VALUES[ch];
    return s;
  }

  function parseRack(raw) {
    const str = String(raw).toLowerCase();
    const real = str.replace(/[^a-z]/g, '');
    const blanks = (str.match(/[?_]/g) || []).length;
    const tiles = real.length + blanks;
    if (!tiles) return { error: 'Type your rack letters. Use ? for a blank tile.' };
    if (tiles < 2) return { error: 'Enter at least 2 tiles.' };
    if (tiles > RACK_MAX) return { error: `That's ${tiles} tiles. A Scrabble rack holds ${RACK_MAX}.` };
    if (blanks > BLANKS_MAX) return { error: `That's ${blanks} blanks. A Scrabble set has ${BLANKS_MAX}.` };
    return { real, blanks, tiles };
  }

  // Blanks always stand for the letters the rack is missing, so real tiles
  // (which score points) are used first and every word gets its best score.
  function scrabble(raw, filters) {
    const r = parseRack(raw);
    if (r.error) return r;
    const have = counts(r.real), f = cleanFilters(filters), L = lists(), out = [];
    for (let n = 2; n <= r.tiles; n++) {
      for (const w of L[n] || []) {
        if (!passes(w, f)) continue;
        const miss = missing(w, have, r.blanks);
        if (miss !== null) out.push({ word: w, score: score(w, miss), blanks: miss });
      }
    }
    out.sort((a, b) => b.score - a.score || (a.word < b.word ? -1 : a.word > b.word ? 1 : 0));
    return { rack: r, words: out };
  }

  const api = { MAX_SHOWN, VALUES, RACK_MAX, BLANKS_MAX, letters, unscramble, anagrams, scrabble, score, parseRack, total, has, lists };

  // ── Browser: shared result rendering ───────────────────────────────────────
  if (!isNode && typeof document !== 'undefined') {
    const R = root.Rand;
    const up = (w) => w.toUpperCase();
    const fmt = (n) => n.toLocaleString();

    // A word row: the word, optional extras, and a Copy button.
    api.wordItem = function (word, extra) {
      const li = document.createElement('li');
      const w = document.createElement('span');
      w.className = 'wg-word';
      w.textContent = word;
      li.appendChild(w);
      if (extra) li.appendChild(extra);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wg-copy';
      b.textContent = 'Copy';
      b.setAttribute('aria-label', `Copy ${up(word)}`);
      b.addEventListener('click', async () => {
        const ok = await R.copy(up(word));
        R.toast(ok ? `Copied ${up(word)}` : 'Copy failed. Try again.');
      });
      li.appendChild(b);
      return li;
    };

    // "214 words found, showing the first 200."
    api.summary = function (n, noun) {
      const found = `${fmt(n)} ${n === 1 ? noun : noun + 's'} found`;
      return n > MAX_SHOWN ? `${found}, showing the first ${MAX_SHOWN}.` : `${found}.`;
    };

    // Wire a "Copy all" button to whatever the page last found.
    api.copyAll = function (btn, getWords) {
      btn.addEventListener('click', async () => {
        const words = getWords();
        if (!words.length) return;
        const ok = await R.copy(words.map(up).join('\n'));
        R.toast(ok ? `Copied ${fmt(words.length)} ${words.length === 1 ? 'word' : 'words'}` : 'Copy failed. Try again.');
      });
    };

    api.showError = function (el, input, msg) {
      el.textContent = msg || '';
      el.hidden = !msg;
      if (input) {
        if (msg) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    };

    // Read the optional filter controls inside `root`.
    api.readFilters = function (scope) {
      const v = (name) => { const el = scope.querySelector(`[data-filter="${name}"]`); return el ? el.value : ''; };
      return { len: v('len') || 'all', starts: v('starts'), ends: v('ends'), contains: v('contains') };
    };
    api.clearFilters = function (scope) {
      scope.querySelectorAll('[data-filter]').forEach((el) => { el.value = el.tagName === 'SELECT' ? 'all' : ''; });
    };
    api.anyFilter = function (f) { return f.len !== 'all' || !!(f.starts || f.ends || f.contains); };
  }

  if (isNode) module.exports = api;
  else root.WordGames = api;
})(typeof window !== 'undefined' ? window : globalThis);
