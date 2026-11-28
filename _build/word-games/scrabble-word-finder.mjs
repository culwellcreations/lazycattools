import { COPY_ICON, PRIVATE_NOTE, filters } from './word-unscrambler.mjs';

const TILES = [
  ['1 point', 'A E I O U L N S T R'],
  ['2 points', 'D G'],
  ['3 points', 'B C M P'],
  ['4 points', 'F H V W Y'],
  ['5 points', 'K'],
  ['8 points', 'J X'],
  ['10 points', 'Q Z'],
  ['0 points', 'Blank tile'],
];

const table = `<table class="wg-tiles">
  <caption>Scrabble letter scores</caption>
  <tbody>
${TILES.map(([p, l]) => `    <tr><th scope="row">${p}</th><td>${l}</td></tr>`).join('\n')}
  </tbody>
</table>`;

export default {
  title: 'Scrabble Word Finder | Find Words & Scores, Free | Lazy Cat Tools',
  description: 'Free Scrabble word finder. Enter your rack letters, including blanks, and see playable words with scores. No sign-up.',
  ogDescription: 'Enter your rack, blanks included, and see words sorted by Scrabble score. Free, no sign-up.',
  intro: 'Type the tiles on your rack and see every word they make, highest score first, blank tiles included. Free forever, no sign-up, and nothing you type leaves your browser.',

  tool: `
<form class="input-section" id="wg-form" aria-label="Rack letters" novalidate>
  <p class="field-note" id="rack-help">Up to 7 tiles. Type a blank tile as <strong>?</strong> or <strong>_</strong> (up to 2).</p>
  <div class="field-group">
    <label for="letters">Your rack</label>
    <div class="wg-entry">
      <input type="text" id="letters" class="wg-letters" maxlength="30" placeholder="Try retains or c?t" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="search" aria-describedby="rack-help letter-count form-error">
      <button type="submit" class="btn-primary">Find words</button>
    </div>
    <span class="count" id="letter-count" aria-live="polite">0 tiles</span>
  </div>
  <p class="form-error" id="form-error" role="alert" hidden></p>
${filters({ contains: false, lengths: [['all', 'All'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7']] })}
</form>

<section class="results-section" id="results" aria-labelledby="results-heading" hidden>
  <div class="wg-results-head">
    <h2 class="results-heading" id="results-heading">Words by score</h2>
    <button type="button" class="btn-secondary" id="btn-copy-all">${COPY_ICON} Copy all</button>
  </div>
  <p class="wg-summary" id="summary"></p>
  <div class="wg-scroll" id="word-groups" tabindex="0" role="region" aria-label="Words found, highest score first"></div>
  <p class="wg-after">Scores are for the word alone, before double and triple letter or word squares.</p>
  <p class="visually-hidden" id="announce" aria-live="polite"></p>
</section>

${table}

${PRIVATE_NOTE}`,

  content: `
<h2>How the Scrabble word finder works</h2>
<ol>
  <li>Type the tiles on your rack, from 2 to 7. For a blank tile, type <strong>?</strong> or <strong>_</strong>. You can use up to two, the same as a Scrabble set.</li>
  <li>Tap <strong>Find words</strong>, or press Enter.</li>
  <li>Every word your rack can make is listed with its score, highest first, then A to Z when scores tie.</li>
</ol>
<p>A blank stands for whatever letter the word needs and scores 0, so the page tells you what it's standing for. With <strong>C?T</strong> you'll see CAT (blank = A), COT (blank = O) and CUT (blank = U), each worth 4 points: 3 for the C, 1 for the T, nothing for the blank. Use the length, first-letter and last-letter filters when you need a word to fit a gap on the board.</p>

<h2>How the score is calculated</h2>
<p>Each word's score is the sum of the standard English Scrabble tile values in the table above, with blanks worth 0. QUIZ is Q 10 + U 1 + I 1 + Z 10 = 22 points. CAT and ACT are 5 each, and AT is 2.</p>
<p>Scores are for the word alone. The board isn't part of this tool, so double and triple letter squares, double and triple word squares, the 50-point bonus for using all seven tiles, and points from words you cross aren't added. Words With Friends gives some letters different values, so its scores won't match these.</p>

<h2>Which words it knows</h2>
<p>About {{WORDS}} common English words from SCOWL, a free English word list by Kevin Atkinson, with names, abbreviations, slurs and swear words left out. It isn't the official Scrabble dictionary, so a few Scrabble-only words like QI, ZA and XU won't show up, and once in a while a word it lists might be challenged in a tournament. For a club or tournament game, check the play against the dictionary your game uses.</p>

<h2>Ways to use it</h2>
<ul>
  <li><strong>Finding your best play.</strong> See the highest-scoring words on your rack at a glance.</li>
  <li><strong>Learning the letter values.</strong> Watch how one J, X, Q or Z changes the top of the list.</li>
  <li><strong>Words With Friends.</strong> The words work the same way, though the scores differ.</li>
  <li><strong>Practice after a game.</strong> Put in a rack you were stuck on and see what you missed.</li>
</ul>

<h2>Everything runs in your browser</h2>
<p>The word list is built into the page and the search runs on your device. Nothing you type is sent to a server or saved.</p>
<p class="wg-tm">Scrabble is a trademark of Hasbro in the US and Canada and of Mattel elsewhere. Words With Friends is a trademark of Zynga. Lazy Cat Tools isn't connected to any of them.</p>`,

  faq: [
    ['How do blank tiles work?', 'Type a blank as ? or _, up to two of them. A blank can be any letter and scores 0. Each word shows which letter the blank is standing for, like CATS (blank = S).'],
    ['How is the score calculated?', 'By adding up the standard Scrabble tile values: 1 for A, E, I, O, U, L, N, S, T and R, 2 for D and G, 3 for B, C, M and P, 4 for F, H, V, W and Y, 5 for K, 8 for J and X, and 10 for Q and Z. Blanks are 0.'],
    ['Does it include board bonuses?', 'No. It scores the word by itself. Double and triple letter or word squares, the 50-point bingo bonus and crossing words depend on where you play, and the board isn\'t part of this tool.'],
    ['How many letters can I enter?', 'From 2 to 7 tiles, the size of a Scrabble rack, with up to 2 of them blanks.'],
    ['Is my input uploaded anywhere?', 'No. The word list is built into the page and the search runs in your browser, so nothing you type is sent or saved.'],
  ],
};
