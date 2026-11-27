// Secret Santa Generator: page behavior. Draw rules live in draw.js.
(function () {
  'use strict';
  const SS = window.SecretSanta;
  const $ = (id) => document.getElementById(id);

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
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  // "2026-12-20" -> "Sunday, Dec 20" (read as a local date, not UTC)
  function formatDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }

  function metaLine(budget, date) {
    const parts = [];
    if (budget) parts.push(`Spending limit: ${budget}`);
    if (date) parts.push(`Exchange: ${formatDate(date)}`);
    return parts.join(' · ');
  }

  const baseUrl = () => `${location.origin}${location.pathname}`;

  // ─── Private link view ──────────────────────────────────────────────────────

  function initLinkView() {
    const m = /^#for=(.+)$/.exec(location.hash);
    if (!m) return false;

    $('organizer').hidden = true;
    $('link-view').hidden = false;
    $('tool-tagline').hidden = true;
    $('crosslink-card').hidden = true;
    document.title = 'Your Secret Santa draw | Lazy Cat Tools';

    const d = SS.decodeDraw(m[1]);
    if (!d) {
      $('link-hello').textContent = 'Hmm. That link is broken.';
      $('link-cover').hidden = true;
      $('link-bad').hidden = false;
      return true;
    }

    if (d.group) { $('link-group').textContent = `${d.group} Secret Santa`; $('link-group').hidden = false; }
    $('link-hello').textContent = `Hi ${d.giver}.`;
    $('link-recipient').textContent = d.recipient;
    $('link-meta').textContent = metaLine(d.budget, d.date);

    $('btn-link-reveal').addEventListener('click', () => {
      $('link-cover').hidden = true;
      $('link-result').hidden = false;
      $('btn-link-hide').focus();
    });
    $('btn-link-hide').addEventListener('click', () => {
      $('link-result').hidden = true;
      $('link-cover').hidden = false;
      $('btn-link-reveal').textContent = 'Show it again';
      $('btn-link-reveal').focus();
    });
    return true;
  }

  // Following the "draw your own" link only changes the hash, so reload.
  window.addEventListener('hashchange', () => location.reload());

  if (initLinkView()) return;

  // ─── Organizer state ────────────────────────────────────────────────────────
  // Lives only in memory: a refresh clears everything.

  const state = { exclusions: [], pairs: null, openIdx: -1, seen: new Set(), drawnWith: null };

  const elNames = $('names-input');

  function currentNames() { return SS.parseNames(elNames.value); }

  function uniqueNames() {
    const seen = new Set();
    return currentNames().filter((n) => {
      const k = n.toLocaleLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function hasName(list, n) { return list.some((x) => x.toLocaleLowerCase() === n.toLocaleLowerCase()); }

  // ─── Setup: names ───────────────────────────────────────────────────────────

  function updateCount() {
    const n = currentNames().length;
    $('name-count').textContent = `${n} ${n === 1 ? 'person' : 'people'}`;
  }

  function onNamesChanged() {
    updateCount();
    renderExclusionPickers();
    renderExclusions();
    hideError();
  }

  elNames.addEventListener('input', onNamesChanged);

  $('btn-clear').addEventListener('click', () => {
    if (!elNames.value.trim()) return;
    elNames.value = '';
    onNamesChanged();
    elNames.focus();
  });

  function loadFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const names = SS.parseNames(e.target.result);
      elNames.value = names.join('\n');
      $('upload-hint').textContent = `Loaded ${names.length} name${names.length === 1 ? '' : 's'}`;
      onNamesChanged();
    };
    reader.readAsText(file);
  }

  $('file-input').addEventListener('change', (e) => { loadFile(e.target.files[0]); e.target.value = ''; });
  elNames.addEventListener('dragover', (e) => { e.preventDefault(); elNames.classList.add('drag-over'); });
  elNames.addEventListener('dragleave', () => elNames.classList.remove('drag-over'));
  elNames.addEventListener('drop', (e) => {
    e.preventDefault();
    elNames.classList.remove('drag-over');
    loadFile(e.dataTransfer.files[0]);
  });

  // ─── Setup: exclusions ──────────────────────────────────────────────────────

  function fillSelect(sel, names, keep) {
    sel.innerHTML = '';
    names.forEach((n) => {
      const o = document.createElement('option');
      o.value = n;
      o.textContent = n;
      sel.appendChild(o);
    });
    if (keep && hasName(names, keep)) sel.value = names.find((n) => n.toLocaleLowerCase() === keep.toLocaleLowerCase());
  }

  function renderExclusionPickers() {
    const names = uniqueNames();
    const a = $('excl-a'), b = $('excl-b');
    const prevA = a.value, prevB = b.value;
    fillSelect(a, names, prevA);
    fillSelect(b, names, prevB);
    if (names.length >= 2 && a.value === b.value) b.value = names.find((n) => n !== a.value);
    const usable = names.length >= 2;
    $('excl-empty').hidden = usable;
    a.disabled = b.disabled = $('btn-excl-add').disabled = !usable;
  }

  function renderExclusions() {
    const names = uniqueNames();
    const list = $('excl-list');
    list.innerHTML = '';
    state.exclusions.forEach(([a, b], i) => {
      const li = document.createElement('li');
      const stale = !hasName(names, a) || !hasName(names, b);
      if (stale) li.classList.add('is-stale');
      const label = document.createElement('span');
      label.textContent = `${a} & ${b}`;
      li.appendChild(label);
      if (stale) {
        const note = document.createElement('span');
        note.className = 'stale-note';
        note.textContent = '(not on the list)';
        li.appendChild(note);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'excl-remove';
      btn.setAttribute('aria-label', `Remove ${a} and ${b}`);
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      btn.addEventListener('click', () => {
        state.exclusions.splice(i, 1);
        renderExclusions();
        hideError();
        $('btn-excl-add').focus();
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
    const n = state.exclusions.length;
    $('excl-badge').hidden = n === 0;
    $('excl-badge').textContent = `${n} pair${n === 1 ? '' : 's'}`;
  }

  $('btn-excl-add').addEventListener('click', () => {
    const a = $('excl-a').value, b = $('excl-b').value;
    if (!a || !b) return;
    if (a === b) { showError('Pick two different people.'); return; }
    const dup = state.exclusions.some(([x, y]) =>
      (x.toLocaleLowerCase() === a.toLocaleLowerCase() && y.toLocaleLowerCase() === b.toLocaleLowerCase()) ||
      (x.toLocaleLowerCase() === b.toLocaleLowerCase() && y.toLocaleLowerCase() === a.toLocaleLowerCase()));
    if (dup) { showToast(`${a} and ${b} are already kept apart`); return; }
    state.exclusions.push([a, b]);
    hideError();
    renderExclusions();
  });

  // ─── Errors ─────────────────────────────────────────────────────────────────

  function showError(msg) { $('form-error').textContent = msg; $('form-error').hidden = false; }
  function hideError() { $('form-error').hidden = true; }

  // ─── Draw ───────────────────────────────────────────────────────────────────

  function doDraw() {
    const names = currentNames();
    const live = state.exclusions.filter(([a, b]) => hasName(names, a) && hasName(names, b));
    const result = SS.draw(names, live);
    if (!result.ok) {
      showError(result.error);
      return false;
    }
    hideError();
    state.pairs = result.pairs;
    state.openIdx = -1;
    state.seen = new Set();
    state.drawnWith = {
      budget: $('budget-input').value.trim(),
      date: $('date-input').value,
      group: $('group-input').value.trim(),
    };
    return true;
  }

  function linkFor(i) {
    const [giver, recipient] = state.pairs[i];
    return `${baseUrl()}#for=${SS.encodeDraw({ giver, recipient, ...state.drawnWith })}`;
  }

  function showResults() {
    $('setup').hidden = true;
    $('results').hidden = false;
    const n = state.pairs.length;
    const meta = [`${n} people`];
    if (state.drawnWith.budget) meta.push(`${state.drawnWith.budget} limit`);
    if (state.drawnWith.date) meta.push(formatDate(state.drawnWith.date));
    $('results-meta').textContent = (state.drawnWith.group ? `${state.drawnWith.group}: ` : '') + meta.join(' · ');
    hideAll();
    renderDrawList();
    renderSlips();
    $('results-heading').setAttribute('tabindex', '-1');
    $('results-heading').focus({ preventScroll: true });
    $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function svg(path) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }
  const ICON_EYE = svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>');
  const ICON_HIDE = svg('<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>');
  const ICON_LINK = svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>');

  function renderDrawList() {
    const list = $('draw-list');
    list.innerHTML = '';
    state.pairs.forEach(([giver, recipient], i) => {
      const open = state.openIdx === i;
      const li = document.createElement('li');
      li.className = 'draw-row' + (open ? ' is-open' : '') + (state.seen.has(i) ? ' is-seen' : '');

      const who = document.createElement('div');
      who.className = 'draw-who';
      if (open) {
        const p = document.createElement('p');
        p.className = 'draw-reveal';
        p.append(`${giver} is buying for `);
        const s = document.createElement('strong');
        s.textContent = recipient;
        p.appendChild(s);
        who.appendChild(p);
      } else {
        const name = document.createElement('span');
        name.className = 'draw-name';
        name.textContent = giver;
        const status = document.createElement('span');
        status.className = 'draw-status';
        status.textContent = state.seen.has(i) ? 'Seen' : 'Not seen';
        who.append(name, status);
      }

      const actions = document.createElement('div');
      actions.className = 'draw-actions';

      const reveal = document.createElement('button');
      reveal.type = 'button';
      reveal.className = 'btn-secondary' + (open ? ' btn-tap' : '');
      reveal.innerHTML = open ? `${ICON_HIDE} Hide` : `${ICON_EYE} Show`;
      reveal.setAttribute('aria-label', open ? `Hide ${giver}'s draw` : `Show ${giver}'s draw`);
      reveal.setAttribute('aria-expanded', String(open));
      reveal.addEventListener('click', () => toggleReveal(i));

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'btn-secondary';
      copy.innerHTML = `${ICON_LINK} Copy link`;
      copy.setAttribute('aria-label', `Copy ${giver}'s private link`);
      copy.hidden = open; // keep the open row uncluttered
      copy.addEventListener('click', async () => {
        const ok = await copyText(linkFor(i));
        showToast(ok ? `Copied ${giver}'s link. Send it only to ${giver}.` : 'Copy failed. Try again.');
      });

      actions.append(reveal, copy);
      li.append(who, actions);
      list.appendChild(li);
    });
  }

  function toggleReveal(i) {
    const [giver, recipient] = state.pairs[i];
    if (state.openIdx === i) {
      state.openIdx = -1;
      state.seen.add(i);
      $('reveal-status').textContent = `${giver}'s draw is hidden.`;
    } else {
      if (state.openIdx !== -1) state.seen.add(state.openIdx);
      state.openIdx = i;
      $('reveal-status').textContent = `${giver} is buying for ${recipient}.`;
    }
    renderDrawList();
    const btn = $('draw-list').children[i].querySelector('.draw-actions button');
    if (btn) btn.focus();
  }

  $('btn-draw').addEventListener('click', () => { if (doDraw()) showResults(); });

  $('btn-redraw').addEventListener('click', () => {
    if (!doDraw()) { backToSetup(); return; }
    showResults();
    showToast('New draw. Old links no longer match.');
  });

  function backToSetup() {
    state.pairs = null;
    state.openIdx = -1;
    $('results').hidden = true;
    $('setup').hidden = false;
    $('print-slips').innerHTML = '';
    elNames.focus();
  }
  $('btn-start-over').addEventListener('click', backToSetup);

  // ─── Organizer: everyone's draw ─────────────────────────────────────────────

  function hideAll() {
    $('confirm-all').hidden = true;
    $('all-draws').hidden = true;
    $('btn-show-all').hidden = false;
    $('all-list').innerHTML = '';
  }

  $('btn-show-all').addEventListener('click', () => {
    $('btn-show-all').hidden = true;
    $('confirm-all').hidden = false;
    $('btn-cancel-all').focus();
  });
  $('btn-cancel-all').addEventListener('click', () => { hideAll(); $('btn-show-all').focus(); });
  $('btn-confirm-all').addEventListener('click', () => {
    $('confirm-all').hidden = true;
    const ol = $('all-list');
    ol.innerHTML = '';
    state.pairs.forEach(([g, r]) => {
      const li = document.createElement('li');
      const arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.textContent = '→';
      li.append(g, arrow, r);
      ol.appendChild(li);
    });
    $('all-draws').hidden = false;
    $('btn-copy-all').focus();
  });
  $('btn-hide-all').addEventListener('click', () => { hideAll(); $('btn-show-all').focus(); });
  $('btn-copy-all').addEventListener('click', async () => {
    const head = [state.drawnWith.group ? `${state.drawnWith.group} Secret Santa` : 'Secret Santa', metaLine(state.drawnWith.budget, state.drawnWith.date)].filter(Boolean);
    const text = [...head, '', ...state.pairs.map(([g, r]) => `${g} → ${r}`)].join('\n');
    const ok = await copyText(text);
    showToast(ok ? 'Copied everyone\'s draw' : 'Copy failed. Try again.');
  });

  // ─── Print slips ────────────────────────────────────────────────────────────

  function renderSlips() {
    const wrap = $('print-slips');
    wrap.innerHTML = '';
    const meta = metaLine(state.drawnWith.budget, state.drawnWith.date);
    state.pairs.forEach(([g, r]) => {
      const slip = document.createElement('div');
      slip.className = 'slip';
      const add = (cls, text) => { const p = document.createElement('p'); p.className = cls; p.textContent = text; slip.appendChild(p); };
      if (state.drawnWith.group) add('slip-group', `${state.drawnWith.group} Secret Santa`);
      add('slip-giver', `For ${g}`);
      add('slip-label', "You're buying a gift for");
      add('slip-recipient', r);
      if (meta) add('slip-meta', meta);
      wrap.appendChild(slip);
    });
  }

  $('btn-print').addEventListener('click', () => window.print());

  // ─── Init ───────────────────────────────────────────────────────────────────

  onNamesChanged();
})();
