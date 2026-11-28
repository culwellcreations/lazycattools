export default {
  title: 'Random Number Generator: Free, No Sign-Up | Lazy Cat Tools',
  description: 'Free random number generator. Pick a range and how many numbers you want, with or without repeats. Runs in your browser, nothing uploaded, no sign-up.',
  ogDescription: 'Random numbers in any range, with or without repeats. Free, no sign-up.',
  intro: 'Pick a range, choose how many numbers you want, and generate. Free, no sign-up, and nothing you enter leaves your browser.',
  crosslink: { slug: 'dice-roller', text: 'Rolling for a game instead?' },

  tool: `
<section class="input-section" aria-label="Number settings">
  <div class="controls-row three">
    <div class="field-group">
      <label for="min">Minimum</label>
      <input type="number" id="min" value="1" step="1" inputmode="numeric">
    </div>
    <div class="field-group">
      <label for="max">Maximum</label>
      <input type="number" id="max" value="100" step="1" inputmode="numeric">
    </div>
    <div class="field-group">
      <label for="count">How many</label>
      <input type="number" id="count" value="1" min="1" max="100" step="1" inputmode="numeric">
    </div>
  </div>

  <div class="type-row">
    <div class="field-group">
      <span class="label" id="type-label">Number type</span>
      <div class="segmented" role="group" aria-labelledby="type-label">
        <button type="button" class="seg" id="type-int" aria-pressed="true">Whole numbers</button>
        <button type="button" class="seg" id="type-dec" aria-pressed="false">Decimals</button>
      </div>
    </div>
    <div class="field-group" id="places-field" hidden>
      <label for="places">Decimal places</label>
      <select id="places">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2" selected>2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
      </select>
    </div>
  </div>

  <label class="toggle-label">
    <input type="checkbox" id="repeats" checked>
    <span>Allow repeats <span class="hint">(turn off so no number comes up twice)</span></span>
  </label>

  <p class="form-error" id="form-error" role="alert" hidden></p>
  <button type="button" class="btn-primary" id="btn-generate">Generate</button>
</section>

<section class="results-section" id="results" aria-labelledby="results-heading" hidden>
  <h2 class="results-heading" id="results-heading">Your number</h2>
  <div class="result-box" id="single">
    <p class="result-big" id="single-value"></p>
    <p class="result-sub" id="single-sub"></p>
  </div>
  <ol class="result-list" id="list" hidden></ol>
  <p class="visually-hidden" id="announce" aria-live="polite"></p>
  <div class="action-row">
    <button type="button" class="btn-secondary" id="btn-again">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
      Generate again
    </button>
    <button type="button" class="btn-secondary" id="btn-copy">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      Copy results
    </button>
  </div>
  <div class="history" id="history" hidden>
    <div class="history-head">
      <h2 class="history-title">Last 5</h2>
      <button type="button" class="btn-text" id="btn-clear-history">Clear history</button>
    </div>
    <ol class="history-list" id="history-list"></ol>
  </div>
</section>`,

  content: `
<h2>How to Use the Random Number Generator</h2>
<p>Set the lowest and highest number you want, then how many numbers to make, from 1 to 100. Negative numbers work. Tap <strong>Generate</strong>. Switch to <strong>Decimals</strong> for numbers like 3.14, with up to 6 decimal places. Turn off <strong>Allow repeats</strong> when every number has to be different, like drawing raffle tickets.</p>

<h2>How the numbers are picked</h2>
<p>Every number in your range has the same chance. The numbers come from your browser's secure random number generator (the same one used for encryption), not the predictable kind built into most simple scripts. With repeats off, each number is drawn from what's left, like pulling tickets out of a hat.</p>
<p>It all happens on your device. Your range and results aren't sent anywhere or saved, and they're gone when you close the tab.</p>

<h2>Ways to use it</h2>
<ul>
  <li><strong>Raffles.</strong> Number the tickets, then draw winners with repeats off.</li>
  <li><strong>Picking a page or question.</strong> Set the range to the page count or the number of questions.</li>
  <li><strong>Classroom draws.</strong> Give each student a number and generate one.</li>
  <li><strong>Who goes first.</strong> Everyone guesses a number from 1 to 100; closest wins.</li>
  <li><strong>Lottery-style practice numbers.</strong> Fine for fun, but random picks don't change your odds of winning a real lottery. Nothing does.</li>
</ul>`,

  faq: [
    ['Is it really random?', "Yes. Every number in the range has the same chance, and the numbers come from your browser's secure random number generator, which is built for encryption and isn't predictable."],
    ['Can I generate numbers without repeats?', 'Turn off <strong>Allow repeats</strong>. Each number can then come up only once, so you can ask for up to as many numbers as the range holds. 1 to 10, for example, gives at most 10.'],
    ['What range can I use?', 'Any whole numbers from −1,000,000,000 to 1,000,000,000, as long as the maximum is bigger than the minimum. Both ends are included, so 1 to 100 can give 1 or 100.'],
    ['Can I generate decimals?', 'Yes. Choose <strong>Decimals</strong> and pick 0 to 6 decimal places. With 2 places, 1 to 2 can give anything from 1.00 to 2.00.'],
    ['Is my input uploaded anywhere?', 'No. The numbers are made in your browser. Nothing you type is sent to a server or saved.'],
  ],
};
