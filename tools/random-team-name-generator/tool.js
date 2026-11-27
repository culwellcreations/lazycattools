// Random Team Name Generator. Word lists and logic first (also used by the
// Node test), then the page. Names are "Adjective + Noun" from these lists.
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('../../assets/js/rand.js') : root.Rand;

  const THEMES = {
    gaming: {
      label: 'Gaming',
      adj: ['Shadow', 'Turbo', 'Pixel', 'Neon', 'Crimson', 'Frozen', 'Phantom', 'Cyber', 'Rogue', 'Savage', 'Silent', 'Atomic', 'Stealth', 'Hyper', 'Thunder', 'Venom', 'Blazing', 'Iron', 'Rapid', 'Glitch', 'Lunar', 'Toxic', 'Quantum', 'Feral', 'Lethal', 'Midnight', 'Rocket', 'Static', 'Arcade', 'Overclocked'],
      noun: ['Wolves', 'Ninjas', 'Wizards', 'Raptors', 'Reapers', 'Titans', 'Vipers', 'Ghosts', 'Dragons', 'Phoenixes', 'Hunters', 'Knights', 'Spartans', 'Sentinels', 'Outlaws', 'Mavericks', 'Specters', 'Rangers', 'Cyclones', 'Golems', 'Krakens', 'Snipers', 'Bandits', 'Samurai', 'Mages', 'Raiders', 'Goblins', 'Juggernauts', 'Respawns', 'Noobs'],
    },
    trivia: {
      label: 'Trivia',
      adj: ['Quiz', 'Brainy', 'Clever', 'Curious', 'Nerdy', 'Smarty', 'Wise', 'Know-It-All', 'Sharp', 'Bookish', 'Puzzled', 'Fact-Checking', 'Bright', 'Witty', 'Trivial', 'Studious', 'Encyclopedic', 'Logical', 'Overthinking', 'Quizzical', 'Mastermind', 'Random', 'Footnote', 'Late-Night', 'Lucky-Guess', 'Well-Read', 'Nitpicking', 'Genius', 'Second-Guessing', 'Peculiar'],
      noun: ['Owls', 'Einsteins', 'Wizards', 'Brainiacs', 'Scholars', 'Professors', 'Nerds', 'Know-It-Alls', 'Bookworms', 'Geniuses', 'Detectives', 'Librarians', 'Encyclopedias', 'Thinkers', 'Quizzards', 'Smarties', 'Eggheads', 'Answers', 'Guessers', 'Philosophers', 'Historians', 'Trivianators', 'Fact Hunters', 'Pundits', 'Sages', 'Mathletes', 'Masterminds', 'Bluffers', 'Underdogs', 'Question Marks'],
    },
    sports: {
      label: 'Sports',
      adj: ['Thunder', 'Lightning', 'Mighty', 'Golden', 'Fighting', 'Flying', 'Fast', 'Iron', 'Steel', 'Wild', 'Raging', 'Roaring', 'Charging', 'Blue', 'Red', 'Black', 'Silver', 'Storm', 'Rapid', 'Fearless', 'Rumbling', 'Gritty', 'Victory', 'Hustle', 'Clutch', 'Prime', 'Rebel', 'Northern', 'Southern', 'Mountain'],
      noun: ['Eagles', 'Tigers', 'Bears', 'Lions', 'Hawks', 'Bulls', 'Panthers', 'Sharks', 'Stallions', 'Wolves', 'Falcons', 'Hornets', 'Rams', 'Cougars', 'Jaguars', 'Mustangs', 'Bison', 'Grizzlies', 'Cobras', 'Wildcats', 'Comets', 'Rockets', 'Thunderbolts', 'Titans', 'Kodiaks', 'Ospreys', 'Badgers', 'Bobcats', 'Owls', 'Mavericks'],
    },
    work: {
      label: 'Work',
      adj: ['Synergy', 'Agile', 'Strategic', 'Quarterly', 'Bottom-Line', 'Big-Picture', 'Action-Item', 'Circle-Back', 'Deadline', 'Spreadsheet', 'Low-Key', 'Overcaffeinated', 'Bandwidth', 'Pivot', 'Paperclip', 'Inbox-Zero', 'Out-of-Office', 'Reply-All', 'Corner-Office', 'KPI', 'Data-Driven', 'Cross-Functional', 'Mission-Critical', 'Scalable', 'Streamlined', 'Proactive', 'Midweek', 'Monday', 'Remote', 'Hybrid'],
      noun: ['Dream Team', 'Visionaries', 'Innovators', 'Achievers', 'Trailblazers', 'Go-Getters', 'Disruptors', 'Strategists', 'Problem Solvers', 'Movers', 'Shakers', 'Closers', 'Rockstars', 'Mavericks', 'Collaborators', 'Champions', 'Pioneers', 'Thinkers', 'Doers', 'Squad', 'Crew', 'Task Force', 'Think Tank', 'Brain Trust', 'Dynamos', 'Hustlers', 'Optimizers', 'Deliverables', 'Stakeholders', 'Spreadsheeters'],
    },
    silly: {
      label: 'Silly',
      adj: ['Wobbly', 'Grumpy', 'Fuzzy', 'Sleepy', 'Soggy', 'Sneaky', 'Bouncy', 'Cheesy', 'Giggly', 'Spicy', 'Squishy', 'Clumsy', 'Fluffy', 'Snoozy', 'Wiggly', 'Crunchy', 'Sassy', 'Dizzy', 'Noodly', 'Jiggly', 'Bumbling', 'Mischievous', 'Lazy', 'Snack-Sized', 'Unbothered', 'Chaotic', 'Sparkly', 'Lumpy', 'Goofy', 'Zany'],
      noun: ['Pickles', 'Potatoes', 'Llamas', 'Penguins', 'Waffles', 'Noodles', 'Narwhals', 'Pancakes', 'Muffins', 'Platypuses', 'Sloths', 'Nuggets', 'Meatballs', 'Marshmallows', 'Socks', 'Ducks', 'Gnomes', 'Raccoons', 'Tater Tots', 'Burritos', 'Hamsters', 'Dumplings', 'Cats', 'Goats', 'Turnips', 'Jellybeans', 'Unicorns', 'Walruses', 'Squirrels', 'Bagels'],
    },
  };

  // Skip pairs that repeat a word, like "Know-It-All Know-It-Alls" or
  // "Thunder Thunderbolts".
  const clash = (a, n) => n.toLowerCase().startsWith(a.toLowerCase().slice(0, 5));

  function generate(theme, count) {
    const t = THEMES[theme];
    if (!t) return { error: 'Pick a theme.' };
    if (!Number.isInteger(count) || count < 1 || count > 10) return { error: 'Generate 1 to 10 names at a time.' };
    const names = new Set();
    while (names.size < count) {
      const a = t.adj[R.int(t.adj.length)];
      const n = t.noun[R.int(t.noun.length)];
      if (!clash(a, n)) names.add(`${a} ${n}`);
    }
    return { names: [...names] };
  }

  const logic = { THEMES, generate, clash };
  if (isNode) { module.exports = logic; return; }

  // ─── Page ──────────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  let theme = 'gaming';
  let last = null;

  function setTheme(k) {
    theme = k;
    document.querySelectorAll('[data-theme]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === k)));
  }
  document.querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.theme)));

  const COPY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  function run() {
    const res = generate(theme, Number($('count').value));
    if (res.error) { $('form-error').textContent = res.error; $('form-error').hidden = false; return; }
    $('form-error').hidden = true;
    last = res.names;
    $('results').hidden = false;
    $('results-heading').textContent = `${THEMES[theme].label} team names`;
    const ul = $('name-list');
    ul.innerHTML = '';
    res.names.forEach((name) => {
      const li = document.createElement('li');
      const v = document.createElement('span'); v.className = 'grow'; v.textContent = name;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-secondary copy-one';
      b.innerHTML = `${COPY_ICON} Copy`;
      b.setAttribute('aria-label', `Copy ${name}`);
      R.copyButton(b, () => name, `Copied “${name}”`);
      li.append(v, b);
      ul.appendChild(li);
    });
    ul.classList.remove('is-fresh'); void ul.offsetWidth; ul.classList.add('is-fresh');
    $('announce').textContent = `Team names: ${res.names.join(', ')}.`;
  }

  $('btn-generate').addEventListener('click', run);
  $('btn-more').addEventListener('click', run);
  R.copyButton($('btn-copy-all'), () => (last ? last.join('\n') : ''), 'Copied all names');
})(typeof window !== 'undefined' ? window : globalThis);
