// Every randomizer on the site, in homepage order. One source for the
// homepage cards, the "More randomizers" block on each tool page, the
// sitemap and the Tools list in llms.txt.
//
// `built: 'hand'` pages are hand-written HTML; `built: 'gen'` pages are made
// by _build/build-randomizers.mjs from _build/randomizers/<slug>.mjs.

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

export const RANDOMIZERS = [
  {
    slug: 'secret-santa-generator', built: 'hand', priority: '0.9',
    name: 'Secret Santa Generator',
    card: 'Draw names, keep couples apart, and send everyone a private link.',
    llms: 'Draw Secret Santa names for 3 to 100 people. Nobody draws themselves, couples or housemates can be kept apart, and each person gets a private link that shows only their own draw. Runs in the browser; nothing is uploaded or saved.',
    icon: svg('<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>'),
  },
  {
    slug: 'spin-the-wheel', built: 'hand', priority: '0.9',
    name: 'Spin the Wheel',
    card: 'Put names or choices on a wheel and spin for a winner.',
    llms: "A wheel of names. Paste 2 to 100 names or choices, spin, and get a winner picked with the browser's secure random number generator (equal chance per slice; duplicates add slices). Remove winners as you go, load quick lists, go fullscreen for a classroom, and share a wheel by link.",
    icon: svg('<circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/><line x1="18.4" y1="5.6" x2="5.6" y2="18.4"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/>'),
  },
  {
    slug: 'random-number-generator', built: 'gen', priority: '0.8',
    name: 'Random Number Generator',
    card: 'Random numbers in any range, with or without repeats.',
    llms: 'Generate 1 to 100 random numbers between any minimum and maximum, as whole numbers or decimals (0 to 6 places), with or without repeats. Uses crypto.getRandomValues in the browser.',
    icon: svg('<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>'),
  },
  {
    slug: 'random-team-generator', built: 'hand', priority: '0.9',
    name: 'Random Team Generator',
    card: 'Split any group into balanced teams instantly.',
    llms: 'Split any list of names into random, balanced teams. Supports 2–10 teams, uneven group sizes, file upload (.txt/.csv), random team name generation, and shareable result links. Used by teachers, coaches, trivia hosts, and team leads.',
    icon: svg('<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>'),
  },
  {
    slug: 'random-name-picker', built: 'hand', priority: '0.9',
    name: 'Random Name Picker',
    card: 'Draw a random winner from any list of names.',
    llms: 'Pick a random winner or participant from any list of names. Useful for giveaways, classroom callouts, raffle draws, and any situation where you need an impartial pick.',
    icon: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>'),
  },
  {
    slug: 'dice-roller', built: 'gen', priority: '0.8',
    name: 'Dice Roller',
    card: 'Roll d4 to d100 with modifiers, totals and a roll history.',
    llms: 'Roll 1 to 10 dice of one type (d4, d6, d8, d10, d12, d20 or d100) with a modifier from -10 to +10. Shows each die, the sum and a history of the last 20 rolls. Uses crypto.getRandomValues.',
    icon: svg('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'),
  },
  {
    slug: 'giveaway-winner-picker', built: 'gen', priority: '0.8',
    name: 'Giveaway Winner Picker',
    card: 'Pick fair winners and backups from up to 1,000 entries.',
    llms: 'Paste up to 1,000 giveaway entries, remove duplicates, and draw 1 to 10 winners plus up to 5 alternates, all different people, with a timestamped result to screenshot. Uses a Fisher–Yates draw with crypto.getRandomValues.',
    icon: svg('<circle cx="12" cy="8" r="6"/><polyline points="8.2 13 7 22 12 19 17 22 15.8 13"/>'),
  },
  {
    slug: 'random-order-generator', built: 'gen', priority: '0.8',
    name: 'Random Order Generator',
    card: 'Shuffle a list into a random, numbered running order.',
    llms: 'Shuffle a list of 2 to 500 items into a random numbered order. Every item appears exactly once. Uses a Fisher–Yates shuffle with crypto.getRandomValues.',
    icon: svg('<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>'),
  },
  {
    slug: 'coin-flip', built: 'hand', priority: '0.9',
    name: 'Coin Flip',
    card: 'Flip a virtual coin and get heads or tails in one tap.',
    llms: 'Flip a virtual coin and get an instant heads or tails result. Simple 50/50 decision-making tool.',
    icon: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/>'),
  },
  {
    slug: 'yes-or-no', built: 'gen', priority: '0.8',
    name: 'Yes or No Decision Maker',
    card: 'Ask a question, get a random Yes, No or Maybe.',
    llms: 'Get a random Yes, No or Maybe for a question, with adjustable odds (45/45/10 by default). Uses crypto.getRandomValues; the question stays in the browser.',
    icon: svg('<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4"/><line x1="12" y1="17.5" x2="12.01" y2="17.5"/>'),
  },
  {
    slug: 'random-team-name-generator', built: 'gen', priority: '0.8',
    name: 'Random Team Name Generator',
    card: 'Team name ideas for gaming, trivia, sports, work or silly.',
    llms: 'Generate 1 to 10 team names at a time from five themes (Gaming, Trivia, Sports, Work, Silly), each built from in-page word lists. Uses crypto.getRandomValues.',
    icon: svg('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
  },
  {
    slug: 'random-password-generator', built: 'gen', priority: '0.8',
    name: 'Random Password Generator',
    card: 'Strong passwords made in your browser. Never saved or sent.',
    llms: 'Generate a password of 8 to 64 characters from lowercase, uppercase, numbers and symbols, optionally without look-alike characters, with a strength estimate in bits. Made with crypto.getRandomValues in the browser; never saved or sent.',
    icon: svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  },
];

export const toolUrl = (t) => `/tools/${t.slug}/`;
