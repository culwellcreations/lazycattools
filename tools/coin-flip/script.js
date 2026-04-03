// ─── DOM References ───────────────────────────────────────────────────────────

const coinEl        = document.getElementById('coin');
const coinLetterEl  = document.getElementById('coin-letter');
const resultTextEl  = document.getElementById('result-text');
const resultSubEl   = document.getElementById('result-sub');
const flipBtn       = document.getElementById('btn-flip');
const statsSection  = document.getElementById('stats-section');
const statTotal     = document.getElementById('stat-total');
const statHeads     = document.getElementById('stat-heads');
const statTails     = document.getElementById('stat-tails');
const historyRow    = document.getElementById('history-row');
const resetBtn      = document.getElementById('btn-reset');
const copyBtn       = document.getElementById('btn-copy');

// ─── State ────────────────────────────────────────────────────────────────────

let state = {
  total: 0,
  heads: 0,
  tails: 0,
  lastResult: null,
  history: []   // 'H' or 'T', most recent last, max 20
};

let isFlipping = false;

const SHRINK_MS = 180;
const GROW_MS   = 220;

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

// ─── Coin Face Update ─────────────────────────────────────────────────────────

function setCoinFace(result) {
  coinEl.classList.remove('coin--heads', 'coin--tails');
  if (result === 'heads') {
    coinEl.classList.add('coin--heads');
    coinLetterEl.textContent = 'H';
  } else if (result === 'tails') {
    coinEl.classList.add('coin--tails');
    coinLetterEl.textContent = 'T';
  } else {
    coinLetterEl.textContent = '?';
  }
}

// ─── Result Display ───────────────────────────────────────────────────────────

function showResult(result) {
  const label = result === 'heads' ? 'Heads' : 'Tails';

  resultTextEl.className = 'result-text';
  void resultTextEl.offsetWidth; // force reflow for animation restart
  resultTextEl.className = `result-text result-text--${result} result-text--pop`;
  resultTextEl.textContent = label;

  // Streak sub-text
  const streak = getStreak();
  resultSubEl.textContent = streak >= 3
    ? `${streak} ${label.toLowerCase()} in a row!`
    : '';
}

function getStreak() {
  if (state.history.length === 0) return 0;
  const last = state.history[state.history.length - 1];
  let count = 0;
  for (let i = state.history.length - 1; i >= 0; i--) {
    if (state.history[i] === last) count++;
    else break;
  }
  return count;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function updateStats(result) {
  state.total++;
  if (result === 'heads') state.heads++;
  else state.tails++;

  state.lastResult = result;
  state.history.push(result === 'heads' ? 'H' : 'T');
  if (state.history.length > 20) state.history.shift();
}

function renderStats() {
  statTotal.textContent = state.total;
  statHeads.textContent = state.heads;
  statTails.textContent = state.tails;

  const pills = state.history.map(r => {
    const pill = document.createElement('div');
    pill.className = `history-pill history-pill--${r === 'H' ? 'heads' : 'tails'}`;
    pill.textContent = r;
    pill.setAttribute('aria-label', r === 'H' ? 'Heads' : 'Tails');
    return pill;
  });
  historyRow.replaceChildren(...pills);

  statsSection.hidden = false;
}

// ─── Flip ─────────────────────────────────────────────────────────────────────

function flip() {
  if (isFlipping) return;
  isFlipping = true;
  flipBtn.disabled = true;

  const result = Math.random() < 0.5 ? 'heads' : 'tails';

  // Phase 1: shrink
  coinEl.classList.remove('coin--shrink', 'coin--grow');
  void coinEl.offsetWidth;
  coinEl.classList.add('coin--shrink');

  setTimeout(() => {
    // Swap face at the invisible midpoint
    coinEl.classList.remove('coin--shrink');
    setCoinFace(result);

    // Phase 2: grow
    void coinEl.offsetWidth;
    coinEl.classList.add('coin--grow');

    setTimeout(() => {
      coinEl.classList.remove('coin--grow');
      isFlipping = false;
      flipBtn.disabled = false;

      updateStats(result);
      showResult(result);
      renderStats();
    }, GROW_MS);
  }, SHRINK_MS);
}

// ─── Reset ────────────────────────────────────────────────────────────────────

function resetStats() {
  state = { total: 0, heads: 0, tails: 0, lastResult: null, history: [] };

  coinEl.classList.remove('coin--heads', 'coin--tails', 'coin--shrink', 'coin--grow');
  coinLetterEl.textContent = '?';

  resultTextEl.className = 'result-text';
  resultTextEl.textContent = '';
  resultSubEl.textContent = '';

  statsSection.hidden = true;
  showToast('Stats reset');
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

flipBtn.addEventListener('click', flip);
resetBtn.addEventListener('click', resetStats);

copyBtn.addEventListener('click', () => {
  if (!state.lastResult) return;
  const label = state.lastResult === 'heads' ? 'Heads' : 'Tails';
  navigator.clipboard.writeText(label)
    .then(() => showToast('Copied!'))
    .catch(() => showToast('Copy failed'));
});

// Spacebar also flips when body is focused (convenience)
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.activeElement === document.body) {
    e.preventDefault();
    flip();
  }
});
