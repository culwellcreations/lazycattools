export default {
  title: 'Random Order Generator: List Shuffler, No Sign-Up | Lazy Cat Tools',
  description: 'Free random order generator. Paste a list and shuffle it into a fair, numbered running order. Every item appears once. No sign-up, nothing uploaded.',
  ogDescription: 'Shuffle a list into a fair, numbered running order. Free, no sign-up.',
  intro: 'Paste a list and shuffle it into a random, numbered order. Free, no sign-up, and your list never leaves your browser.',
  crosslink: { slug: 'random-team-generator', text: 'Splitting the list into groups instead?' },

  tool: `
<section class="input-section" aria-label="List to shuffle">
  <div class="field-group">
    <div class="label-row">
      <label for="items">Items <span class="hint">(one per line)</span></label>
      <span class="count" id="item-count" aria-live="polite">5 items</span>
    </div>
    <textarea id="items" rows="7" spellcheck="false" autocomplete="off">Alex
Sam
Jordan
Taylor
Casey</textarea>
    <div class="upload-row">
      <button type="button" class="btn-text" id="btn-clear">Clear list</button>
    </div>
  </div>

  <p class="form-error" id="form-error" role="alert" hidden></p>
  <button type="button" class="btn-primary" id="btn-shuffle">Shuffle</button>
</section>

<section class="results-section" id="results" aria-labelledby="results-heading" hidden>
  <h2 class="results-heading" id="results-heading">Running order</h2>
  <ol class="result-list" id="order-list"></ol>
  <p class="visually-hidden" id="announce" aria-live="polite"></p>
  <div class="action-row">
    <button type="button" class="btn-secondary" id="btn-again">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
      Shuffle again
    </button>
    <button type="button" class="btn-secondary" id="btn-copy">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      Copy order
    </button>
  </div>
</section>`,

  content: `
<h2>How to Use the Random Order Generator</h2>
<p>Type or paste your list, one item per line, from 2 to 500 items. Tap <strong>Shuffle</strong> and you get the whole list back in a random, numbered order. <strong>Shuffle again</strong> gives a fresh order from the same list, and <strong>Copy order</strong> copies it with the numbers, ready to paste into a chat or a doc.</p>

<h2>What happens to your list</h2>
<p>Every item shows up exactly once. Nothing is dropped and nothing is added. Blank lines are skipped. If you typed the same thing on two lines, it stays in twice, on the assumption you meant it.</p>
<p>The shuffle is a Fisher–Yates shuffle using your browser's secure random number generator, so every possible order is equally likely and the first item on your list has no better chance of going first. It all happens on your device. Nothing is uploaded or saved.</p>

<h2>Ways to use it</h2>
<ul>
  <li><strong>Presentation order.</strong> Class presentations, standups, demo day.</li>
  <li><strong>Turn order.</strong> Board games, draft picks, who goes first at karaoke.</li>
  <li><strong>Auditions and tryouts.</strong> A running order nobody can say was rigged.</li>
  <li><strong>Playlists.</strong> Paste the song titles and get a fresh order.</li>
  <li><strong>Chores.</strong> Shuffle the jobs, then hand them out in order.</li>
</ul>`,

  faq: [
    ['Is the order really random?', "Yes. It's a Fisher–Yates shuffle, the standard method for this, using your browser's secure random number generator. Every possible order is equally likely."],
    ['Does every item appear once?', 'Yes. The output has exactly the items you put in, each once. If you typed something twice, it appears twice, because each line is its own item.'],
    ['What happens to blank lines?', 'They\'re ignored. So are spaces at the start and end of a line.'],
    ['How many items can I shuffle?', 'From 2 to 500.'],
    ['Is my list uploaded anywhere?', 'No. The shuffle runs in your browser and nothing is saved or sent anywhere.'],
  ],
};
