export default {
  h1: 'Yes or No Decision Maker',
  title: 'Yes or No Decision Maker: Free, No Sign-Up | Lazy Cat Tools',
  description: 'Free yes or no decision maker. Ask a question and get a fair random Yes, No or Maybe, with odds you can change. No sign-up, nothing uploaded.',
  ogDescription: 'Ask a question, get a fair random Yes, No or Maybe. Free, no sign-up.',
  intro: 'Type a question if you like, then let it decide. Free, no sign-up, and your question never leaves your browser.',
  css: true,
  crosslink: { slug: 'coin-flip', text: 'Just need heads or tails?' },

  tool: `
<section class="input-section" aria-label="Your question">
  <div class="field-group">
    <label for="question">Your question <span class="hint">(optional)</span></label>
    <input type="text" id="question" maxlength="140" placeholder="Should we order pizza?" autocomplete="off">
  </div>

  <details class="odds-panel">
    <summary>Change the odds</summary>
    <div class="odds-body">
      <div class="controls-row three">
        <div class="field-group">
          <label for="w-yes">Yes</label>
          <input type="number" id="w-yes" value="45" min="0" max="100" step="1" inputmode="decimal">
        </div>
        <div class="field-group">
          <label for="w-no">No</label>
          <input type="number" id="w-no" value="45" min="0" max="100" step="1" inputmode="decimal">
        </div>
        <div class="field-group">
          <label for="w-maybe">Maybe</label>
          <input type="number" id="w-maybe" value="10" min="0" max="100" step="1" inputmode="decimal">
        </div>
      </div>
      <p class="field-note"><span id="odds" aria-live="polite"></span> Weights don't need to add up to 100. Set Maybe to 0 for a straight yes or no. <button type="button" class="btn-text" id="btn-reset-odds">Back to 45 / 45 / 10</button></p>
    </div>
  </details>

  <p class="form-error" id="form-error" role="alert" hidden></p>
  <button type="button" class="btn-primary" id="btn-decide">Decide</button>
</section>

<section class="results-section" id="results" aria-label="Answer" hidden>
  <div class="result-box answer-box" id="answer-box">
    <p class="asked" id="asked" hidden></p>
    <p class="result-big" id="answer"></p>
    <p class="result-sub" id="answer-line"></p>
  </div>
  <p class="visually-hidden" id="announce" aria-live="polite"></p>
  <div class="action-row">
    <button type="button" class="btn-secondary" id="btn-again">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
      Decide again
    </button>
  </div>
  <div class="history" id="history" hidden>
    <div class="history-head">
      <h2 class="history-title">Last 10</h2>
      <button type="button" class="btn-text" id="btn-clear-history">Clear history</button>
    </div>
    <ol class="history-list" id="history-list"></ol>
  </div>
</section>`,

  content: `
<h2>How to Use the Yes or No Decision Maker</h2>
<p>Type your question, or don't, and tap <strong>Decide</strong>. You get Yes, No or Maybe, with your question shown above the answer so a screenshot makes sense later. <strong>Decide again</strong> asks again, and the last 10 answers are listed underneath.</p>

<h2>The odds</h2>
<p>Out of the box it's 45% Yes, 45% No and 10% Maybe. Open <strong>Change the odds</strong> to set your own. The numbers are shares, not a strict percentage, so 2 / 1 / 0 means Yes comes up twice as often as No and Maybe never does. The page shows the actual chances as you type.</p>
<p>The answer is picked with your browser's secure random number generator, not the predictable kind built into most simple scripts. Your question isn't sent anywhere or saved. It doesn't even affect the answer: the tool doesn't read it, it just shows it back to you.</p>

<h2>Ways to use it</h2>
<ul>
  <li><strong>Dinner.</strong> "Should we get takeout?"</li>
  <li><strong>Friendly arguments.</strong> Agree to abide by it before you ask.</li>
  <li><strong>Movie night.</strong> "Do we watch the long one?"</li>
  <li><strong>Breaking a tie.</strong> When the vote is split down the middle.</li>
  <li><strong>Classroom games.</strong> Quick yes-or-no rounds, with Maybe set to 0.</li>
</ul>`,

  faq: [
    ['Is it really random?', "Yes. The answer is picked with your browser's secure random number generator, using the odds you see on the page: 45% Yes, 45% No and 10% Maybe unless you change them."],
    ['Can I change the odds?', 'Yes. Open <strong>Change the odds</strong> and set a weight from 0 to 100 for each answer. They don\'t have to add up to 100. 50 / 50 / 0 gives a straight yes or no.'],
    ['What does Maybe mean?', "It means the tool isn't going to make this one for you. Ask again, or set Maybe to 0 if you want a firm answer every time."],
    ['Can I ask a question?', "Yes. Type it in and it's shown above the answer, which is handy for screenshots. The question doesn't change the odds."],
    ['Is my question uploaded anywhere?', 'No. Everything stays in your browser. The question isn\'t sent anywhere or saved, and the history clears when you close the tab.'],
  ],
};
