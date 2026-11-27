// Checks the Secret Santa draw rules. Run: node _build/test-secret-santa.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const SS = require('../tools/secret-santa-generator/draw.js');

let fails = 0, passes = 0;
function check(cond, msg) { if (cond) passes++; else { fails++; console.log('FAIL', msg); } }

function valid(pairs, names, excl = []) {
  const givers = pairs.map((p) => p[0]);
  const recips = pairs.map((p) => p[1]);
  const bad = new Set(excl.flatMap(([a, b]) => [`${a}>${b}`, `${b}>${a}`]));
  return givers.length === names.length
    && new Set(givers).size === names.length
    && new Set(recips).size === names.length
    && recips.every((r) => names.includes(r))
    && pairs.every(([g, r]) => g !== r && !bad.has(`${g}>${r}`));
}

// Parsing
check(SS.parseNames('Alex\n Sam \n\nJordan, Taylor').join('|') === 'Alex|Sam|Jordan|Taylor', 'parses lines and commas');

// Validation
check(!SS.draw(['A', 'B'], []).ok, 'rejects 2 people');
check(!SS.draw(Array.from({ length: 101 }, (_, i) => `P${i}`), []).ok, 'rejects 101 people');
const dup = SS.draw(['Alex', 'Sam', 'alex'], []);
check(!dup.ok && /alex/i.test(dup.error), 'names the duplicate (case-insensitive)');

// 3 names, no exclusions, many times
const three = ['A', 'B', 'C'];
for (let i = 0; i < 500; i++) check(valid(SS.draw(three, []).pairs, three), '3 names draw cleanly');

// 4 names with one exclusion pair never pairs them
const four = ['Alex', 'Sam', 'Jordan', 'Taylor'];
const ex = [['Alex', 'Sam']];
for (let i = 0; i < 1000; i++) {
  const r = SS.draw(four, ex);
  check(r.ok && valid(r.pairs, four, ex), '4 names, Alex/Sam never paired');
}

// 3 people with a couple: impossible (both derangements use the A-B edge)
const imp = SS.draw(three, [['A', 'B']]);
check(!imp.ok && /No valid draw/.test(imp.error), '3 people + 1 exclusion shows the error');

// 4 people, two couples: possible (A,B) (C,D) -> A,B give to C,D
const twoCouples = SS.draw(four, [['Alex', 'Sam'], ['Jordan', 'Taylor']]);
check(twoCouples.ok && valid(twoCouples.pairs, four, [['Alex', 'Sam'], ['Jordan', 'Taylor']]), 'two couples of 4 works');

// Rare-but-possible: 20 people, one person can only give to one other.
const twenty = Array.from({ length: 20 }, (_, i) => `P${i}`);
const heavy = twenty.slice(2).map((n) => ['P0', n]); // P0 may only draw P1
const h = SS.draw(twenty, heavy);
check(h.ok && valid(h.pairs, twenty, heavy) && h.pairs[0][1] === 'P1', 'heavy exclusions still find the one valid option');

// Impossible at size: one person excluded from everyone
const lonely = twenty.slice(1).map((n) => ['P0', n]);
check(!SS.draw(twenty, lonely).ok, 'person excluded from everyone is impossible');

// 100 people works
const hundred = Array.from({ length: 100 }, (_, i) => `Person ${i}`);
check(valid(SS.draw(hundred, []).pairs, hundred), '100 people');

// Uniformity: 4 people have 9 derangements; each should show up ~1/9.
const counts = new Map();
const N = 18000;
for (let i = 0; i < N; i++) {
  const k = SS.draw(four, []).pairs.map((p) => p[1]).join(',');
  counts.set(k, (counts.get(k) || 0) + 1);
}
check(counts.size === 9, `9 distinct derangements of 4 (got ${counts.size})`);
for (const [k, c] of counts) check(Math.abs(c - N / 9) < N / 9 * 0.12, `derangement ${k} near uniform (${c})`);

// Private links round-trip, including non-ASCII names
const d = { giver: 'Zoë', recipient: 'José 🎄', budget: '$25', date: '2026-12-20', group: 'Culwell family' };
const back = SS.decodeDraw(SS.encodeDraw(d));
check(back && back.giver === d.giver && back.recipient === d.recipient && back.budget === '$25' && back.date === d.date && back.group === d.group, 'link round-trips');
check(!/[+/=]/.test(SS.encodeDraw(d)), 'link is URL-safe');
check(SS.decodeDraw('not-a-draw') === null, 'bad link decodes to null');

console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
