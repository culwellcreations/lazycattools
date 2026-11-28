# Kitchen page builder

Every page under `/kitchen/` is generated. Don't edit those HTML files by hand; your changes would be overwritten.

- **Data:** `kitchen/ingredients.json` holds the ingredients (weights, sources, page text), the families, and the common amounts.
- **Build:** `node _build/build-kitchen.mjs` (run from the repo root). Rewrites the kitchen pages, `sitemap.xml`, and the Kitchen block in `llms.txt`.
- **Test:** `node _build/test-kitchen.mjs` checks the generated charts against the data and known answers (¾ cup butter = 170 g, 1 cup flour = 120 g, and so on).
- **Converter math:** `assets/js/kitchen-converter.js` is shared by the build and the browser, so the charts and the live converter always agree.

## Adding an ingredient

1. Add an entry to `ingredients` with `slug`, `name`, `lower`, `family`, `tier`, `mode` (`cup`, or `spoon` for things measured in teaspoons), `gpc` (grams per US cup), `measured`, `source`, at least 80 words of `body`, and one `faq`.
2. Run the build, then the test.
3. If you changed `assets/css/kitchen.css` or `assets/js/kitchen-converter.js`, bump the `?v=` numbers at the top of `build-kitchen.mjs` so browsers fetch the new file.

# Randomizer pages

`_build/randomizers/list.mjs` lists every randomizer in homepage order. It drives the homepage cards, the "More randomizers" block on every randomizer page, the sitemap entries and the Tools list in `llms.txt`.

- **Generated tools** (`built: 'gen'`): page text, controls and FAQ live in `_build/randomizers/<slug>.mjs`; behavior lives in `tools/<slug>/tool.js` (logic at the top, exported for the tests). Don't edit their `index.html`.
- **Hand-built tools** (`built: 'hand'`): edit their HTML directly, but leave the `randomizers:start/end` block alone.
- **Shared:** `assets/js/rand.js` (all randomness, from `crypto.getRandomValues`) and `assets/css/tool.css`.
- **Build:** `node _build/build-randomizers.mjs`, then `node _build/build-kitchen.mjs` (it writes the sitemap).
- **Test:** `node _build/test-randomizers.mjs`, plus `test-secret-santa.mjs` and `test-spin-the-wheel.mjs`.

## Adding a randomizer

1. Add it to `list.mjs` (slug, name, card text, llms text, icon, priority).
2. For a generated page, add `_build/randomizers/<slug>.mjs` and `tools/<slug>/tool.js` (and `style.css` with `css: true` if it needs one).
3. Run both builds and the tests.

# Kitchen tools, part 2

Air fryer, meat temperature, coffee ratio, rice to water, ingredient substitutions, cup fractions, pressure cooker times and turkey.

- **Pages:** `_build/kitchen-tools-2.mjs` (page text, tables, FAQs). `build-kitchen.mjs` builds them through the same `toolPage()` as the other kitchen tools, and adds them to the hub, sitemap (priority 0.8), `llms.txt` and the homepage Kitchen cards.
- **Math and sourced numbers:** `assets/js/kitchen-tools.js`. Each data block names its source (FoodSafety.gov temperatures, the USDA turkey timetable, the Instant Pot Duo Evo Plus manual, Morton and King Arthur salt weights, Hershey's egg swaps, National Honey Board tips). Change numbers there, not in the HTML.
- **Pressure cooker rows:** `src: 'manual'` rows come from the Instant Pot manual; `src: 'common'` rows are common recipe times and show a † on the page.
- **Test:** `node _build/test-kitchen-tools-2.mjs` after building.
- **Cache:** bump `JS_TOOLS2` in `kitchen-tools-2.mjs` when `kitchen-tools.js` changes, and `CSS_KITCHEN` (now v5) when `kitchen.css` changes.

# Word games

Word Unscrambler, Anagram Solver, Scrabble Word Finder and Word Counter, at `/word-games/<slug>/`.

- **List:** `_build/word-games/list.mjs` drives the homepage Word Games cards, the "More word games" block, the sitemap and `llms.txt`.
- **Pages:** page text, controls and FAQ in `_build/word-games/<slug>.mjs`; behavior in `word-games/<slug>/tool.js`. Don't edit their `index.html`.
- **Word list:** `_build/word-games/scowl-50-us.txt` (SCOWL size 50, US spelling, from app.aspell.net) goes through `_build/word-games/filters.mjs` into `assets/js/wordlist.js`. To drop or keep a word, edit the filters and rebuild. Keep the SCOWL copyright notice in the output; its license requires it.
- **Engine:** `assets/js/word-games.js` (unscramble, anagrams, Scrabble scoring) is shared by the three word-list tools and the tests. The Word Counter's logic is in its own `tool.js`.
- **Build:** `node _build/build-word-games.mjs`, then `node _build/build-kitchen.mjs` (sitemap). Script and style links carry a content hash, so there are no version numbers to bump.
- **Test:** `node _build/test-word-games.mjs`.
