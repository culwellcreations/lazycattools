// Checks the shared randomness helpers and the 7 generated randomizers,
// following each tool's checklist from the build spec.
// Run: node _build/test-randomizers.mjs
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RANDOMIZERS } from './randomizers/list.mjs';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const R = require('../assets/js/rand.js');
const tool = (slug) => require(`../tools/${slug}/tool.js`);

let fails = 0, passes = 0;
function check(cond, msg) { if (cond) passes++; else { fails++; console.log('FAIL', msg); } }
const near = (c, expect, tol) => Math.abs(c - expect) <= expect * tol;

// ── rand.js ──────────────────────────────────────────────────────────────────
{
  const counts = Array(7).fill(0);
  for (let i = 0; i < 70000; i++) counts[R.int(7)]++;
  counts.forEach((c, i) => check(near(c, 10000, 0.05), `int(7) value ${i} near uniform (${c})`));
  for (let i = 0; i < 2000; i++) { const x = R.int(3e12); check(x >= 0 && x < 3e12 && Number.isInteger(x), 'int beyond 2^32 in range'); }
  check(R.shuffle([1, 2, 3, 4, 5]).sort().join() === '1,2,3,4,5', 'shuffle keeps items');
  const s = R.sample([...Array(50).keys()], 10);
  check(new Set(s).size === 10, 'sample has no repeats');
  check(R.weighted([0, 0, 0]) === -1, 'weighted with all zero');
  for (let i = 0; i < 500; i++) check(R.weighted([0, 5, 0]) === 1, 'weighted picks only nonzero');
  const src = readFileSync(join(ROOT, 'assets/js/rand.js'), 'utf8');
  check(!/Math\.random\s*\(/.test(src), 'rand.js never calls Math.random');
}

// ── 1. Random Number Generator ───────────────────────────────────────────────
{
  const T = tool('random-number-generator');
  const base = { min: 1, max: 100, count: 1, decimals: false, places: 0, repeats: true };
  for (let i = 0; i < 2000; i++) { const n = +T.generate(base).numbers[0]; check(n >= 1 && n <= 100 && Number.isInteger(n), '1–100 in range'); }
  const all = T.generate({ ...base, min: 1, max: 10, count: 10, repeats: false }).numbers.map(Number).sort((a, b) => a - b);
  check(all.join() === '1,2,3,4,5,6,7,8,9,10', '10 unique from 1–10 gives each once');
  check(T.generate({ ...base, min: 1, max: 10, count: 20, repeats: false }).error === 'You asked for 20 unique numbers, but 1–10 only has 10.', 'too many unique: spec error text');
  check(/bigger than the minimum/.test(T.generate({ ...base, min: 10, max: 5 }).error), 'max below min errors');
  check(/bigger/.test(T.generate({ ...base, min: 5, max: 5 }).error), 'max equal to min errors');
  const neg = T.generate({ ...base, min: -5, max: 5, count: 100 }).numbers.map(Number);
  check(neg.every((n) => n >= -5 && n <= 5) && neg.some((n) => n < 0), 'negative ranges work');
  const dec = T.generate({ ...base, min: 0, max: 1, count: 50, decimals: true, places: 3 }).numbers;
  check(dec.every((s) => /^\d\.\d{3}$/.test(s) && +s >= 0 && +s <= 1), 'decimals have 3 places, in range');
  const big = T.generate({ ...base, min: -1e9, max: 1e9, count: 100, repeats: false, decimals: true, places: 6 });
  check(big.numbers && new Set(big.numbers).size === 100, 'huge decimal range, no repeats');
  check(!!T.generate({ ...base, count: 101 }).error, 'count over 100 errors');
  const edges = new Set(); for (let i = 0; i < 400; i++) edges.add(+T.generate({ ...base, min: 1, max: 3 }).numbers[0]);
  check(edges.has(1) && edges.has(3), 'both ends of the range can come up');
}

// ── 2. Dice Roller ───────────────────────────────────────────────────────────
{
  const T = tool('dice-roller');
  const seen = new Set();
  for (let i = 0; i < 4000; i++) { const r = T.roll(20, 1, 0); check(r.total >= 1 && r.total <= 20, '1d20 lands 1–20'); seen.add(r.total); }
  check(seen.size === 20, 'every d20 face shows up');
  for (let i = 0; i < 2000; i++) { const r = T.roll(6, 2, 0); check(r.dice.length === 2 && r.total >= 2 && r.total <= 12, '2d6 gives two dice, 2–12'); }
  const m = T.roll(6, 3, 3);
  check(m.total === m.sum + 3 && T.maths(m) === `${m.dice.join(' + ')} + 3 = ${m.total}`, 'modifier added once and shown in the maths');
  const neg = T.roll(8, 2, -2);
  check(T.maths(neg).includes('− 2') && neg.total === neg.sum - 2, 'negative modifier');
  for (const s of T.SIDES) { const r = T.roll(s, 10, 0); check(r.dice.every((d) => d >= 1 && d <= s), `d${s} faces in range`); }
  check(!!T.roll(7, 1, 0).error && !!T.roll(6, 11, 0).error && !!T.roll(6, 1, 11).error, 'bad die, count or modifier errors');
  check(T.d20Note({ sides: 20, count: 1, dice: [20] }) === 'Natural 20' && T.d20Note({ sides: 20, count: 1, dice: [1] }) === 'Natural 1', 'nat 20 / nat 1 labels');
  check(T.d20Note({ sides: 6, count: 1, dice: [1] }) === '', 'no label on other dice');
  check(T.label({ count: 3, sides: 6, mod: 2 }) === '3d6+2', 'roll label');
}

// ── 3. Giveaway Winner Picker ────────────────────────────────────────────────
{
  const T = tool('giveaway-winner-picker');
  const ten = Array.from({ length: 10 }, (_, i) => `Person ${i + 1}`);
  const one = T.draw(ten, { dedupe: true, winners: 1, alternates: 0 });
  check(one.winners.length === 1 && ten.includes(one.winners[0]), '10 entries, 1 winner');
  for (let i = 0; i < 500; i++) {
    const r = T.draw(ten, { dedupe: true, winners: 2, alternates: 1 });
    check(new Set([...r.winners, ...r.alternates]).size === 3, '2 winners + 1 alternate are 3 different people');
  }
  const dupes = ['@Sam', '@sam', 'Alex', 'Alex', ' Jordan ', 'Casey'];
  const d = T.draw(T.parse(dupes.join('\n')), { dedupe: true, winners: 1, alternates: 0 });
  check(d.removed === 2 && d.pool === 4, 'dedupe removes and counts duplicates (case-insensitive)');
  const both = new Set();
  for (let i = 0; i < 300; i++) T.draw(['A', 'A', 'B'], { dedupe: false, winners: 2, alternates: 0 }).winners.forEach((w) => both.add(w));
  check(T.draw(['A', 'A', 'B'], { dedupe: false, winners: 2, alternates: 0 }).pool === 3, 'dedupe off keeps duplicates');
  check(/only 3 entries/.test(T.draw(['A', 'B', 'C'], { dedupe: true, winners: 2, alternates: 2 }).error), 'winners + alternates over entries errors');
  check(!!T.draw(['A'], { dedupe: true, winners: 1, alternates: 0 }).error, 'fewer than 2 entries errors');
  check(!!T.draw(Array.from({ length: 1001 }, (_, i) => `e${i}`), { dedupe: true, winners: 1, alternates: 0 }).error, 'over 1,000 entries errors');
  const counts = Object.fromEntries(ten.map((n) => [n, 0]));
  for (let i = 0; i < 20000; i++) counts[T.draw(ten, { dedupe: true, winners: 1, alternates: 0 }).winners[0]]++;
  Object.values(counts).forEach((c) => check(near(c, 2000, 0.1), `giveaway winner near uniform (${c})`));
}

// ── 4. Random Order Generator ────────────────────────────────────────────────
{
  const T = tool('random-order-generator');
  const items = T.parse('Alex\nSam\n\n  Jordan\nTaylor\nCasey\n');
  check(items.length === 5, 'blank lines ignored');
  const orders = new Set();
  for (let i = 0; i < 200; i++) {
    const o = T.order(items).order;
    check(o.length === 5 && [...o].sort().join() === [...items].sort().join(), 'every item once');
    orders.add(o.join());
  }
  check(orders.size > 50, `shuffle again gives different orders (${orders.size} distinct of 120)`);
  check(T.order(['A', 'A', 'B']).order.filter((x) => x === 'A').length === 2, 'duplicates kept');
  check(T.asText(['Sam', 'Alex']) === '1. Sam\n2. Alex', 'copy text is numbered');
  check(!!T.order(['A']).error && !!T.order(Array(501).fill('x')).error, 'limits');
}

// ── 5. Team Name Generator ───────────────────────────────────────────────────
{
  const T = tool('random-team-name-generator');
  for (const [k, t] of Object.entries(T.THEMES)) {
    check(t.adj.length >= 30 && t.noun.length >= 30, `${k}: 30+ adjectives and nouns`);
    check(new Set(t.adj).size === t.adj.length && new Set(t.noun).size === t.noun.length, `${k}: no repeated words`);
    for (let i = 0; i < 100; i++) {
      const r = T.generate(k, 10).names;
      check(r.length === 10 && new Set(r).size === 10, `${k}: batch of 10 all different`);
      check(r.every((n) => t.adj.some((a) => n.startsWith(a + ' ')) && t.noun.some((w) => n.endsWith(' ' + w))), `${k}: names come from its own lists`);
      check(r.every((n) => { const a = t.adj.find((x) => n.startsWith(x + ' ')); return !T.clash(a, n.slice(a.length + 1)); }), `${k}: no doubled words`);
    }
  }
  check(T.generate('gaming', 5).names.length === 5, 'batch of 5');
  check(!!T.generate('gaming', 11).error && !!T.generate('nope', 5).error, 'bad count or theme errors');
}

// ── 6. Yes or No ─────────────────────────────────────────────────────────────
{
  const T = tool('yes-or-no');
  const c = { Yes: 0, No: 0, Maybe: 0 };
  for (let i = 0; i < 40000; i++) c[T.decide([45, 45, 10]).answer]++;
  check(near(c.Yes, 18000, 0.05) && near(c.No, 18000, 0.05) && near(c.Maybe, 4000, 0.1), `default weights 45/45/10 (${c.Yes}/${c.No}/${c.Maybe})`);
  for (let i = 0; i < 500; i++) check(T.decide([100, 0, 0]).answer === 'Yes', '100/0/0 always Yes');
  for (let i = 0; i < 500; i++) check(T.decide([50, 50, 0]).answer !== 'Maybe', '50/50/0 never Maybe');
  check(T.decide([0, 0, 0]).error === 'Set at least one weight above 0.', '0/0/0 spec error text');
  check(!!T.decide([101, 0, 0]).error && !!T.decide([-1, 5, 5]).error && !!T.decide([NaN, 5, 5]).error, 'out of range weights error');
  const o = T.odds([2, 1, 1]);
  check(o[0] === 50 && o[1] === 25, 'odds normalise');
}

// ── 7. Password Generator ────────────────────────────────────────────────────
{
  const T = tool('random-password-generator');
  const on = { length: 16, lower: true, upper: true, digits: true, symbols: true, noLookalikes: false };
  for (let i = 0; i < 1000; i++) {
    const p = T.generate(on).password;
    check(p.length === 16, 'length 16');
    check(/[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p), 'one of each type turned on');
  }
  for (let i = 0; i < 500; i++) check(/^[A-Za-z0-9]+$/.test(T.generate({ ...on, symbols: false }).password), 'symbols off removes symbols');
  for (let i = 0; i < 500; i++) check(!/[l1IO0]/.test(T.generate({ ...on, length: 64, noLookalikes: true }).password), 'look-alikes removed');
  check(T.generate({ ...on, lower: false, upper: false, digits: false, symbols: false }).error === 'Turn on at least one type of character.', 'all off errors');
  check(!!T.generate({ ...on, length: 7 }).error && !!T.generate({ ...on, length: 65 }).error, 'length limits');
  check(T.generate({ ...on, length: 64 }).password.length === 64 && T.generate({ ...on, length: 8 }).password.length === 8, 'length 8 and 64');
  const s16 = T.strength(on), s8 = T.strength({ ...on, length: 8 }), sLower = T.strength({ ...on, upper: false, digits: false, symbols: false });
  check(s16.bits === Math.round(16 * Math.log2(26 + 26 + 10 + T.SETS.symbols.length)) && s16.label === 'Strong', `16 chars all types is Strong (${s16.bits} bits)`);
  check(s8.bits < s16.bits && sLower.bits < s16.bits, 'strength drops with length and fewer types');
  check(T.strength({ ...on, length: 8, upper: false, digits: false, symbols: false }).label === 'Weak', '8 lowercase is Weak');
  const counts = {};
  for (let i = 0; i < 3000; i++) for (const ch of T.generate({ ...on, upper: false, digits: false, symbols: false, length: 20 }).password) counts[ch] = (counts[ch] || 0) + 1;
  check(Object.keys(counts).length === 26 && Object.values(counts).every((c) => near(c, 60000 / 26, 0.08)), 'lowercase letters near uniform');
}

// ── Every randomizer: no Math.random, page exists, linked everywhere ────────
for (const t of RANDOMIZERS) {
  const html = readFileSync(join(ROOT, 'tools', t.slug, 'index.html'), 'utf8');
  check(html.includes('<!-- randomizers:start'), `${t.slug}: has More randomizers block`);
  for (const o of RANDOMIZERS) if (o.slug !== t.slug) check(html.includes(`href="/tools/${o.slug}/"`), `${t.slug} links to ${o.slug}`);
  if (t.built === 'gen') {
    const js = readFileSync(join(ROOT, 'tools', t.slug, 'tool.js'), 'utf8');
    check(!/Math\.random\s*\(/.test(js), `${t.slug}: no Math.random`);
    check(/secure random number generator|Web Crypto/.test(html), `${t.slug}: page says how it's random`);
    check(/(nothing|isn't|aren't|never)[^.]*(sent|saved|uploaded)/i.test(html), `${t.slug}: page says nothing is sent or saved`);
    check(existsSync(join(ROOT, 'tools', t.slug, 'tool.js')), `${t.slug}: tool.js exists`);
  }
}
const home = readFileSync(join(ROOT, 'index.html'), 'utf8');
const sm = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
for (const t of RANDOMIZERS) {
  check(home.includes(`href="/tools/${t.slug}/"`), `homepage links ${t.slug}`);
  check(sm.includes(`/tools/${t.slug}/</loc>`), `sitemap has ${t.slug}`);
}

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
