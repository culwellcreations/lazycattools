import { COPY_ICON } from './word-unscrambler.mjs';

const stat = (id, label, cls = '') => `    <div class="wc-stat"><dt>${label}</dt><dd id="${id}"${cls ? ` class="${cls}"` : ''}>0</dd></div>`;

export default {
  title: 'Word Counter | Count Words & Characters, Free | Lazy Cat Tools',
  description: 'Free word counter. Paste text and count words, characters, sentences and paragraphs, with reading time. No sign-up.',
  ogDescription: 'Count words, characters, sentences and paragraphs as you type, with reading time. Free, no sign-up.',
  intro: 'Paste or type your text and watch the words, characters, sentences and reading time update as you go. Free forever, no sign-up, and your text never leaves your browser.',

  tool: `
<section class="input-section" aria-label="Text to count">
  <div class="field-group">
    <div class="label-row">
      <label for="text">Your text</label>
      <button type="button" class="btn-text" id="btn-clear">Clear</button>
    </div>
    <textarea id="text" class="wc-text" rows="9" aria-describedby="wc-note">Paste or type your text here and the counts below will update as you type.</textarea>
  </div>
</section>

<section class="results-section" aria-labelledby="counts-heading">
  <div class="wg-results-head">
    <h2 class="results-heading" id="counts-heading">Counts</h2>
    <button type="button" class="btn-secondary" id="btn-copy">${COPY_ICON} Copy counts</button>
  </div>
  <dl class="wc-grid">
${stat('c-words', 'Words')}
${stat('c-chars', 'Characters')}
${stat('c-nospace', 'Characters without spaces')}
${stat('c-sentences', 'Sentences (approx.)')}
${stat('c-paragraphs', 'Paragraphs')}
${stat('c-per', 'Words per sentence (approx.)')}
${stat('c-read', 'Reading time', 'wc-time')}
${stat('c-speak', 'Speaking time', 'wc-time')}
  </dl>
  <div class="wc-top">
    <h2 id="top-heading">Most used words</h2>
    <ol id="top-words" aria-labelledby="top-heading"></ol>
    <p class="field-note">Leaves out common words like the, and, of, to, it and you.</p>
  </div>
  <p class="visually-hidden" id="announce" aria-live="polite"></p>
</section>

<p class="field-note" id="wc-note">Your text stays in your browser. Nothing is sent anywhere or saved.</p>`,

  content: `
<h2>How the word counter works</h2>
<p>Type or paste into the box and every count updates as you go. There's no button to press. <strong>Clear</strong> empties the box and sets everything back to 0, and <strong>Copy counts</strong> copies the numbers as plain text.</p>
<ul>
  <li><strong>Words.</strong> Anything between spaces or line breaks that has at least one letter or number in it. Punctuation attached to a word doesn't make a new one, so "don't", "well-known" and "3.5" each count once, and a dash on its own doesn't count at all.</li>
  <li><strong>Characters.</strong> Every letter, number, punctuation mark, space and line break. The second count leaves out spaces and line breaks.</li>
  <li><strong>Sentences.</strong> Runs of text ending in a period, question mark or exclamation point. Common abbreviations like Mr., Dr. and e.g. don't end a sentence, but no counter gets every case right, so treat this one as close rather than exact.</li>
  <li><strong>Paragraphs.</strong> Blocks of text separated by a blank line.</li>
  <li><strong>Reading and speaking time.</strong> Words divided by 200 a minute for reading and 130 a minute for speaking out loud, rounded to the nearest minute.</li>
  <li><strong>Most used words.</strong> The five words you used most, leaving out the glue words (the, a, an, and, or, of, to, in, is, it, I, you, that, for, on, with, as, at, be, was, are, this, but, by). Handy for spotting a word you lean on too much.</li>
</ul>

<h2>Ways to use it</h2>
<ul>
  <li><strong>Essays and assignments.</strong> Check you're inside the word limit before you hand it in.</li>
  <li><strong>Social media and bios.</strong> Character limits for posts, profiles and meta descriptions.</li>
  <li><strong>Speeches and toasts.</strong> The speaking time tells you roughly how long it will run out loud.</li>
  <li><strong>Editing.</strong> Long sentences and an overused word both show up in the numbers.</li>
</ul>

<h2>Everything runs in your browser</h2>
<p>The counting happens on your device as you type. Your text isn't uploaded, saved or sent anywhere, and it's gone when you close the tab.</p>`,

  faq: [
    ['How are words counted?', 'A word is anything between spaces or line breaks that contains at least one letter or number. Punctuation stuck to a word doesn\'t split it, so "don\'t" and "well-known" each count as one word.'],
    ['What is the reading time based on?', '200 words a minute, a common average for adults reading for meaning. Your own speed may be faster or slower.'],
    ['What is the speaking time based on?', '130 words a minute, a steady pace for a speech or presentation.'],
    ['Is my text uploaded anywhere?', 'No. It stays in your browser. Nothing is sent to a server or saved, and it\'s gone when you close the tab.'],
    ['Is there a limit?', 'No set limit. It handles 10,000 words and more while you type, so a full essay or chapter is fine.'],
  ],
};
