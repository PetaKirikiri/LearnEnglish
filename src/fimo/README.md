# English FIMO visual study

Route: `/english/fimo-preview`. Isolated, public design specimen; no login,
learner records, score writes, grammar inference or persistence. It does not replace
the course UI. Sentence roles are hand-authored in `examples.ts`.

The non-mascot artwork is copied unchanged from the connectors project at
`website-preview/public/images/clay-icons`, with names from its
`src/components/clay/directClayIconAssets.json` (18 October approved family).
Source masters remain in connectors. The action mascot is English Success's
wolf, adapted with built-in image generation from the approved
`public/brand/englishsuccess-logo.png` in the same matte clay style. The original
logo is unchanged. See `wolf-artwork.md` for the asset prompt and provenance.

The original rounded jigsaw tiles have been restored at the user's request.
The koru/frond experiment has been removed. These lightweight SVG backings are
visual specimens, not Ka Piki's grammar engine or locked rail geometry.
Matching ends do not validate grammar. Pigments distinguish the authored roles;
selecting a word explains its role in this specific sentence.

The extra sidewall, shoulder shading and icon shadows have been reverted.
The page shows one English sentence and two Thai translations, with local-only
answer feedback and manual Next. No header, category navigation or explanatory
labels compete with the choices. Word information appears only when requested.
The 16 prompts loop as a visual demo, not a production lesson scheduler.

The Who/What contrast now uses six word-meaning images rather than category
images. Meaning is assigned per occurrence so location-linking “is” stays
distinct from auxiliary “is”. The other contrasts retain their previous art,
except shared “the” and “court” cues. See `meaning-artwork.md` for the scope,
interpretations and generation prompts.

Question audio reuses the Padel question topic's recordings. Other specimens
are visual-only, without substituting a device voice. No connection to the
database or learner completion state is intended in this test page.

## Padel course integration

The actual `/padel` practice now opts into the clay presentation through
`ListeningCourse.presentation`. Its existing scheduler, learner-specific
progress, audio gating, manual Next and word-help modal remain in use.
The task label, topic selector and completed-topic progress remain visible.
Content tables and Hotel/English practice keep their existing presentation.

`PadelSentenceHelp` renders every word through `WordMeaningTile`. All 296 unique
words now have authored mappings in `wordIconCatalogue.ts`. Concrete concepts
use generated transparent clay images; small words use compact relationship
diagrams, and related word forms use explicit secondary images or cue badges.
These are mnemonic aids, not universal dictionary definitions.

`wordMeaning.ts` uses the words before and after each token to distinguish
location “is” from progressive “is”, possession from perfect “have”, time/place
prepositions, remaining “left”, grip socks, a service box and other course senses.
Existing opacity covers the whole tile, including its image, so visual support
fades with word familiarity. Long words get wider tiles; rows wrap on phones.

`wordIconCoverage.test.ts` checks every occurrence in all 388 questions and every
referenced image file. `PadelSentenceHelp.test.tsx` checks complete rendered
coverage, punctuation and labels. The local-only `word-icon-review.html` shows
the searchable catalogue and contextual variants without changing practice UI.
Artwork subjects are recorded in `icon-artwork.json`, using the shared FIMO
prompt in `meaning-artwork.md`; generation used the built-in image tool, one
transparent asset per subject. The player asset uses a neutral sports figure
holding a perforated padel racket and ball. Existing artwork is preserved.
The app serves 256-pixel transparent copies from `public/images/fimo/thumbs/`;
`node scripts/buildWordIconThumbnails.mjs` rebuilds them on macOS without
overwriting the source images.
