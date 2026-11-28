// Filters that turn the SCOWL list (scowl-50-us.txt) into the site's word list.
// build-word-games.mjs applies them, in this order:
//   1. lowercase a–z only, 2 to 15 letters (drops proper nouns, acronyms,
//      possessives and anything with an apostrophe or accent)
//   2. 2-letter words must be on TWO_LETTER (SCOWL keeps unit abbreviations
//      like "kg" and "ft" in lowercase)
//   3. words with no vowel (a e i o u y) must be on NO_VOWEL
//   4. ABBREVIATIONS, and their plural with -s, are dropped
//   5. offensive words: OFFENSIVE_EXACT as written, OFFENSIVE_PREFIX as the
//      start of any word
// Words with an everyday meaning (cock, ass, tit as birds and animals, prick,
// crap) stay in; slurs and sexual slang go.

export const TWO_LETTER = new Set(`ad ah am an as at aw ax be by do eh em ex fa go ha he hi ho id if in is it
la lo ma me mi mo mu my no nu of oh on or ow ox pa pi re so ti to uh um up us we ye yo`.split(/\s+/));

export const NO_VOWEL = new Set(['nth', 'psst', 'shh', 'brr', 'hmm', 'pst', 'tsk', 'tsks', 'crwth', 'cwm']);

export const ABBREVIATIONS = new Set(`adj adv amt avg dpi doz esp est etc gov hgt hrs hwy inc ind int mfg mfr mpg
mph obj pct pkg rpm rps rte tbs tsp tbsp viz vol vols tel pres approx dept depts govt misc assn asst atty bldg blvd
natl recd resp subj abbr avdp illus wkly cont corp yd yds`.split(/\s+/));

export const OFFENSIVE_EXACT = new Set(`fag fags faggot faggots dick dicks dickhead dickheads coon coons gook gooks
dyke dykes nigga niggas chink chinks gyp gyps gypped gypping squaw squaws midget midgets retard retards retarded
tits titty titties pussy pussies hos boob boobs booby boobies jap japs spic spics kike kikes wop wops`.split(/\s+/));

export const OFFENSIVE_PREFIX = ['fuck', 'shit', 'cunt', 'nigger', 'whore', 'slut', 'porn', 'blowjob', 'handjob',
  'wetback', 'jizz', 'dildo', 'bitch', 'bastard', 'bugger', 'piss', 'twat', 'wank', 'skank', 'tranny', 'raghead'];

export function keep(w) {
  if (!/^[a-z]{2,15}$/.test(w)) return false;
  if (w.length === 2 && !TWO_LETTER.has(w)) return false;
  if (!/[aeiouy]/.test(w) && !NO_VOWEL.has(w)) return false;
  if (ABBREVIATIONS.has(w) || (w.endsWith('s') && ABBREVIATIONS.has(w.slice(0, -1)))) return false;
  if (OFFENSIVE_EXACT.has(w)) return false;
  if (OFFENSIVE_PREFIX.some((p) => w.startsWith(p))) return false;
  return true;
}
