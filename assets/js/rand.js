// Shared randomness and page helpers for the randomizer tools.
// Every random number comes from crypto.getRandomValues, never Math.random.
// Runs in the browser (window.Rand) and in Node tests (module.exports).

(function (root) {
  'use strict';

  const TWO32 = 0x100000000;

  function u32() {
    const b = new Uint32Array(1);
    root.crypto.getRandomValues(b);
    return b[0];
  }

  // Uniform integer in [0, n), with no modulo bias, for n up to 2^53.
  function int(n) {
    if (!(n >= 1) || !Number.isSafeInteger(n)) throw new RangeError('n must be a safe integer >= 1');
    if (n <= TWO32) {
      const limit = Math.floor(TWO32 / n) * n;
      let x;
      do { x = u32(); } while (x >= limit);
      return x % n;
    }
    // 53 random bits, rejection-sampled.
    const TWO53 = 2 ** 53;
    const limit = Math.floor(TWO53 / n) * n;
    let x;
    do { x = (u32() >>> 11) * TWO32 + u32(); } while (x >= limit);
    return x % n;
  }

  // Uniform integer in [min, max], inclusive.
  function between(min, max) { return min + int(max - min + 1); }

  // Fisher–Yates, returning a new array.
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = int(i + 1);
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // k different items from arr (partial Fisher–Yates).
  function sample(arr, k) {
    const a = arr.slice();
    for (let i = 0; i < k; i++) {
      const j = i + int(a.length - i);
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a.slice(0, k);
  }

  // Index chosen with probability weight[i] / sum. Weights are integers >= 0.
  function weighted(weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    if (!(total > 0)) return -1;
    let r = int(total);
    for (let i = 0; i < weights.length; i++) {
      if (r < weights[i]) return i;
      r -= weights[i];
    }
    return weights.length - 1;
  }

  const api = { int, between, shuffle, sample, weighted };

  // ─── Browser-only page helpers ─────────────────────────────────────────────
  if (typeof document !== 'undefined') {
    api.toast = function (msg) {
      const old = document.querySelector('.toast');
      if (old) old.remove();
      const el = document.createElement('div');
      el.className = 'toast';
      el.textContent = msg;
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
      setTimeout(() => {
        el.classList.add('toast--hide');
        el.addEventListener('animationend', () => el.remove(), { once: true });
      }, 2000);
    };

    api.copy = async function (text) {
      try { await navigator.clipboard.writeText(text); return true; } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
        return ok;
      }
    };

    api.copyButton = function (btn, getText, okMsg) {
      btn.addEventListener('click', async () => {
        const text = getText();
        if (!text) return;
        const ok = await api.copy(text);
        api.toast(ok ? (okMsg || 'Copied') : 'Copy failed. Try again.');
      });
    };

    // Lines from a textarea, trimmed, blanks dropped.
    api.lines = (raw) => String(raw).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

    api.plural = (n, one, many) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Rand = api;
})(typeof window !== 'undefined' ? window : globalThis);
