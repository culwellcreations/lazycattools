// Checks the Spin the Wheel logic. Run: node _build/test-spin-the-wheel.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const W = require('../tools/spin-the-wheel/wheel.js');

let fails = 0, passes = 0;
function check(cond, msg) { if (cond) passes++; else { fails++; console.log('FAIL', msg); } }

// Parsing
check(W.parseEntries('Alex\n Sam \n\nAlex').join('|') === 'Alex|Sam|Alex', 'lines, keeps duplicates');
check(W.parseEntries('Pizza, Tacos, Sushi').join('|') === 'Pizza|Tacos|Sushi', 'single comma line splits');
check(W.parseEntries('Mac, cheese\nPizza').length === 2, 'commas kept when there are several lines');

// Limits
check(W.validate(['A']) !== null, 'rejects 1 entry');
check(W.validate(['A', 'B']) === null, 'accepts 2');
check(W.validate(Array(100).fill('x')) === null, 'accepts 100');
check(W.validate(Array(101).fill('x')) !== null, 'rejects 101');

// Landing: the rotation spin() returns always lands on the chosen winner,
// away from slice edges, after at least 5 turns.
for (const n of [2, 3, 6, 7, 10, 37, 100]) {
  let rot = 0;
  for (let k = 0; k < 400; k++) {
    const { winner, rotation } = W.spin(rot, n);
    check(rotation - rot >= 5 * W.TAU, `n=${n} spins at least 5 turns`);
    check(W.indexAt(rotation, n) === winner, `n=${n} lands on winner`);
    const s = W.TAU / n;
    const a = ((-rotation % W.TAU) + W.TAU) % W.TAU;
    const frac = a / s - winner;
    check(frac > 0.1 && frac < 0.9, `n=${n} lands clear of slice edges (${frac.toFixed(3)})`);
    rot = rotation;
  }
}

// Fairness: 6 slices, each ~1/6
const counts = Array(6).fill(0);
const N = 60000;
for (let i = 0; i < N; i++) counts[W.spin(0, 6).winner]++;
counts.forEach((c, i) => check(Math.abs(c - N / 6) < N / 6 * 0.05, `slice ${i} near 1/6 (${c})`));

// Duplicates weight the wheel: Alex twice of 3 slices ≈ 2/3
const e = ['Alex', 'Sam', 'Alex'];
let alex = 0;
for (let i = 0; i < 30000; i++) if (e[W.spin(0, 3).winner] === 'Alex') alex++;
check(Math.abs(alex / 30000 - 2 / 3) < 0.02, `duplicates weight the odds (${(alex / 30000).toFixed(3)})`);

// Remove winner removes one copy only
check(W.removeOne(['A', 'B', 'A'], 2).join('|') === 'A|B', 'removes just the winning copy');

// Colors: stable per entry, no matching neighbors
const c1 = W.colorsFor(['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan']);
const c2 = W.colorsFor(['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley']);
check(c1[0] === c2[0] && c1[1] === c2[1], 'adding an entry keeps earlier colors');
for (const list of [['A', 'B'], ['A', 'A', 'A', 'A'], Array.from({ length: 100 }, (_, i) => `P${i}`), ['Yes', 'No', 'Maybe']]) {
  const c = W.colorsFor(list);
  for (let i = 1; i < c.length; i++) check(c[i] !== c[i - 1], `neighbors differ (${list.length}, ${i})`);
  if (c.length > 2) check(c[0] !== c[c.length - 1], `first and last differ (${list.length})`);
}

// Palette text contrast >= 4.5:1
function lum(hex) {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
for (const p of W.PALETTE) {
  const r = cr(p.bg, p.ink ? '#1C1C1C' : '#FFFFFF');
  check(r >= 4.5, `${p.bg} text contrast ${r.toFixed(2)}`);
}

// Share links
const list = ['Alex', 'Mac, cheese', 'Zoë'];
check(W.decodeEntries('?' + W.encodeEntries(list)).join('|') === list.join('|'), 'entries link round-trips (commas, accents)');
check(W.decodeEntries('?names=Team%201,Team%202').join('|') === 'Team 1|Team 2', 'reads ?names= from the team generator');
check(W.decodeEntries('') === null, 'no params, no list');
check(W.decodeEntries('?' + W.encodeEntries(Array(150).fill('x'))).length === 100, 'caps shared links at 100');

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
