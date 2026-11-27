const opts = (from, to, sel) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
  .map((n) => `<option value="${n}"${n === sel ? ' selected' : ''}>${n}</option>`).join('');

export default {
  title: 'Giveaway Winner Picker: Fair Draw, No Sign-Up | Lazy Cat Tools',
  description: 'Free giveaway winner picker. Paste your entries, remove duplicates, and draw winners and backup alternates with a timestamped result. No sign-up, nothing uploaded.',
  ogDescription: 'Draw fair giveaway winners and alternates with a timestamped result. Free, no sign-up.',
  intro: 'Paste your entries, choose how many winners and backups you need, and draw. Free, no sign-up, and your list never leaves your browser.',
  css: true,
  crosslink: { slug: 'spin-the-wheel', text: 'Want the draw to look good on a stream?' },

  tool: `
<section class="input-section" aria-label="Giveaway setup">
  <div class="field-group">
    <div class="label-row">
      <label for="entries">Entries <span class="hint">(one per line, up to 1,000)</span></label>
      <button type="button" class="btn-text" id="btn-clear">Clear</button>
    </div>
    <textarea id="entries" rows="8" spellcheck="false" autocomplete="off" placeholder="@sam_bakes&#10;@jordan.t&#10;@caseyreads&#10;@morgan_k"></textarea>
    <p class="count-line" id="entry-count" aria-live="polite">0 entries</p>
  </div>

  <div class="controls-row">
    <div class="field-group">
      <label for="winners">Winners</label>
      <select id="winners">${opts(1, 10, 1)}</select>
    </div>
    <div class="field-group">
      <label for="alternates">Alternates <span class="hint">(backups)</span></label>
      <select id="alternates">${opts(0, 5, 0)}</select>
    </div>
  </div>

  <label class="toggle-label">
    <input type="checkbox" id="dedupe" checked>
    <span>Remove duplicate entries <span class="hint">(off: each copy counts as another chance)</span></span>
  </label>

  <p class="form-error" id="form-error" role="alert" hidden></p>
  <button type="button" class="btn-primary" id="btn-draw">Pick winners</button>
  <p class="field-note">Draw on camera or screenshot the timestamped result so everyone can see it was fair.</p>
</section>

<section class="results-section" id="results" aria-labelledby="results-heading" hidden>
  <div class="draw-card" id="draw-card">
    <h2 class="results-heading" id="results-heading">Winner</h2>
    <ol class="result-list winners" id="winner-list"></ol>
    <div id="alt-block" hidden>
      <h3 class="results-heading alt-heading">Alternates <span class="alt-note">(in order, if a winner doesn't respond)</span></h3>
      <ol class="result-list" id="alt-list"></ol>
    </div>
    <p class="stamp" id="stamp"></p>
  </div>
  <p class="visually-hidden" id="announce" aria-live="polite"></p>
  <div class="action-row">
    <button type="button" class="btn-secondary" id="btn-copy">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      Copy winners
    </button>
    <button type="button" class="btn-secondary" id="btn-again">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
      Draw again
    </button>
  </div>
</section>`,

  content: `
<h2>How to Use the Giveaway Winner Picker</h2>
<p>Paste your entries, one per line: usernames from the comments, names from a sign-up sheet, ticket numbers. Choose how many winners you need, from 1 to 10, and how many alternates, up to 5. Alternates are backups, in order, for when a winner doesn't reply. Tap <strong>Pick winners</strong>. The result is stamped with the date and time, so take a screenshot or <strong>Copy winners</strong> to post it.</p>

<h2>Duplicates</h2>
<p>With <strong>Remove duplicate entries</strong> on, repeated lines count once, and the page tells you how many it removed. Lines that differ only in capital letters or spacing count as the same, so <strong>@Sam</strong> and <strong>@sam</strong> are one person. Turn it off when extra entries are allowed, like one extra entry per friend tagged. Then every copy is another chance to win, though nobody can win twice in the same draw.</p>

<h2>How the draw works</h2>
<p>Every entry has the same chance. Winners are drawn without putting anyone back, so the winners and the alternates are all different people. The draw uses your browser's secure random number generator to shuffle the entries, not the predictable kind built into most simple scripts.</p>
<p>Your list stays on your device. Nothing is uploaded or saved, and it's gone when you close the tab.</p>

<h2>Ways to use it</h2>
<ul>
  <li><strong>Instagram, Facebook and TikTok giveaways.</strong> Copy the commenters' names into the box.</li>
  <li><strong>Raffles.</strong> One line per ticket number.</li>
  <li><strong>Classroom prize draws.</strong> Draw winners with a couple of alternates for anyone who's absent.</li>
  <li><strong>Stream giveaways.</strong> Draw on screen so chat sees it happen.</li>
  <li><strong>Picking a volunteer.</strong> One winner, no arguments.</li>
</ul>`,

  faq: [
    ['Is the draw really random?', "Yes. Every entry has the same chance. The entries are shuffled with your browser's secure random number generator, and winners and alternates are taken from the top of that shuffle."],
    ['What if the same name is entered twice?', 'With <strong>Remove duplicate entries</strong> on (the default), it counts once and the page shows how many duplicates were removed. With it off, each copy is an extra chance, but nobody can win twice in one draw.'],
    ['How many winners can I pick?', "From 1 to 10 winners, plus up to 5 alternates, from up to 1,000 entries. Winners plus alternates can't be more than the number of entries."],
    ['What are alternates for?', "Backups. If a winner doesn't reply or can't take the prize, go to alternate 1, then 2, and so on. Alternates are never the same people as the winners."],
    ['Is my list uploaded anywhere?', 'No. The draw happens in your browser and nothing is saved or sent anywhere.'],
  ],
};
