const TOGGLE = (id, label, on, hint = '') => `<label class="toggle-label">
      <input type="checkbox" id="${id}"${on ? ' checked' : ''}>
      <span>${label}${hint ? ` <span class="hint">${hint}</span>` : ''}</span>
    </label>`;

export default {
  title: 'Random Password Generator: Free, Private | Lazy Cat Tools',
  description: "Free random password generator. Make a strong password in your browser with Web Crypto. It's never saved or sent anywhere. No sign-up.",
  ogDescription: 'Strong passwords made in your browser. Never saved or sent. Free, no sign-up.',
  intro: "Pick a length and the characters to use. The password is made on your device and never saved or sent anywhere. That's the whole point.",
  css: true,
  crosslink: { slug: 'random-number-generator', text: 'Need a random PIN or number instead?' },

  tool: `
<section class="results-section pw-out" aria-label="Your password">
  <div class="pw-box" id="pw-box">
    <output class="pw" id="password" aria-label="Generated password"></output>
    <div class="pw-actions">
      <button type="button" class="btn-secondary" id="btn-show" aria-pressed="false">Hide</button>
      <button type="button" class="btn-secondary btn-copy-pw" id="btn-copy">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy
      </button>
    </div>
  </div>
  <div class="meter" id="meter">
    <div class="meter-bar" aria-hidden="true"><span class="meter-fill" id="meter-fill"></span></div>
    <p class="meter-text"><strong id="meter-label"></strong> <span id="meter-note"></span></p>
  </div>
  <p class="pw-warn">Copy it into your password manager. This page doesn't save it, and you can't get it back after you leave.</p>
  <p class="visually-hidden" id="announce" aria-live="polite"></p>
</section>

<section class="input-section" aria-label="Password settings">
  <div class="field-group">
    <div class="label-row">
      <label for="length">Length</label>
      <span class="len-num"><input type="number" id="length-num" value="16" min="8" max="64" step="1" inputmode="numeric" aria-label="Length in characters"> characters</span>
    </div>
    <input type="range" id="length" min="8" max="64" step="1" value="16">
  </div>

  <div class="toggles">
    ${TOGGLE('t-lower', 'Lowercase', true, '(a–z)')}
    ${TOGGLE('t-upper', 'Uppercase', true, '(A–Z)')}
    ${TOGGLE('t-digits', 'Numbers', true, '(0–9)')}
    ${TOGGLE('t-symbols', 'Symbols', true, '(!@#$%^&amp;* …)')}
    ${TOGGLE('t-lookalikes', 'Leave out look-alikes', false, '(l, 1, I, O, 0)')}
  </div>

  <p class="form-error" id="form-error" role="alert" hidden></p>
  <button type="button" class="btn-primary" id="btn-generate">Generate password</button>
  <div class="action-row">
    <button type="button" class="btn-secondary" id="btn-another">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
      Generate another
    </button>
  </div>
</section>`,

  content: `
<h2>How to Use the Password Generator</h2>
<p>A new password is ready when the page opens. Change the length (8 to 64 characters) or the types of characters and it makes a fresh one straight away. Tap <strong>Copy</strong> and paste it into your password manager or the sign-up form. <strong>Hide</strong> covers it with dots if someone's nearby; Copy still copies the real password.</p>

<h2>Private by design</h2>
<p>The password is made on your device with Web Crypto, the browser's built-in secure random number generator (<code>crypto.getRandomValues</code>), never the predictable <code>Math.random</code>. It's never saved, sent to a server or logged. There's no account and no history. Once you leave the page, it's gone, so copy it first.</p>
<p>Each type you turn on appears at least once, so sites that ask for "a number and a symbol" accept it. The symbols are ones most sites allow; quotes, spaces and slashes that forms often reject are left out.</p>

<h2>What the strength number means</h2>
<p>The bits are length × log₂ of how many characters it can choose from. 16 characters with all four types comes to about 103 bits. Each extra bit doubles the number of guesses someone would need, so a 16-character password takes vastly longer to guess than an 8-character one. Under 60 bits is marked Weak, 60 to 89 Good, and 90 or more Strong. It's an estimate, not a promise; no tool can tell you an exact time to crack.</p>

<h2>Ways to use it</h2>
<ul>
  <li><strong>A new account.</strong> One unique password per site, kept in a password manager.</li>
  <li><strong>Wi-Fi.</strong> Turn on <strong>Leave out look-alikes</strong> so guests can type it from a card without mixing up 0 and O.</li>
  <li><strong>A shared family password.</strong> Something nobody will guess but you can still read out loud.</li>
  <li><strong>Replacing a reused password.</strong> If one password guards several accounts, swap each for its own.</li>
</ul>`,

  faq: [
    ['Is it really random?', "Yes. Every character comes from your browser's secure random number generator (Web Crypto), the same kind used for encryption. It's not Math.random, which is predictable."],
    ['Is my password saved anywhere?', "No. It's made on your device and never saved, sent or logged, so copy it before you leave. There's no way to get it back afterwards."],
    ['What length should I use?', '16 characters with all four types is a strong default for most accounts. Go to 20 or more for important ones like email and banking, and use a password manager so you don\'t have to remember them.'],
    ['What are look-alike characters?', 'Characters that are easy to mix up when reading or typing: lowercase l, the number 1, capital I, capital O and zero. Leave them out when someone will type the password by hand.'],
    ['Can I use symbols?', "Yes, they're on by default. A few sites don't accept symbols. If a site rejects the password, turn symbols off and generate another."],
  ],
};
