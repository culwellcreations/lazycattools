const THEME = (k, label, on) => `<button type="button" class="seg" data-theme="${k}" aria-pressed="${on}">${label}</button>`;

export default {
  title: 'Random Team Name Generator: Free, No Sign-Up | Lazy Cat Tools',
  description: 'Free random team name generator. Pick a theme (gaming, trivia, sports, work or silly) and get up to 10 team name ideas at a time. No sign-up.',
  ogDescription: 'Team name ideas for gaming, trivia, sports, work or silly. Free, no sign-up.',
  intro: 'Pick a theme and get team names to choose from. Free, no sign-up, and it all runs in your browser.',
  css: true,
  crosslink: { slug: 'random-team-generator', text: 'Need to split people into the teams first?' },

  tool: `
<section class="input-section" aria-label="Team name settings">
  <div class="field-group">
    <span class="label" id="theme-label">Theme</span>
    <div class="segmented" role="group" aria-labelledby="theme-label">
      ${THEME('gaming', 'Gaming', true)}
      ${THEME('trivia', 'Trivia', false)}
      ${THEME('sports', 'Sports', false)}
      ${THEME('work', 'Work', false)}
      ${THEME('silly', 'Silly', false)}
    </div>
  </div>

  <div class="controls-row">
    <div class="field-group">
      <label for="count">How many names?</label>
      <select id="count">
        ${Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}"${i === 4 ? ' selected' : ''}>${i + 1}</option>`).join('')}
      </select>
    </div>
  </div>

  <p class="form-error" id="form-error" role="alert" hidden></p>
  <button type="button" class="btn-primary" id="btn-generate">Generate names</button>
</section>

<section class="results-section" id="results" aria-labelledby="results-heading" hidden>
  <h2 class="results-heading" id="results-heading">Team names</h2>
  <ul class="result-list names" id="name-list"></ul>
  <p class="visually-hidden" id="announce" aria-live="polite"></p>
  <div class="action-row">
    <button type="button" class="btn-secondary" id="btn-more">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
      Generate more
    </button>
    <button type="button" class="btn-secondary" id="btn-copy-all">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      Copy all
    </button>
  </div>
</section>`,

  content: `
<h2>How to Use the Team Name Generator</h2>
<p>Pick a theme, choose how many names you want, from 1 to 10, and tap <strong>Generate names</strong>. Each name has its own <strong>Copy</strong> button, or use <strong>Copy all</strong> for the whole list. Nothing you like? <strong>Generate more</strong> swaps in a fresh batch.</p>

<h2>How the names are made</h2>
<p>Each name is one adjective plus one noun, picked at random from a list for that theme: 30 of each, so every theme can make hundreds of different names. Gaming leans dramatic (Shadow Wolves), Trivia leans nerdy (Brainy Owls), Sports sounds like a real team (Golden Hawks), Work pokes fun at the office (Reply-All Rockstars), and Silly is just silly (Soggy Waffles). No name repeats within a batch.</p>
<p>The words are picked with your browser's secure random number generator. The word lists are part of the page, so nothing is looked up online and nothing is saved.</p>

<h2>Ways to use it</h2>
<ul>
  <li><strong>Gaming squads and clans.</strong> Something better than "Team 1".</li>
  <li><strong>Trivia night.</strong> A name for the answer sheet before the first round.</li>
  <li><strong>Fantasy sports.</strong> A starting point you can tweak into a pun.</li>
  <li><strong>Work team-building.</strong> The Work theme is in on the joke.</li>
  <li><strong>Youth groups and camps.</strong> Silly names go over well with kids.</li>
</ul>`,

  faq: [
    ['How are the names made?', 'Each name is a random adjective plus a random noun from the theme\'s word list, like "Neon Krakens" or "Fluffy Burritos". Every theme has 30 adjectives and 30 nouns.'],
    ['Can I pick a theme?', 'Yes: Gaming, Trivia, Sports, Work or Silly. Switching themes switches the word lists.'],
    ['How many names can I generate at once?', 'From 1 to 10. Names in the same batch never repeat. Tap <strong>Generate more</strong> for a new batch.'],
    ['Can I copy a name?', 'Yes. Every name has its own <strong>Copy</strong> button, and <strong>Copy all</strong> copies the whole list, one name per line.'],
    ['Is anything saved?', 'No. The names are made in your browser and nothing is saved or sent anywhere.'],
  ],
};
