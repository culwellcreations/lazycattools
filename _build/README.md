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
