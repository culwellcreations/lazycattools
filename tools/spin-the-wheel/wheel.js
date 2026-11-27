// Spin the Wheel: pure logic, no DOM. Runs in the browser and in
// _build/test-spin-the-wheel.mjs.

(function (root) {
  'use strict';

  const MIN = 2;
  const MAX = 100;
  const TAU = Math.PI * 2;

  // Slice colors from the site palette. `ink: true` means dark text on it.
  // Every pair is checked for 4.5:1 contrast in the test.
  const PALETTE = [
    { bg: '#3730A3', ink: false }, // accent indigo
    { bg: '#F0A500', ink: true },  // mascot gold
    { bg: '#BE123C', ink: false }, // highlight red
    { bg: '#D5D1F5', ink: true },  // border lilac
    { bg: '#B45309', ink: false }, // warm amber
    { bg: '#FEF3C7', ink: true },  // warm cream
    { bg: '#1C1C1C', ink: false }, // ink
    { bg: '#A5B4FC', ink: true },  // soft indigo
  ];

  const PRESETS = {
    classroom: { label: 'Classroom names', entries: ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan'] },
    yesno: { label: 'Yes / No / Maybe', entries: ['Yes', 'No', 'Maybe'] },
    food: { label: 'Pick a restaurant', entries: ['Pizza', 'Tacos', 'Burgers', 'Sushi', 'Pasta', 'Sandwiches'] },
    numbers: { label: 'Numbers 1–10', entries: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
    coin: { label: 'Heads / Tails', entries: ['Heads', 'Tails'] },
  };

  function randomInt(n) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / n) * n;
    let x;
    do { root.crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
    return x % n;
  }

  // Uniform float in [0, 1) from crypto.
  function randomFloat() {
    const buf = new Uint32Array(1);
    root.crypto.getRandomValues(buf);
    return buf[0] / 0x100000000;
  }

  // One entry per line. A single pasted line with commas is split on commas,
  // so "Pizza, Tacos, Sushi" still works.
  function parseEntries(raw) {
    const lines = String(raw).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (lines.length === 1 && lines[0].includes(',')) {
      return lines[0].split(',').map((s) => s.trim()).filter(Boolean);
    }
    return lines;
  }

  function validate(entries) {
    if (entries.length < MIN) return `Add at least ${MIN} entries. A wheel with ${entries.length === 1 ? 'one slice' : 'no slices'} always lands on the same thing.`;
    if (entries.length > MAX) return `That's ${entries.length} entries. The wheel holds up to ${MAX}.`;
    return null;
  }

  // The wheel's slice 0 starts at the pointer (top) and slices run clockwise.
  // `rotation` is how far the wheel has turned clockwise, in radians.
  function indexAt(rotation, n) {
    const s = TAU / n;
    const a = ((-rotation % TAU) + TAU) % TAU;
    return Math.min(n - 1, Math.floor(a / s));
  }

  // Final rotation that lands the pointer inside slice `winner`, somewhere
  // between 15% and 85% of its width so it never sits on a line, after
  // `turns` full turns clockwise from `current`.
  function targetRotation(current, n, winner, turns, f) {
    const s = TAU / n;
    const want = -((winner + 0.15 + 0.7 * f) * s); // rotation mod TAU that lands there
    let delta = ((want - current) % TAU + TAU) % TAU;
    return current + delta + turns * TAU;
  }

  // Pick the winner first (equal chance per slice), then aim the wheel at it.
  function spin(current, n) {
    const winner = randomInt(n);
    const turns = 5 + randomInt(3); // 5 to 7 full turns
    return { winner, rotation: targetRotation(current, n, winner, turns, randomFloat()) };
  }

  function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); }

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // A color per slice. The same entry keeps its color when the list changes;
  // neighbors that would match get nudged to the next color.
  function colorsFor(entries) {
    const n = entries.length;
    const out = entries.map((e) => hash(e.toLocaleLowerCase()) % PALETTE.length);
    for (let i = 0; i < n; i++) {
      const prev = i > 0 ? out[i - 1] : -1;
      const next = i === n - 1 && n > 2 ? out[0] : -1;
      let tries = 0;
      while ((out[i] === prev || out[i] === next) && tries < PALETTE.length) {
        out[i] = (out[i] + 1) % PALETTE.length;
        tries++;
      }
    }
    return out.map((i) => PALETTE[i]);
  }

  // Shareable links: one entry per line in ?entries=. Older ?names= links
  // (comma-separated, from the team generator) are read too.
  function encodeEntries(entries) {
    const p = new URLSearchParams();
    p.set('entries', entries.slice(0, MAX).join('\n'));
    return p.toString();
  }

  function decodeEntries(search) {
    const p = new URLSearchParams(search);
    if (p.has('entries')) return p.get('entries').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, MAX);
    if (p.has('names')) return p.get('names').split(',').map((s) => s.trim()).filter(Boolean).slice(0, MAX);
    return null;
  }

  // Removes one copy of `entry` (the winner), leaving other copies in place.
  function removeOne(entries, index) {
    return entries.filter((_, i) => i !== index);
  }

  const api = { MIN, MAX, TAU, PALETTE, PRESETS, parseEntries, validate, indexAt, targetRotation, spin, easeOutQuint, colorsFor, encodeEntries, decodeEntries, removeOne, randomInt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Wheel = api;
})(typeof window !== 'undefined' ? window : globalThis);
