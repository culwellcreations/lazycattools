// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────

function mulberry32(seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  let a = h >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateSeed() {
  return Math.random().toString(36).slice(2, 8);
}

// ─── DOM References ───────────────────────────────────────────────────────────

const elNames        = document.getElementById('names-input');
const elFileInput    = document.getElementById('file-input');
const elUploadHint   = document.getElementById('upload-hint');
const elRemoveToggle = document.getElementById('remove-toggle');
const elPick         = document.getElementById('btn-pick');
const elResults      = document.getElementById('results-section');
const elWinnerName   = document.getElementById('winner-name');
const elWinnerMeta   = document.getElementById('winner-meta');
const elWinnerDisplay = document.getElementById('winner-display');
const elPickAgain    = document.getElementById('btn-pick-again');
const elReset        = document.getElementById('btn-reset');
const elResetEmpty   = document.getElementById('btn-reset-empty');
const elCopy         = document.getElementById('btn-copy');
const elShare        = document.getElementById('btn-share');
const elEmptyState   = document.getElementById('empty-state');

// ─── State ────────────────────────────────────────────────────────────────────

let state = {
  allNames: [],
  remaining: [],
  winner: null,
  removeMode: false
};

// ─── Name Parsing ─────────────────────────────────────────────────────────────

function parseNames(raw) {
  return raw
    .split(/[\n,]+/)
    .map(n => n.trim().replace(/^["']|["']$/g, ''))
    .filter(n => n.length > 0);
}

// ─── XSS Safety ──────────────────────────────────────────────────────────────

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── URL State ────────────────────────────────────────────────────────────────

function encodeShareURL(names, winner, seed) {
  const params = new URLSearchParams();
  params.set('names', names.join(','));
  params.set('winner', winner);
  params.set('seed', seed);
  return `${location.origin}${location.pathname}?${params.toString()}`;
}

function decodeState() {
  const params = new URLSearchParams(location.search);
  if (!params.has('names')) return null;
  return {
    names: params.get('names').split(',').map(n => n.trim()).filter(Boolean),
    winner: params.get('winner') || null
  };
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  document.body.appendChild(el);

  setTimeout(() => {
    el.classList.add('toast--hide');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 2000);
}

// ─── Render Winner ────────────────────────────────────────────────────────────

function showWinner(name, remaining, total) {
  elWinnerName.textContent = name;

  if (state.removeMode) {
    elWinnerMeta.textContent = remaining === 0
      ? 'Last pick!'
      : `${remaining} of ${total} names remaining`;
  } else {
    elWinnerMeta.textContent = `from ${total} name${total !== 1 ? 's' : ''}`;
  }

  // Trigger pop animation by cycling the class
  elWinnerDisplay.classList.remove('winner--pop');
  void elWinnerDisplay.offsetWidth; // force reflow
  elWinnerDisplay.classList.add('winner--pop');

  elResults.hidden = false;
  elEmptyState.hidden = true;
  elPickAgain.hidden = false;
  elReset.hidden = !state.removeMode;
  elResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showEmptyState() {
  elResults.hidden = true;
  elEmptyState.hidden = false;
}

// ─── Core Pick ────────────────────────────────────────────────────────────────

function pick() {
  const allNames = parseNames(elNames.value);

  if (allNames.length === 0) {
    showToast('Enter at least one name');
    return;
  }

  state.removeMode = elRemoveToggle.checked;

  // If names list changed, reset the pool
  const namesChanged = JSON.stringify(allNames) !== JSON.stringify(state.allNames);
  if (namesChanged) {
    state.allNames = allNames;
    state.remaining = [...allNames];
  }

  const pool = state.removeMode ? state.remaining : allNames;

  if (pool.length === 0) {
    showEmptyState();
    return;
  }

  const seed = generateSeed();
  const rand = mulberry32(seed);
  const idx = Math.floor(rand() * pool.length);
  const winner = pool[idx];

  if (state.removeMode) {
    state.remaining = state.remaining.filter((_, i) => i !== state.remaining.indexOf(winner));
    // Remove first occurrence only
    const removeIdx = state.remaining.indexOf(winner);
    // Already removed above via filter with idx — redo correctly
    state.remaining = [...pool];
    state.remaining.splice(idx, 1);
  }

  state.winner = winner;
  showWinner(winner, state.remaining.length, allNames.length);
}

function resetPool() {
  state.remaining = [...state.allNames];
  state.winner = null;
  elResults.hidden = true;
  elEmptyState.hidden = true;
  showToast('Pool reset — all names back in');
}

// ─── File Upload ──────────────────────────────────────────────────────────────

function handleFileUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const names = parseNames(e.target.result);
    elNames.value = names.join('\n');
    elUploadHint.textContent = `${names.length} name${names.length !== 1 ? 's' : ''} loaded`;
    setTimeout(() => { elUploadHint.textContent = ''; }, 3000);
  };
  reader.onerror = () => showToast('Could not read file');
  reader.readAsText(file);
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

elPick.addEventListener('click', pick);
elPickAgain.addEventListener('click', pick);
elReset.addEventListener('click', resetPool);
elResetEmpty.addEventListener('click', resetPool);

elShare.addEventListener('click', () => {
  if (!state.winner) return;
  const names = parseNames(elNames.value);
  const url = encodeShareURL(names, state.winner, generateSeed());
  if (navigator.share) {
    navigator.share({ title: 'Random Name Pick', url }).catch(() => {
      navigator.clipboard.writeText(url)
        .then(() => showToast('Link copied!'))
        .catch(() => showToast('Could not copy link'));
    });
  } else {
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link copied!'))
      .catch(() => showToast('Could not copy link'));
  }
});

elCopy.addEventListener('click', () => {
  if (!state.winner) return;
  navigator.clipboard.writeText(state.winner)
    .then(() => showToast('Name copied!'))
    .catch(() => showToast('Copy failed'));
});

elFileInput.addEventListener('change', (e) => {
  handleFileUpload(e.target.files[0]);
  e.target.value = '';
});

elNames.addEventListener('dragover', (e) => {
  e.preventDefault();
  elNames.classList.add('drag-over');
});
elNames.addEventListener('dragleave', () => elNames.classList.remove('drag-over'));
elNames.addEventListener('drop', (e) => {
  e.preventDefault();
  elNames.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFileUpload(file);
});

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const loaded = decodeState();
  if (loaded) {
    elNames.value = loaded.names.join('\n');
    if (loaded.winner) {
      state.allNames = loaded.names;
      state.remaining = loaded.names.filter(n => n !== loaded.winner);
      state.winner = loaded.winner;
      showWinner(loaded.winner, state.remaining.length, loaded.names.length);
    }
  }
});
