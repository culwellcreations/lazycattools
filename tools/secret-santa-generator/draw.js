// Secret Santa draw logic. Pure functions, no DOM, so the same file runs in
// the browser and in the Node test (_build/test-secret-santa.mjs).

(function (root) {
  'use strict';

  const MIN_PEOPLE = 3;
  const MAX_PEOPLE = 100;
  const MAX_TRIES = 20000;

  // Uniform integer in [0, n) from crypto.getRandomValues, without modulo bias.
  function randomInt(n) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / n) * n;
    let x;
    do {
      root.crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % n;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // One name per line (commas also split, to match the other randomizers).
  function parseNames(raw) {
    return String(raw)
      .split(/[\n,]+/)
      .map((n) => n.trim().replace(/^["']|["']$/g, '').trim())
      .filter((n) => n.length > 0);
  }

  const key = (name) => name.toLocaleLowerCase();

  // Returns null when the list is usable, or an error message.
  function validateNames(names) {
    if (names.length < MIN_PEOPLE) {
      return `Add at least ${MIN_PEOPLE} people. A Secret Santa with ${names.length || 'no one'} ${names.length === 1 ? 'person' : 'people'} is just shopping.`;
    }
    if (names.length > MAX_PEOPLE) {
      return `That's ${names.length} people. The limit is ${MAX_PEOPLE}.`;
    }
    const seen = new Map();
    for (const n of names) {
      const k = key(n);
      if (seen.has(k)) {
        const first = seen.get(k);
        return `"${first}" is on the list twice. Add a last initial so each person is different (for example, ${first} R.).`;
      }
      seen.set(k, n);
    }
    return null;
  }

  // allowed[i] = list of recipient indexes giver i may draw.
  function allowedMatrix(names, exclusions) {
    const idx = new Map(names.map((n, i) => [key(n), i]));
    const blocked = names.map(() => new Set());
    for (const [a, b] of exclusions) {
      const i = idx.get(key(a));
      const j = idx.get(key(b));
      if (i === undefined || j === undefined) continue;
      blocked[i].add(j);
      blocked[j].add(i); // exclusions work both ways
    }
    return names.map((_, i) => {
      const out = [];
      for (let j = 0; j < names.length; j++) if (j !== i && !blocked[i].has(j)) out.push(j);
      return out;
    });
  }

  // Perfect matching givers -> recipients (Kuhn's algorithm) with shuffled
  // order. Returns recipient index per giver, or null if none exists.
  function matching(allowed) {
    const n = allowed.length;
    const owner = new Array(n).fill(-1); // recipient -> giver
    const adj = allowed.map((l) => shuffle(l));
    function tryGiver(g, seen) {
      for (const r of adj[g]) {
        if (seen[r]) continue;
        seen[r] = true;
        if (owner[r] === -1 || tryGiver(owner[r], seen)) { owner[r] = g; return true; }
      }
      return false;
    }
    for (const g of shuffle([...Array(n).keys()])) {
      if (!tryGiver(g, new Array(n).fill(false))) return null;
    }
    const out = new Array(n);
    owner.forEach((g, r) => { out[g] = r; });
    return out;
  }

  // Draw. Rejection sampling keeps every valid draw equally likely; if the
  // exclusions make valid draws very rare, an exact matching settles whether
  // one exists at all, so a possible draw is never reported as impossible.
  function draw(names, exclusions) {
    const err = validateNames(names);
    if (err) return { ok: false, error: err };
    const allowed = allowedMatrix(names, exclusions || []);
    const ok = allowed.map((l) => new Set(l));
    const order = [...names.keys()];
    for (let t = 0; t < MAX_TRIES; t++) {
      const perm = shuffle(order);
      if (perm.every((r, g) => ok[g].has(r))) {
        return { ok: true, pairs: names.map((n, g) => [n, names[perm[g]]]) };
      }
    }
    const m = matching(allowed);
    if (!m) {
      return { ok: false, error: 'No valid draw is possible with these exclusions. Remove one and try again.' };
    }
    return { ok: true, pairs: names.map((n, g) => [n, names[m[g]]]) };
  }

  // Private links: the draw rides in the URL fragment (#...), which browsers
  // never send to a server. It's encoded, not encrypted.
  function b64urlEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return root.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64urlDecode(s) {
    const pad = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
    const bin = root.atob(pad);
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }

  function encodeDraw(d) {
    const o = { g: d.giver, r: d.recipient };
    if (d.budget) o.b = d.budget;
    if (d.date) o.d = d.date;
    if (d.group) o.n = d.group;
    return b64urlEncode(JSON.stringify(o));
  }

  function decodeDraw(s) {
    try {
      const o = JSON.parse(b64urlDecode(s));
      if (!o || typeof o.g !== 'string' || typeof o.r !== 'string') return null;
      return { giver: o.g, recipient: o.r, budget: o.b || '', date: o.d || '', group: o.n || '' };
    } catch (e) {
      return null;
    }
  }

  const api = { MIN_PEOPLE, MAX_PEOPLE, parseNames, validateNames, allowedMatrix, draw, encodeDraw, decodeDraw, shuffle };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SecretSanta = api;
})(typeof window !== 'undefined' ? window : globalThis);
