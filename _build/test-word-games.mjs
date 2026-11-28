// Checks the Word Games tools against the spec checklists, plus the word list,
// the pages and the links. Run: node _build/test-word-games.mjs
// (after node _build/build-word-games.mjs and node _build/build-kitchen.mjs)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORD_GAMES, wordGameUrl } from './word-games/list.mjs';
import { keep } from './word-games/filters.mjs';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const W = require('../assets/js/word-games.js');
const C = require('../word-games/word-counter/tool.js');
const page = (p) => readFileSync(join(ROOT, p, 'index.html'), 'utf8');

let fails = 0, passes = 0;
function check(cond, msg) { if (cond) passes++; else { fails++; console.log('FAIL', msg); } }
const eq = (a, b, msg) => check(JSON.stringify(a) === JSON.stringify(b), `${msg} (got ${JSON.stringify(a)})`);
const sorted = (s) => [...s].sort().join('');

// ── Word list ────────────────────────────────────────────────────────────────
const L = W.lists();
const all = L.flat().filter(Boolean);
check(all.length > 50000, `list has ${all.length} words`);
check(all.every((w) => /^[a-z]{2,15}$/.test(w)), 'every word is 2–15 lowercase letters');
check(all.every(keep), 'every word passes the filters');
check(new Set(all).size === all.length, 'no duplicates');
L.forEach((list, n) => { if (list) check(list.every((w, i) => w.length === n && (i === 0 || list[i - 1] < w)), `length ${n} list is sorted`); });
['cat', 'act', 'at', 'listen', 'silent', 'enlist', 'inset', 'tinsel', 'cats', 'cut', 'cot', 'quiz', 'retains'].forEach((w) => check(W.has(w), `knows ${w}`));
['kg', 'ft', 'mph', 'etc', 'blvd', 'ok'].forEach((w) => check(!W.has(w), `drops abbreviation ${w}`));
['fuck', 'shitty', 'nigger', 'faggot', 'whore', 'tits', 'retarded'].forEach((w) => check(!W.has(w), `drops offensive ${w.slice(0, 2)}…`));
['cock', 'tit', 'ass', 'prick', 'hello', 'zebra'].forEach((w) => check(W.has(w), `keeps everyday word ${w}`));
check(!all.some((w) => /^[a-z]$/.test(w)), 'no single letters');
const wl = readFileSync(join(ROOT, 'assets/js/wordlist.js'), 'utf8');
check(/Copyright 2000-2026 by Kevin Atkinson/.test(wl) && /Permission to use, copy, modify/.test(wl), 'SCOWL notice ships with the list');

// ── 1. Unscrambler (spec checklist) ──────────────────────────────────────────
const u = (s, f) => W.unscramble(s, f).words;
const tca = u('tca');
check(['cat', 'act', 'at'].every((w) => tca.includes(w)), '"tca" finds CAT, ACT, AT');
check(!tca.includes('tat'), 'letters are not reused');
const listen = u('listen');
['listen', 'silent', 'enlist', 'inset', 'tinsel'].forEach((w) => check(listen.includes(w), `"listen" finds ${w}`));
check(listen.every((w, i) => i === 0 || listen[i - 1].length > w.length || (listen[i - 1].length === w.length && listen[i - 1] < w)), 'grouped longest first, A to Z inside a length');
const five = u('listen', { len: '5' });
check(five.length > 0 && five.every((w) => w.length === 5), 'length 5 shows only 5-letter words');
const s = u('listen', { starts: 's' });
check(s.length > 0 && s.every((w) => w[0] === 's'), 'starts-with filter');
const combo = u('listen', { len: '5', starts: 's' });
check(combo.length > 0 && combo.every((w) => w.length === 5 && w[0] === 's'), 'filters combine');
check(u('listen', { ends: 't' }).every((w) => w.endsWith('t')), 'ends-with filter');
check(u('listen', { contains: 'l' }).every((w) => w.includes('l')), 'contains filter');
check(u('unscrambled', { len: '7+' }).every((w) => w.length >= 7), '7+ filter');
check(u('listen', { starts: 'S' }).length === s.length, 'filters ignore case');
eq(W.unscramble('abcdefghijklmnop').error, "That's 16 letters. The limit is 15.", 'over 15 letters errors');
check(!!W.unscramble('').error && !!W.unscramble('  !! ').error, 'empty input errors');
check(!!W.unscramble('a').error, 'one letter errors');
eq(u('T, C - A'), tca, 'spaces and non-letters are ignored');
check(!W.unscramble('abcdefghijklmno').error, '15 letters is fine');
// Every result really fits in the letters.
for (const q of ['listen', 'retains', 'scrabble', 'qwertyuiopasdfg', 'aeiou']) {
  const have = sorted(q);
  for (const w of u(q)) {
    let rest = have;
    let ok = true;
    for (const ch of w) { const i = rest.indexOf(ch); if (i < 0) { ok = false; break; } rest = rest.slice(0, i) + rest.slice(i + 1); }
    check(ok, `${w} fits in ${q}`);
  }
}
// And nothing that fits is missed (brute check against the list).
const fits = (w, q) => { const c = {}; for (const ch of q) c[ch] = (c[ch] || 0) + 1; for (const ch of w) { if (!c[ch]) return false; c[ch]--; } return true; };
eq(u('retains').length, all.filter((w) => w.length <= 7 && fits(w, 'retains')).length, 'finds every word in RETAINS');
// Speed: 15 letters should be quick.
let t0 = performance.now();
for (let i = 0; i < 20; i++) W.unscramble('etaoinshrdlucmf');
const ms = (performance.now() - t0) / 20;
check(ms < 60, `15-letter search takes ${ms.toFixed(1)} ms`);
check(u('etaoinshrdlucmf').length > W.MAX_SHOWN, 'a big search finds more than 200 (so the cap shows)');

// ── 2. Anagram solver (spec checklist) ───────────────────────────────────────
const a = (s, f) => W.anagrams(s, f).words;
const al = a('listen');
check(al.includes('silent') && al.includes('enlist'), '"listen" finds SILENT and ENLIST');
eq(al, ['enlist', 'inlets', 'listen', 'silent', 'tinsel'], 'LISTEN anagrams match the page text');
const ac = a('cat');
check(ac.includes('act') && ac.includes('cat'), '"cat" finds ACT and CAT');
eq(a('xyz'), [], '"xyz" has no anagram');
check(al.every((w) => sorted(w) === sorted('listen')), 'every result uses every letter exactly once');
check([...al].sort().join() === al.join(), 'alphabetical');
check(a('listen', { contains: 'z' }).length === 0, 'contains filter');
check(!!W.anagrams('abcdefghijklmnop').error, 'over 15 letters errors');
check(!a('listens').includes('listen'), 'no shorter words');

// ── 3. Scrabble (spec checklist) ─────────────────────────────────────────────
const sc = (s, f) => W.scrabble(s, f);
const cat = sc('cat').words;
const find = (list, w) => list.find((m) => m.word === w);
check(find(cat, 'cat').score === 5 && find(cat, 'act').score === 5 && find(cat, 'at').score === 2, 'CAT 5, ACT 5, AT 2');
const blank = sc('c?t').words;
['cat', 'cut', 'cot'].forEach((w) => check(find(blank, w) && find(blank, w).blanks.length === 1, `c?t finds ${w} with a blank`));
check(find(blank, 'cat').blanks === 'a' && find(blank, 'cat').score === 4, 'blank shown as A, worth 0 (CAT = 4)');
check(find(sc('c_t').words, 'cut').blanks === 'u', '_ works as a blank');
check(find(sc('quiz').words, 'quiz').score === 22, 'QUIZ = 22');
check(W.score('quiz') === 22 && W.score('jx') === 16, 'tile values');
const rs = sc('retain?').words;
check(rs.every((m, i) => i === 0 || rs[i - 1].score > m.score || (rs[i - 1].score === m.score && rs[i - 1].word < m.word)), 'sorted by score, then A to Z');
check(rs.length > 0 && rs.every((m) => m.word.length <= 7), 'no word longer than the rack');
check(find(sc('cats').words, 'cats').blanks === '' && find(sc('cat?').words, 'cats').blanks === 's', 'real tiles used before blanks');
check(sc('ca??').words.some((m) => m.blanks.length === 2), 'two blanks');
eq(sc('abcdefgh').error, "That's 8 tiles. A Scrabble rack holds 7.", 'more than 7 tiles errors');
eq(sc('a???').error, "That's 3 blanks. A Scrabble set has 2.", 'more than 2 blanks errors');
check(!!sc('a').error && !!sc('').error, 'too few tiles errors');
check(sc('retains', { len: '7' }).words.every((m) => m.word.length === 7), 'length filter');
check(sc('retains', { starts: 's', ends: 't' }).words.every((m) => m.word[0] === 's' && m.word.endsWith('t')), 'starts and ends filters');
// Every Scrabble result is makeable with the blanks it claims, and scored right.
for (const m of rs) {
  const real = m.word.split('');
  for (const b of m.blanks) real.splice(real.indexOf(b), 1);
  check(fits(real.join(''), 'retain') && m.score === W.score(m.word) - W.score(m.blanks || ''), `${m.word} makeable and scored`);
}
t0 = performance.now();
for (let i = 0; i < 10; i++) W.scrabble('ret??ns');
check((performance.now() - t0) / 10 < 120, 'two-blank search is quick');

// ── 4. Word counter (spec checklist) ─────────────────────────────────────────
const hw = C.count('Hello world.');
check(hw.words === 2 && hw.chars === 12 && hw.charsNoSpaces === 11 && hw.sentences === 1 && hw.paragraphs === 1, '"Hello world." = 2 words, 12/11 chars, 1 sentence, 1 paragraph');
const w400 = Array(400).fill('word').join(' ');
eq(C.count(w400).reading, 'about 2 minutes', '400 words reads in about 2 minutes');
eq(C.count(w400).speaking, 'about 3 minutes', '400 words speaks in about 3 minutes (400/130)');
const empty = C.count('');
check(empty.words === 0 && empty.chars === 0 && empty.charsNoSpaces === 0 && empty.sentences === 0 && empty.paragraphs === 0 && empty.reading === '0 minutes', 'empty text is all 0');
check(C.count("Don't stop. It's well-known — 3.5 times!").words === 6, 'punctuation does not split words; a lone dash is not a word');
eq(C.sentenceCount('Mr. Smith met Dr. Jones. They talked, e.g. about rain! Did it stop?'), 3, 'abbreviations do not end sentences');
eq(C.sentenceCount('No end punctuation here'), 1, 'trailing text is a sentence');
eq(C.count('One.\n\nTwo.\n\n\nThree.\nStill three.').paragraphs, 3, 'paragraphs split on blank lines');
eq(C.count('the cat and the cat and a dog').top, [{ word: 'cat', n: 2 }, { word: 'dog', n: 1 }], 'top words skip stop words');
['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is', 'it'].forEach((w) => check(C.STOP.has(w), `stop list has "${w}"`));
eq(C.duration(1, 200), 'under a minute', 'short text');
eq(C.duration(12000 + 1000, 200), 'about 1 hour 5 minutes', 'long text');
const big = Array.from({ length: 12000 }, (_, i) => (i % 15 === 14 ? 'end.' : `w${i % 300}`)).join(' ');
t0 = performance.now();
const bc = C.count(big);
check(bc.words === 12000 && performance.now() - t0 < 50, `12,000 words counted in ${(performance.now() - t0).toFixed(1)} ms`);
check(/Copy counts/.test(page('word-games/word-counter')) && /Clear/.test(page('word-games/word-counter')), 'Clear and Copy counts buttons');

// ── Pages, links, sitemap, homepage, llms.txt ────────────────────────────────
const sm = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const home = readFileSync(join(ROOT, 'index.html'), 'utf8');
const llms = readFileSync(join(ROOT, 'llms.txt'), 'utf8');
const TITLES = {
  'word-unscrambler': 'Word Unscrambler | Unscramble Letters Into Words, Free | Lazy Cat Tools',
  'anagram-solver': 'Anagram Solver | Find Anagrams of Any Word, Free | Lazy Cat Tools',
  'scrabble-word-finder': 'Scrabble Word Finder | Find Words &amp; Scores, Free | Lazy Cat Tools',
  'word-counter': 'Word Counter | Count Words &amp; Characters, Free | Lazy Cat Tools',
};
for (const t of WORD_GAMES) {
  const path = wordGameUrl(t);
  const html = page(path.replace(/^\/|\/$/g, ''));
  check(html.includes(`<title>${TITLES[t.slug]}</title>`), `${t.slug} title tag`);
  check(html.includes(`<h1>${t.name}</h1>`), `${t.slug} H1`);
  check(new RegExp(`<loc>https://lazycattools.com${path}</loc>\\s*<changefreq>monthly</changefreq>\\s*<priority>0.8</priority>`).test(sm), `${path} in sitemap at 0.8`);
  check(home.includes(`href="${path}"`), `${path} on the homepage`);
  check(llms.includes(`(https://lazycattools.com${path})`), `${path} in llms.txt`);
  check(/More word games/.test(html) && html.includes('href="/#word-games"'), `${t.slug} has More word games and a link to all tools`);
  WORD_GAMES.filter((o) => o !== t).forEach((o) => check(html.includes(`href="${wordGameUrl(o)}"`), `${t.slug} links to ${o.slug}`));
  check(/runs in your browser/i.test(html) && /nothing (you type )?is sent|isn't uploaded/i.test(html), `${t.slug} says it's private`);
  check((html.match(/<details/g) || []).length >= 4, `${t.slug} has 4+ FAQs`);
  check(html.indexOf('class="tool-card"') < html.indexOf('ad-mid'), `${t.slug} ad comes after the tool`);
  check(!/\{\{WORDS\}\}/.test(html), `${t.slug} placeholders filled`);
  check(html.includes('word-games.css?v=') && html.includes(`tool.js?v=`), `${t.slug} loads its styles and script`);
  check(t.wordlist === html.includes('wordlist.js?v='), `${t.slug} loads the word list only if it needs it`);
  check(!/<button(?![^>]*type=)/.test(html.replace(/<button[^>]*type="(button|submit)"/g, '')), `${t.slug} buttons have a type`);
  check(/aria-live="polite"/.test(html), `${t.slug} announces results`);
}
check(/Anagrams use all your letters\. For shorter words, use the <a href="\/word-games\/word-unscrambler\/">Word Unscrambler<\/a>/.test(page('word-games/anagram-solver')), 'anagram page says the difference in one line');
const scr = page('word-games/scrabble-word-finder');
check(/\?<\/strong> or <strong>_<\/strong>/.test(scr) && scr.indexOf('rack-help') < scr.indexOf('id="letters"'), 'blank instructions sit above the input');
check(/<th scope="row">10 points<\/th><td>Q Z<\/td>/.test(scr) && /<th scope="row">0 points<\/th><td>Blank tile<\/td>/.test(scr), 'score table');
check(/before double and triple/.test(scr) && /Words With Friends gives some letters different values/.test(scr), 'board-bonus and WWF notes');
check(/trademark of Hasbro/.test(scr), 'trademark note');
check(home.indexOf('id="kitchen-heading"') < home.indexOf('id="word-games-heading"'), 'Word Games section after Kitchen');
check(!/Math\.random/.test(readFileSync(join(ROOT, 'assets/js/word-games.js'), 'utf8')), 'no randomness used');

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
