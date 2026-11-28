// Every word game tool, in homepage order. One source for the homepage cards,
// the "More word games" block on each page, the sitemap and llms.txt.
// Page text lives in _build/word-games/<slug>.mjs; behavior in
// word-games/<slug>/tool.js.

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

export const WORD_GAMES = [
  {
    slug: 'word-unscrambler', priority: '0.8', wordlist: true,
    name: 'Word Unscrambler',
    card: 'Turn jumbled letters into every word you can make.',
    llms: 'Enter 2 to 15 jumbled letters and get every word they make, grouped by length, longest first. Filter by length, first letter, last letter or a letter it must contain. Uses a built-in list of about {{WORDS}} common English words (SCOWL); nothing is sent anywhere.',
    icon: svg('<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>'),
  },
  {
    slug: 'anagram-solver', priority: '0.8', wordlist: true,
    name: 'Anagram Solver',
    card: 'Find every word that uses all of your letters.',
    llms: 'Find anagrams: words that use every letter you enter exactly once (2 to 15 letters). Same built-in word list as the Word Unscrambler; runs in the browser.',
    icon: svg('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
  },
  {
    slug: 'scrabble-word-finder', priority: '0.8', wordlist: true,
    name: 'Scrabble Word Finder',
    card: 'Words from your rack, blanks included, sorted by score.',
    llms: 'Enter a Scrabble rack of 2 to 7 tiles, with up to 2 blanks as ? or _, and get the words it makes sorted by Scrabble score (standard tile values, blanks worth 0, no board bonuses). Uses a common-English word list, not an official Scrabble dictionary.',
    icon: svg('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 16.5l3-9 3 9"/><line x1="10" y1="13.5" x2="14" y2="13.5"/>'),
  },
  {
    slug: 'word-counter', priority: '0.8', wordlist: false,
    name: 'Word Counter',
    card: 'Count words, characters and sentences, with reading time.',
    llms: 'Paste text to count words, characters (with and without spaces), sentences and paragraphs as you type, with reading time (200 words a minute), speaking time (130 words a minute) and the most-used words. The text stays in the browser.',
    icon: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>'),
  },
];

export const wordGameUrl = (t) => `/word-games/${t.slug}/`;
