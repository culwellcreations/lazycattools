const DIE = (s, on) => `<button type="button" class="seg" data-sides="${s}" aria-pressed="${on}">d${s}</button>`;

export default {
  title: 'Dice Roller: Free d4 to d100, No Sign-Up | Lazy Cat Tools',
  description: 'Free online dice roller. Roll d4 to d20 and d100 with a modifier, see every die and the total, and keep a roll history. Fair, private, no sign-up.',
  ogDescription: 'Roll d4 to d100 with modifiers, totals and a roll history. Free, no sign-up.',
  intro: 'Pick a die, how many to roll and any modifier, then roll. Free, no sign-up, and nothing leaves your browser.',
  css: true,
  crosslink: { slug: 'random-number-generator', text: 'Need a number from a custom range?' },

  tool: `
<section class="input-section" aria-label="Dice settings">
  <div class="field-group">
    <span class="label" id="die-label">Die</span>
    <div class="segmented dice-types" role="group" aria-labelledby="die-label">
      ${[4, 6, 8, 10, 12, 20, 100].map((s) => DIE(s, s === 20)).join('\n      ')}
    </div>
  </div>

  <div class="controls-row">
    <div class="field-group">
      <label for="count">Number of dice</label>
      <select id="count">
        ${Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}"${i === 0 ? ' selected' : ''}>${i + 1}</option>`).join('')}
      </select>
    </div>
    <div class="field-group">
      <label for="mod">Modifier <span class="hint">(−10 to +10)</span></label>
      <input type="number" id="mod" value="0" min="-10" max="10" step="1" inputmode="numeric">
    </div>
  </div>

  <div class="chips" role="group" aria-label="Common rolls">
    <span class="chips-label">Quick picks:</span>
    <button type="button" class="chip" id="p-d20">Roll a d20</button>
    <button type="button" class="chip" id="p-2d6">Roll 2d6</button>
    <button type="button" class="chip" id="p-3d6">Roll 3d6</button>
    <button type="button" class="chip" id="p-attack">D&amp;D attack roll</button>
  </div>

  <p class="form-error" id="form-error" role="alert" hidden></p>
  <button type="button" class="btn-primary" id="btn-roll">Roll</button>
</section>

<section class="results-section" id="results" aria-labelledby="results-heading" hidden>
  <h2 class="results-heading" id="results-heading">Your roll</h2>
  <div class="result-box roll-box">
    <div class="tray" id="tray"></div>
    <p class="roll-total"><span class="roll-total-label">Total</span> <span class="result-big" id="total"></span></p>
    <p class="result-sub"><span id="roll-label"></span>: <span id="maths"></span></p>
    <p class="crit" id="crit" hidden></p>
  </div>
  <p class="visually-hidden" id="announce" aria-live="polite"></p>
  <div class="history" id="history" hidden>
    <div class="history-head">
      <h3 class="history-title">Last 20 rolls</h3>
      <button type="button" class="btn-text" id="btn-clear-history">Clear history</button>
    </div>
    <ol class="history-list" id="history-list"></ol>
  </div>
</section>`,

  content: `
<h2>How to Use the Dice Roller</h2>
<p>Pick the die (d4, d6, d8, d10, d12, d20 or d100), how many to roll, from 1 to 10, and a modifier if you have one. Tap <strong>Roll</strong>. You'll see every die, the total, and the math behind it, like <strong>4 + 6 + 2 + 3 = 15</strong>. The quick picks fill in the common rolls for you. <strong>D&amp;D attack roll</strong> sets one d20 and puts you in the modifier box so you can type your attack bonus.</p>

<h2>How the dice are rolled</h2>
<p>Each die is rolled on its own, and every face has the same chance: 1 in 20 for each number on a d20, 1 in 6 on a d6. The numbers come from your browser's secure random number generator, not the predictable kind built into most simple scripts. The modifier is added once to the total, not to each die, which is how tabletop games use it. Natural 20s and natural 1s get a label, but they're no more or less likely than any other roll.</p>
<p>Your rolls stay on your device. Nothing is sent anywhere or saved, and the history clears when you close the tab.</p>

<h2>Ways to use it</h2>
<ul>
  <li><strong>D&amp;D and tabletop games.</strong> Attack rolls, damage, saving throws and ability scores (try 3d6).</li>
  <li><strong>Board games with missing dice.</strong> 2d6 covers most of them.</li>
  <li><strong>Classroom probability.</strong> Roll 2d6 twenty times and see why 7 shows up most.</li>
  <li><strong>Deciding turns.</strong> Everyone rolls a d20; highest goes first.</li>
  <li><strong>Solo games.</strong> Random tables, journaling games and percentile rolls with the d100.</li>
</ul>`,

  faq: [
    ['Is it really random?', "Yes. Every face of every die has the same chance, and the rolls come from your browser's secure random number generator, which isn't predictable. Streaks still happen. They happen with real dice too."],
    ['Can I roll more than one die?', 'Yes. Pick 1 to 10 dice. They all have to be the same type in one roll, so for 1d8 + 2d6, roll them separately and add the totals.'],
    ['What does the modifier do?', 'It adds to (or subtracts from) the total once. 3d6 with +2 means roll three dice, add them up, then add 2. The math under the total shows exactly what was added.'],
    ['Can I roll a d100?', 'Yes. The d100 gives a number from 1 to 100, the same as rolling percentile dice.'],
    ['Is anything saved?', "No. Rolls happen in your browser and the history lives only on this page. Close the tab and it's gone."],
  ],
};
