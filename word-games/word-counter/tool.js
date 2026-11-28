// Word Counter. Logic first (also used by the Node test), then the page.
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;

  const READ_WPM = 200, SPEAK_WPM = 130;

  // Left out of "Most used words". Short on purpose: just the glue words.
  const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is', 'it',
    'i', 'you', 'that', 'for', 'on', 'with', 'as', 'at', 'be', 'was', 'are', 'this', 'but', 'by']);

  // A period after one of these doesn't end a sentence.
  const ABBR = new Set(['mr', 'mrs', 'ms', 'dr', 'prof', 'st', 'jr', 'sr', 'vs', 'etc', 'e.g', 'i.e', 'eg', 'ie',
    'no', 'inc', 'ltd', 'co', 'mt', 'ft', 'approx', 'dept', 'est', 'fig', 'vol', 'al',
    'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec']);

  const HAS_WORD = /[\p{L}\p{N}]/u;
  const tokens = (text) => String(text).split(/\s+/).filter((t) => HAS_WORD.test(t));

  function sentenceCount(text) {
    let n = 0, open = false;
    for (const tok of String(text).split(/\s+/)) {
      if (!tok) continue;
      if (HAS_WORD.test(tok)) open = true;
      const m = tok.match(/([.!?]+)['"”’)\]]*$/);
      if (!m || !open) continue;
      if (!/[!?]/.test(m[1]) && m[1] === '.') {
        const core = tok.slice(0, m.index).replace(/^['"“‘(\[]+/, '').toLowerCase();
        if (ABBR.has(core) || /^\p{L}$/u.test(core) || /^(\p{L}\.)+\p{L}$/u.test(core)) continue;
      }
      n++; open = false;
    }
    return n + (open ? 1 : 0);
  }

  const paragraphCount = (text) => String(text).split(/\n\s*\n/).filter((p) => HAS_WORD.test(p)).length;

  function topWords(list, k) {
    const freq = new Map();
    list.forEach((t, i) => {
      const w = t.toLowerCase().replace(/[’‘]/g, "'").replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
      if (!w || STOP.has(w) || /^\p{N}+$/u.test(w)) return;
      const e = freq.get(w);
      if (e) e.n++; else freq.set(w, { word: w, n: 1, first: i });
    });
    return [...freq.values()].sort((a, b) => b.n - a.n || a.first - b.first).slice(0, k).map(({ word, n }) => ({ word, n }));
  }

  // "under a minute", "about 2 minutes", "about 1 hour 5 minutes"
  function duration(words, wpm) {
    if (!words) return '0 minutes';
    const min = Math.round(words / wpm);
    if (min < 1) return 'under a minute';
    if (min < 60) return `about ${min} ${min === 1 ? 'minute' : 'minutes'}`;
    const h = Math.floor(min / 60), m = min % 60;
    return `about ${h} ${h === 1 ? 'hour' : 'hours'}${m ? ` ${m} ${m === 1 ? 'minute' : 'minutes'}` : ''}`;
  }

  function count(text) {
    text = String(text);
    const list = tokens(text);
    const words = list.length;
    const sentences = sentenceCount(text);
    return {
      words,
      chars: [...text].length,
      charsNoSpaces: [...text.replace(/\s/g, '')].length,
      sentences,
      paragraphs: paragraphCount(text),
      perSentence: sentences ? Math.round((words / sentences) * 10) / 10 : 0,
      reading: duration(words, READ_WPM),
      speaking: duration(words, SPEAK_WPM),
      top: topWords(list, 5),
    };
  }

  const asText = (c) => [
    `Words: ${c.words.toLocaleString()}`,
    `Characters: ${c.chars.toLocaleString()}`,
    `Characters without spaces: ${c.charsNoSpaces.toLocaleString()}`,
    `Sentences (approx.): ${c.sentences.toLocaleString()}`,
    `Paragraphs: ${c.paragraphs.toLocaleString()}`,
    `Reading time: ${c.reading}`,
    `Speaking time: ${c.speaking}`,
  ].join('\n');

  const logic = { READ_WPM, SPEAK_WPM, STOP, count, duration, sentenceCount, asText };
  if (isNode) { module.exports = logic; return; }

  // ─── Page ──────────────────────────────────────────────────────────────────
  const R = root.Rand;
  const $ = (id) => document.getElementById(id);
  const text = $('text');
  let last = count(text.value);
  let frame = 0, speakTimer = 0;

  function paint() {
    frame = 0;
    const c = last = count(text.value);
    const fmt = (n) => n.toLocaleString();
    $('c-words').textContent = fmt(c.words);
    $('c-chars').textContent = fmt(c.chars);
    $('c-nospace').textContent = fmt(c.charsNoSpaces);
    $('c-sentences').textContent = fmt(c.sentences);
    $('c-paragraphs').textContent = fmt(c.paragraphs);
    $('c-per').textContent = String(c.perSentence);
    $('c-read').textContent = c.reading;
    $('c-speak').textContent = c.speaking;

    const ol = $('top-words');
    ol.textContent = '';
    if (!c.top.length) {
      const li = document.createElement('li');
      li.textContent = 'None yet';
      ol.appendChild(li);
    }
    for (const t of c.top) {
      const li = document.createElement('li');
      const n = document.createElement('span');
      n.textContent = ` × ${t.n}`;
      li.append(t.word, n);
      ol.appendChild(li);
    }

    // Screen readers hear a short summary once typing pauses, not every keystroke.
    clearTimeout(speakTimer);
    speakTimer = setTimeout(() => {
      $('announce').textContent = `${fmt(c.words)} ${c.words === 1 ? 'word' : 'words'}, ${fmt(c.chars)} characters.`;
    }, 1200);
  }

  const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
  text.addEventListener('input', schedule);
  $('btn-clear').addEventListener('click', () => { text.value = ''; paint(); text.focus(); });
  R.copyButton($('btn-copy'), () => asText(last), 'Copied the counts');
  paint();
})(typeof window !== 'undefined' ? window : globalThis);
