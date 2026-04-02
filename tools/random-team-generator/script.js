// ─── Constants ───────────────────────────────────────────────────────────────

const TEAM_COLORS = [
  '#1d4ed8', '#b91c1c', '#15803d', '#92400e',
  '#6d28d9', '#0e7490', '#be185d', '#3f6212',
  '#c2410c', '#0f766e'
];

const TEAM_ADJECTIVES = [
  'Crimson', 'Golden', 'Silver', 'Cobalt', 'Emerald',
  'Scarlet', 'Amber', 'Violet', 'Teal', 'Ivory',
  'Obsidian', 'Bronze', 'Jade', 'Sapphire', 'Ruby',
  'Copper', 'Midnight', 'Storm', 'Iron', 'Arctic',
  'Blazing', 'Shadow', 'Thunder', 'Frozen', 'Raging',
  'Fierce', 'Swift', 'Bold', 'Wild', 'Fearless',
  'Steel', 'Phantom', 'Solar', 'Lunar', 'Onyx'
];

const TEAM_NOUNS = [
  'Wolves', 'Hawks', 'Foxes', 'Bears', 'Lions',
  'Tigers', 'Eagles', 'Sharks', 'Dragons', 'Panthers',
  'Falcons', 'Ravens', 'Cobras', 'Vipers', 'Jaguars',
  'Lynxes', 'Rhinos', 'Bulldogs', 'Stallions', 'Coyotes',
  'Hornets', 'Raptors', 'Scorpions', 'Wolverines', 'Griffins',
  'Phoenixes', 'Titans', 'Spartans', 'Knights', 'Gladiators',
  'Rockets', 'Comets', 'Cyclones', 'Avalanche', 'Blizzards'
];

// ─── DOM References ───────────────────────────────────────────────────────────

const elNames         = document.getElementById('names-input');
const elCount         = document.getElementById('team-count');
const elFileInput     = document.getElementById('file-input');
const elUploadHint    = document.getElementById('upload-hint');
const elRandomToggle  = document.getElementById('random-names-toggle');
const elGenerate      = document.getElementById('btn-generate');
const elReshuffle     = document.getElementById('btn-reshuffle');
const elShare         = document.getElementById('btn-share');
const elCopy          = document.getElementById('btn-copy');
const elResults       = document.getElementById('results-section');
const elGrid          = document.getElementById('results-grid');

// ─── State ────────────────────────────────────────────────────────────────────

let state = {
  names: [],
  teamCount: 2,
  seed: null,
  teams: [],
  teamLabels: [],
  useRandomNames: false
};

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

// ─── Name Parsing ─────────────────────────────────────────────────────────────

function parseNames(raw) {
  return raw
    .split(/[\n,]+/)
    .map(n => n.trim().replace(/^["']|["']$/g, ''))
    .filter(n => n.length > 0);
}

// ─── Team Assignment ──────────────────────────────────────────────────────────

function shuffleArray(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function assignTeams(names, teamCount, rand) {
  const shuffled = shuffleArray(names, rand);
  const teams = Array.from({ length: teamCount }, () => []);
  shuffled.forEach((name, i) => teams[i % teamCount].push(name));
  return teams;
}

function generateTeamNames(count, rand) {
  const usedAdj = new Set();
  const usedNoun = new Set();
  const labels = [];

  for (let i = 0; i < count; i++) {
    let adj, noun, attempts = 0;
    do {
      adj = TEAM_ADJECTIVES[Math.floor(rand() * TEAM_ADJECTIVES.length)];
      attempts++;
    } while (usedAdj.has(adj) && attempts < 20);

    attempts = 0;
    do {
      noun = TEAM_NOUNS[Math.floor(rand() * TEAM_NOUNS.length)];
      attempts++;
    } while (usedNoun.has(noun) && attempts < 20);

    usedAdj.add(adj);
    usedNoun.add(noun);
    labels.push(`${adj} ${noun}`);
  }
  return labels;
}

// ─── URL State Encoding / Decoding ────────────────────────────────────────────

function encodeState(names, teamCount, seed, useRandomNames) {
  const params = new URLSearchParams();
  params.set('names', names.join(','));
  params.set('teams', teamCount);
  params.set('seed', seed);
  if (useRandomNames) params.set('rnames', '1');
  return `${location.origin}${location.pathname}?${params.toString()}`;
}

function decodeState() {
  const params = new URLSearchParams(location.search);
  if (!params.has('names')) return null;
  return {
    names: params.get('names').split(',').map(n => n.trim()).filter(Boolean),
    teamCount: Math.min(10, Math.max(2, parseInt(params.get('teams'), 10) || 2)),
    seed: params.get('seed') || generateSeed(),
    useRandomNames: params.get('rnames') === '1'
  };
}

// ─── Clipboard & Share ────────────────────────────────────────────────────────

function copyResultsToClipboard(teams, labels) {
  const text = teams.map((members, i) =>
    `${labels[i]}:\n${members.map(m => `  • ${m}`).join('\n')}`
  ).join('\n\n');

  navigator.clipboard.writeText(text)
    .then(() => showToast('Results copied!'))
    .catch(() => showToast('Copy failed — try selecting the text manually'));
}

function shareURL() {
  if (!state.seed) return;
  const url = encodeState(state.names, state.teamCount, state.seed, state.useRandomNames);
  if (navigator.share) {
    navigator.share({ title: 'Team Results', url }).catch(() => {
      // Share failed (e.g. file:// protocol, user cancelled) — fall back to clipboard
      navigator.clipboard.writeText(url)
        .then(() => showToast('Link copied!'))
        .catch(() => showToast('Could not copy link'));
    });
  } else {
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link copied!'))
      .catch(() => showToast('Could not copy link'));
  }
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

// ─── XSS Safety ──────────────────────────────────────────────────────────────

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function renderTeams(teams, labels) {
  elGrid.innerHTML = '';

  teams.forEach((members, i) => {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.innerHTML = `
      <div class="team-card-header" style="background:${TEAM_COLORS[i % TEAM_COLORS.length]}">
        <span class="team-name">${escapeHTML(labels[i])}</span>
        <span class="member-count">${members.length} member${members.length !== 1 ? 's' : ''}</span>
      </div>
      <ul class="team-card-body" aria-label="${escapeHTML(labels[i])} members">
        ${members.map(m => `<li>${escapeHTML(m)}</li>`).join('')}
      </ul>
    `;
    elGrid.appendChild(card);
  });

  elResults.hidden = false;
  elResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

// ─── Core Generate ────────────────────────────────────────────────────────────

function generate(seed) {
  const names = parseNames(elNames.value);
  const teamCount = Math.min(10, Math.max(2, parseInt(elCount.value, 10) || 2));
  const useRandomNames = elRandomToggle.checked;

  if (names.length < 2) {
    showToast('Enter at least 2 names');
    return;
  }
  if (names.length < teamCount) {
    showToast(`Need at least ${teamCount} names for ${teamCount} teams`);
    return;
  }

  const usedSeed = seed || generateSeed();
  const rand = mulberry32(usedSeed);
  const teams = assignTeams(names, teamCount, rand);

  let labels;
  if (useRandomNames) {
    // Use a second seeded PRNG pass so team names are also reproducible from the same seed
    const rand2 = mulberry32(usedSeed + '_names');
    labels = generateTeamNames(teamCount, rand2);
  } else {
    labels = teams.map((_, i) => `Team ${i + 1}`);
  }

  state = { names, teamCount, seed: usedSeed, teams, teamLabels: labels, useRandomNames };
  renderTeams(teams, labels);
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

elGenerate.addEventListener('click', () => generate());

elReshuffle.addEventListener('click', () => {
  if (state.names.length === 0) return;
  // Re-read current textarea in case user edited it
  generate(generateSeed());
});

elShare.addEventListener('click', shareURL);

elCopy.addEventListener('click', () => {
  if (state.teams.length === 0) return;
  copyResultsToClipboard(state.teams, state.teamLabels);
});

document.getElementById('btn-print').addEventListener('click', () => {
  window.print();
});

elCount.addEventListener('change', () => {
  let v = parseInt(elCount.value, 10);
  if (isNaN(v)) v = 2;
  elCount.value = Math.min(10, Math.max(2, v));
});

document.getElementById('btn-decrease').addEventListener('click', () => {
  elCount.value = Math.max(2, parseInt(elCount.value, 10) - 1);
});

document.getElementById('btn-increase').addEventListener('click', () => {
  elCount.value = Math.min(10, parseInt(elCount.value, 10) + 1);
});

elFileInput.addEventListener('change', (e) => {
  handleFileUpload(e.target.files[0]);
  // Reset input so the same file can be re-uploaded if needed
  e.target.value = '';
});

// Allow drag-and-drop onto the textarea
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
    elCount.value = loaded.teamCount;
    elRandomToggle.checked = loaded.useRandomNames;
    generate(loaded.seed);
  }
});
