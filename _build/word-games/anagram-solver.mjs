import { COPY_ICON, PRIVATE_NOTE } from './word-unscrambler.mjs';

export default {
  title: 'Anagram Solver | Find Anagrams of Any Word, Free | Lazy Cat Tools',
  description: 'Free anagram solver. Enter letters and find every word that uses all of them. No sign-up, nothing uploaded.',
  ogDescription: 'Enter letters and find every word that uses all of them. Free, no sign-up.',
  intro: 'Type a word or a set of letters and find every word that uses all of them, exactly once each. Free forever, no sign-up, and nothing you type leaves your browser.',

  tool: `
<form class="input-section" id="wg-form" aria-label="Letters to find anagrams for" novalidate>
  <div class="field-group">
    <label for="letters">Word or letters <span class="hint">(2 to 15 letters)</span></label>
    <div class="wg-entry">
      <input type="text" id="letters" class="wg-letters" maxlength="40" placeholder="Try listen" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="search" aria-describedby="letter-count form-error">
      <button type="submit" class="btn-primary">Find anagrams</button>
    </div>
    <div class="wg-entry-meta">
      <span class="count" id="letter-count" aria-live="polite">0 letters</span>
      <span class="field-note">Anagrams use all your letters. For shorter words, use the <a href="/word-games/word-unscrambler/">Word Unscrambler</a>.</span>
    </div>
  </div>
  <p class="form-error" id="form-error" role="alert" hidden></p>
  <div class="field-group wg-contains">
    <label for="f-contains">Contains <span class="hint">(optional, one letter)</span></label>
    <input type="text" id="f-contains" data-filter="contains" maxlength="1" autocomplete="off" autocapitalize="off" spellcheck="false">
  </div>
</form>

<section class="results-section" id="results" aria-labelledby="results-heading" hidden>
  <div class="wg-results-head">
    <h2 class="results-heading" id="results-heading">Anagrams</h2>
    <button type="button" class="btn-secondary" id="btn-copy-all">${COPY_ICON} Copy all</button>
  </div>
  <p class="wg-summary" id="summary"></p>
  <div class="wg-scroll" id="word-groups" tabindex="0" role="region" aria-label="Anagrams found"></div>
  <p class="wg-after">Looking for shorter words? Try the <a href="/word-games/word-unscrambler/">Word Unscrambler</a>.</p>
  <p class="visually-hidden" id="announce" aria-live="polite"></p>
</section>

${PRIVATE_NOTE}`,

  content: `
<h2>How the anagram solver works</h2>
<ol>
  <li>Type a word or a jumble of letters, from 2 to 15. Spaces and punctuation are ignored, so a name like "Mary Ann" works too.</li>
  <li>Tap <strong>Find anagrams</strong>, or press Enter.</li>
  <li>You get every word that uses all of your letters, each one exactly as many times as you typed it, in A to Z order.</li>
</ol>
<p>LISTEN gives ENLIST, INLETS, LISTEN, SILENT and TINSEL. Your own word shows up in the list when it's a real word, since it's an anagram of itself. If you only want words with a certain letter, fill in <strong>Contains</strong>.</p>
<p>Anagrams use all your letters. When you'd rather see the shorter words hiding in them too, the <a href="/word-games/word-unscrambler/">Word Unscrambler</a> uses the same word list and shows every length.</p>

<h2>Which words it knows</h2>
<p>About {{WORDS}} common English words of 2 to 15 letters, from SCOWL, a free English word list by Kevin Atkinson. Names, abbreviations, slurs and swear words are left out, and only single words count, so it won't turn "dormitory" into "dirty room". It isn't the official Scrabble dictionary.</p>

<h2>Ways to use it</h2>
<ul>
  <li><strong>Anagram puzzles.</strong> Check the answer to a newspaper jumble or a puzzle book clue.</li>
  <li><strong>Scrabble.</strong> See whether all seven tiles make a word, for the 50-point bonus.</li>
  <li><strong>Word games.</strong> Settle whether a rearrangement counts.</li>
  <li><strong>Hidden words in a name.</strong> Type a name and see if its letters spell anything.</li>
</ul>

<h2>Everything runs in your browser</h2>
<p>The word list is built into the page and the search runs on your device. Nothing you type is sent to a server or saved.</p>`,

  faq: [
    ['What is an anagram?', 'A word made by rearranging all the letters of another word, using each letter exactly once. SILENT is an anagram of LISTEN, and ACT is an anagram of CAT.'],
    ['How is this different from the Word Unscrambler?', 'The anagram solver only shows words that use every one of your letters. The <a href="/word-games/word-unscrambler/">Word Unscrambler</a> also shows the shorter words you can make from some of them.'],
    ['How many letters can I enter?', 'From 2 to 15. Spaces, numbers and punctuation are ignored.'],
    ['What if there is no anagram?', 'The page says so. Plenty of letter sets don\'t make a full-length word, and the <a href="/word-games/word-unscrambler/">Word Unscrambler</a> will show you the shorter words they do make.'],
    ['Is my input uploaded anywhere?', 'No. The word list is built into the page and the search runs in your browser, so nothing you type is sent or saved.'],
  ],
};
