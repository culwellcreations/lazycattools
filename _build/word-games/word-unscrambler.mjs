export const lengthOptions = (opts) => opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');

export const filters = ({ contains = true, lengths }) => `
<fieldset class="wg-filters" id="filters">
  <legend>Filters (optional)</legend>
  <div class="controls-row">
    <div class="field-group">
      <label for="f-len">Word length</label>
      <select id="f-len" data-filter="len">${lengthOptions(lengths)}</select>
    </div>
    <div class="field-group">
      <label for="f-starts">Starts with</label>
      <input type="text" id="f-starts" data-filter="starts" maxlength="1" autocomplete="off" autocapitalize="off" spellcheck="false">
    </div>
    <div class="field-group">
      <label for="f-ends">Ends with</label>
      <input type="text" id="f-ends" data-filter="ends" maxlength="1" autocomplete="off" autocapitalize="off" spellcheck="false">
    </div>${contains ? `
    <div class="field-group">
      <label for="f-contains">Contains</label>
      <input type="text" id="f-contains" data-filter="contains" maxlength="1" autocomplete="off" autocapitalize="off" spellcheck="false">
    </div>` : ''}
  </div>
  <button type="button" class="btn-text" id="btn-clear-filters">Clear filters</button>
</fieldset>`;

export const COPY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

export const PRIVATE_NOTE = '<p class="field-note">The word list is built into this page, so nothing you type is sent anywhere.</p>';

export default {
  title: 'Word Unscrambler | Unscramble Letters Into Words, Free | Lazy Cat Tools',
  description: 'Free word unscrambler. Enter jumbled letters and see every valid word you can make. No sign-up, nothing uploaded.',
  ogDescription: 'Enter jumbled letters and see every word you can make. Free, no sign-up.',
  intro: 'Type your jumbled letters and see every word they make, longest first. Free forever, no sign-up, and nothing you type leaves your browser.',

  tool: `
<form class="input-section" id="wg-form" aria-label="Letters to unscramble" novalidate>
  <div class="field-group">
    <label for="letters">Your letters <span class="hint">(2 to 15, in any order)</span></label>
    <div class="wg-entry">
      <input type="text" id="letters" class="wg-letters" maxlength="40" placeholder="Try listen" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="search" aria-describedby="letter-count form-error">
      <button type="submit" class="btn-primary">Unscramble</button>
    </div>
    <span class="count" id="letter-count" aria-live="polite">0 letters</span>
  </div>
  <p class="form-error" id="form-error" role="alert" hidden></p>
${filters({ lengths: [['all', 'All'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7+', '7+']] })}
</form>

<section class="results-section" id="results" aria-labelledby="results-heading" hidden>
  <div class="wg-results-head">
    <h2 class="results-heading" id="results-heading">Words found</h2>
    <button type="button" class="btn-secondary" id="btn-copy-all">${COPY_ICON} Copy all</button>
  </div>
  <p class="wg-summary" id="summary"></p>
  <div class="wg-scroll" id="word-groups" tabindex="0" role="region" aria-label="Words found"></div>
  <p class="visually-hidden" id="announce" aria-live="polite"></p>
</section>

${PRIVATE_NOTE}`,

  content: `
<h2>How the word unscrambler works</h2>
<ol>
  <li>Type the letters you have, from 2 to 15, in any order. Spaces and anything that isn't a letter are ignored.</li>
  <li>Tap <strong>Unscramble</strong>, or press Enter.</li>
  <li>Every word those letters can make shows up, grouped by length with the longest words first and A to Z inside each group. Each letter is used no more times than you typed it, so <strong>TCA</strong> gives CAT, ACT and AT, but not TAT.</li>
</ol>
<p>Use the filters to narrow a long list: pick a word length, or set the first letter, the last letter, or a letter the word has to contain. The filters work together, so length 5 plus "starts with S" shows only five-letter words that start with S. The page shows up to 200 words at a time and tells you how many it found in total. <strong>Copy all</strong> copies every word it found, one per line.</p>

<h2>Which words it knows</h2>
<p>The list holds about {{WORDS}} common English words of 2 to 15 letters. It comes from SCOWL, a free English word list by Kevin Atkinson, cut down to plain everyday words: no names of people or places, no abbreviations, and no slurs or swear words. That makes it good for everyday word games, but it isn't the official Scrabble dictionary. Some Scrabble-only words like QI and ZA aren't in it. For scores and blank tiles, use the <a href="/word-games/scrabble-word-finder/">Scrabble Word Finder</a>.</p>

<h2>Ways to use it</h2>
<ul>
  <li><strong>Scrabble and Words With Friends.</strong> See everything your tiles can spell before you plan a play.</li>
  <li><strong>Wordle.</strong> Once you have all five letters but not their order, put them in, set the length to 5, and see which words they spell.</li>
  <li><strong>Crosswords.</strong> Use the length and first-letter filters to fill a clue you have letters for.</li>
  <li><strong>Word games with kids.</strong> Give them a pile of letters and see how many words they can find before you check.</li>
</ul>

<h2>Everything runs in your browser</h2>
<p>The word list is built into the page and the search runs on your device. Nothing you type is sent to a server or saved.</p>`,

  faq: [
    ['How does the word unscrambler work?', 'It checks your letters against every word in its list and keeps the ones you can spell, using each letter no more times than you typed it. It compares letter counts instead of trying every order of your letters, which is why even 15 letters come back instantly.'],
    ['How many letters can I enter?', 'From 2 to 15. Spaces, numbers and punctuation are ignored, so you can paste letters with commas between them.'],
    ['Does it work for Scrabble?', 'It finds every common English word in your letters, which covers most Scrabble plays, but it doesn\'t use the official Scrabble dictionary or count points. The <a href="/word-games/scrabble-word-finder/">Scrabble Word Finder</a> handles blank tiles and sorts words by score.'],
    ['Can I filter by length?', 'Yes. Pick 2 to 6 letters, or 7+ for the long words. You can also set the first letter, last letter, or a letter the word must contain, and combine them.'],
    ['Is my input uploaded anywhere?', 'No. The word list of about {{WORDS}} words is built into the page and the search runs in your browser, so nothing you type is sent or saved.'],
  ],
};
