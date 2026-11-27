// Spin the Wheel: page behavior. Odds and landing math live in wheel.js.
(function () {
  'use strict';
  const W = window.Wheel;
  const $ = (id) => document.getElementById(id);

  const canvas = $('wheel');
  const ctx = canvas.getContext('2d');
  const elInput = $('entries-input');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    entries: [],
    baseline: [],      // the list before any "remove winner", for Reset wheel
    rotation: 0,
    spinning: false,
    winner: -1,        // index of the last winner in `entries`, -1 when none
    history: [],
    sound: false,
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function showToast(msg) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast--hide');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, 2000);
  }

  async function copyText(text) {
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
  }

  function showError(msg) { $('form-error').textContent = msg; $('form-error').hidden = false; }
  function hideError() { $('form-error').hidden = true; }

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // ─── Drawing ────────────────────────────────────────────────────────────────

  let size = 460; // CSS pixels

  function fitCanvas() {
    // clientWidth, not getBoundingClientRect: the canvas is rotated, and a
    // rotated box reports a bigger bounding rect.
    size = Math.max(200, Math.round(canvas.clientWidth));
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function ellipsize(text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return t.trimEnd() + '…';
  }

  function draw() {
    const n = state.entries.length;
    const r = size / 2;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(r, r);

    if (n < W.MIN || n > W.MAX) {
      ctx.beginPath();
      ctx.arc(0, 0, r - 1, 0, W.TAU);
      ctx.fillStyle = '#ECEAFB';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#D5D1F5';
      ctx.stroke();
      ctx.restore();
      return;
    }

    const s = W.TAU / n;
    const colors = W.colorsFor(state.entries);
    const fontPx = Math.max(9, Math.min(r * 0.1, r * s * 0.42, 22));
    ctx.font = `800 ${fontPx}px Nunito, system-ui, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const textEnd = r * 0.9;
    const textMax = r * 0.9 - r * 0.24; // stop short of the hub

    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i * s;
      const a1 = a0 + s;
      const dim = state.winner !== -1 && i !== state.winner;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r - 1, a0, a1);
      ctx.closePath();
      ctx.fillStyle = colors[i].bg;
      ctx.fill();
      if (n <= 60) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.stroke();
      }

      ctx.save();
      ctx.rotate(a0 + s / 2);
      ctx.fillStyle = colors[i].ink ? '#1C1C1C' : '#FFFFFF';
      ctx.fillText(ellipsize(state.entries[i], textMax), textEnd, 0);
      ctx.restore();

      if (dim) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r - 1, a0, a1);
        ctx.closePath();
        ctx.fillStyle = 'rgba(245, 244, 255, 0.72)';
        ctx.fill();
      }
    }

    if (state.winner !== -1) {
      const a0 = -Math.PI / 2 + state.winner * s;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r - 3, a0, a0 + s);
      ctx.closePath();
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1C1C1C';
      ctx.stroke();
    }

    // outer rim
    ctx.beginPath();
    ctx.arc(0, 0, r - 1.5, 0, W.TAU);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    ctx.restore();
  }

  function setRotation(rad) {
    state.rotation = rad;
    canvas.style.transform = `rotate(${rad}rad)`;
  }

  // ─── Entries ────────────────────────────────────────────────────────────────

  function updateUiForEntries() {
    const n = state.entries.length;
    $('entry-count').textContent = plural(n, 'entry', 'entries');
    $('stage-count').textContent = plural(n, 'slice', 'slices');
    canvas.setAttribute('aria-label', n ? `Wheel with ${plural(n, 'slice', 'slices')}: ${state.entries.slice(0, 20).join(', ')}${n > 20 ? '…' : ''}` : 'Empty wheel');
    const err = W.validate(state.entries);
    if (err) showError(err); else hideError();
    const canSpin = !err && !state.spinning;
    $('btn-spin').disabled = !canSpin;
    $('btn-hub').disabled = !canSpin;
    draw();
  }

  function clearWinner() {
    state.winner = -1;
    $('winner').hidden = true;
    $('after-actions').hidden = true;
    $('btn-spin').textContent = 'Spin';
  }

  // The user typed: this becomes the new list to reset to.
  function onInput() {
    state.entries = W.parseEntries(elInput.value);
    state.baseline = state.entries.slice();
    clearWinner();
    updateUiForEntries();
  }
  elInput.addEventListener('input', onInput);

  function setEntries(list, { asBaseline }) {
    state.entries = list.slice();
    if (asBaseline) state.baseline = list.slice();
    elInput.value = list.join('\n');
    updateUiForEntries();
  }

  $('btn-clear').addEventListener('click', () => {
    if (state.spinning) return;
    elInput.value = '';
    onInput();
    elInput.focus();
  });

  // ─── Presets ────────────────────────────────────────────────────────────────

  let pendingPreset = null;

  function isUntouched() {
    const cur = W.parseEntries(elInput.value).join('\n');
    return !cur || Object.values(W.PRESETS).some((p) => p.entries.join('\n') === cur);
  }

  function loadPreset(key) {
    const p = W.PRESETS[key];
    clearWinner();
    setEntries(p.entries, { asBaseline: true });
    $('preset-confirm').hidden = true;
    pendingPreset = null;
  }

  document.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.spinning) return;
      const key = btn.dataset.preset;
      if (isUntouched()) { loadPreset(key); return; }
      pendingPreset = key;
      const n = W.parseEntries(elInput.value).length;
      $('preset-confirm-text').textContent = `Replace your ${plural(n, 'entry', 'entries')} with “${W.PRESETS[key].label}”?`;
      $('preset-confirm').hidden = false;
      $('btn-preset-no').focus();
    });
  });
  $('btn-preset-yes').addEventListener('click', () => { if (pendingPreset) loadPreset(pendingPreset); });
  $('btn-preset-no').addEventListener('click', () => { $('preset-confirm').hidden = true; pendingPreset = null; });

  // ─── Sound ──────────────────────────────────────────────────────────────────

  let audio = null;
  function tick() {
    if (!state.sound || !audio) return;
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1500, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  $('btn-sound').addEventListener('click', () => {
    state.sound = !state.sound;
    if (state.sound && !audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audio = new AC();
    }
    if (audio && audio.state === 'suspended') audio.resume();
    $('btn-sound').setAttribute('aria-pressed', String(state.sound));
    $('btn-sound').setAttribute('aria-label', state.sound ? 'Tick sound on' : 'Tick sound off');
  });

  // ─── Spin ───────────────────────────────────────────────────────────────────

  function setSpinning(on) {
    state.spinning = on;
    $('wheel-stage').classList.toggle('is-spinning', on);
    elInput.readOnly = on;
    document.querySelectorAll('[data-preset], #btn-remove, #btn-reset, #btn-clear').forEach((b) => { b.disabled = on; });
    updateUiForEntries();
  }

  function doSpin() {
    if (state.spinning || W.validate(state.entries)) return;
    clearWinner();
    draw();
    $('announce').textContent = '';
    const n = state.entries.length;
    const start = state.rotation % W.TAU;
    setRotation(start);
    const { winner, rotation: end } = W.spin(start, n);
    const duration = reduceMotion.matches ? 700 : 4200 + W.randomInt(600);
    const t0 = performance.now();
    let lastIdx = W.indexAt(start, n);
    setSpinning(true);

    function frame(now) {
      const t = Math.min(1, (now - t0) / duration);
      const rot = start + (end - start) * W.easeOutQuint(t);
      setRotation(rot);
      const idx = W.indexAt(rot, n);
      if (idx !== lastIdx) { lastIdx = idx; tick(); }
      if (t < 1) { requestAnimationFrame(frame); return; }
      finish(winner);
    }
    requestAnimationFrame(frame);
  }

  function finish(winner) {
    state.winner = winner;
    const name = state.entries[winner];
    state.history.unshift(name);
    setSpinning(false);
    $('winner-name').textContent = name;
    $('winner').hidden = false;
    $('announce').textContent = `Winner: ${name}`;
    $('after-actions').hidden = false;
    $('btn-spin').textContent = 'Spin again';
    $('btn-remove').disabled = state.entries.length <= W.MIN;
    $('btn-remove').title = state.entries.length <= W.MIN ? 'Need at least 3 entries to remove one and keep spinning' : '';
    renderHistory();
    draw();
  }

  $('btn-spin').addEventListener('click', doSpin);
  $('btn-hub').addEventListener('click', doSpin);
  canvas.addEventListener('click', doSpin);

  $('btn-remove').addEventListener('click', () => {
    if (state.spinning || state.winner === -1) return;
    const name = state.entries[state.winner];
    const next = W.removeOne(state.entries, state.winner);
    state.winner = -1;
    setEntries(next, { asBaseline: false });
    showToast(`Removed ${name}`);
    doSpin();
  });

  $('btn-reset').addEventListener('click', () => {
    if (state.spinning) return;
    clearWinner();
    setEntries(state.baseline, { asBaseline: false });
    showToast('Wheel reset');
  });

  // ─── History ────────────────────────────────────────────────────────────────

  function renderHistory() {
    const list = $('history-list');
    list.innerHTML = '';
    // Oldest first, so the numbers read 1, 2, 3 in spin order.
    state.history.slice().reverse().forEach((name) => {
      const li = document.createElement('li');
      li.textContent = name;
      list.appendChild(li);
    });
    $('history').hidden = state.history.length === 0;
  }

  $('btn-clear-history').addEventListener('click', () => {
    state.history = [];
    renderHistory();
  });

  // ─── Share link ─────────────────────────────────────────────────────────────

  $('btn-copy-link').addEventListener('click', async () => {
    if (W.validate(state.entries)) { showToast('Add at least 2 entries first'); return; }
    const url = `${location.origin}${location.pathname}?${W.encodeEntries(state.baseline.length ? state.baseline : state.entries)}`;
    const ok = await copyText(url);
    showToast(ok ? 'Link copied' : 'Copy failed. Try again.');
  });

  // ─── Fullscreen / present mode ──────────────────────────────────────────────

  const stage = $('wheel-stage');

  function setPresent(on) {
    stage.classList.toggle('is-present', on);
    document.body.classList.toggle('has-present', on);
    $('fullscreen-label').textContent = on ? 'Exit' : 'Fullscreen';
    $('btn-fullscreen').setAttribute('aria-label', on ? 'Exit fullscreen' : 'Fullscreen');
    requestAnimationFrame(fitCanvas);
  }

  $('btn-fullscreen').addEventListener('click', async () => {
    const on = !stage.classList.contains('is-present');
    if (on) {
      setPresent(true);
      if (stage.requestFullscreen && document.fullscreenEnabled) {
        try { await stage.requestFullscreen(); } catch (e) { /* the full-window fallback stays */ }
      }
    } else {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      setPresent(false);
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && stage.classList.contains('is-present')) setPresent(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stage.classList.contains('is-present') && !document.fullscreenElement) setPresent(false);
  });

  // ─── Init ───────────────────────────────────────────────────────────────────

  const shared = W.decodeEntries(location.search);
  if (shared && shared.length) elInput.value = shared.join('\n');
  state.entries = W.parseEntries(elInput.value);
  state.baseline = state.entries.slice();

  if ('ResizeObserver' in window) new ResizeObserver(() => fitCanvas()).observe(canvas);
  else window.addEventListener('resize', fitCanvas);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);

  fitCanvas();
  updateUiForEntries();
})();
