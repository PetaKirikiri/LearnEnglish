# Shared sentence matrix engine

All four-slot matrix behaviour lives in `src/learning/sentenceMatrix/`. Lesson components choose content and settings; they do not implement the picker, agreement rules, educational window, sentence composition, audio selection, transitions, or focus restoration.

## Embed a teaching matrix

```tsx
import SentenceMatrix from '../learning/sentenceMatrix/SentenceMatrix'
import { classroomMatrices } from './matrixLessons'

<SentenceMatrix
  lesson={classroomMatrices['lesson-2']}
  settings={{
    explanations: true,
    wordPicker: true,
    explanationSelection: true,
    audio: true,
  }}
/>
```

`lesson` supplies its ID, permitted `vocabulary`, whether plural choices are introduced, initial noun/owner, optional recorded-audio resolver, and optional default settings. Instance settings override lesson defaults. All feature switches default to enabled.

- `explanations`: whether clicking a card opens its educational window.
- `wordPicker`: whether dropdown controls and the inline vocabulary carousel are available.
- `explanationSelection`: whether words can also be changed inside the educational window. Set false along with `wordPicker:false` to lock selection while still allowing explanations.
- `audio`: whether the sentence playback button is present.
- `lesson.vocabulary`: the actual allowed word records, not a global list hidden with CSS. Both selection surfaces and is/are counterpart changes use this list. A counterpart outside the lesson is disabled. Pair-only nouns cannot switch to is.

Optional `word` / `onWord` support a parent retaining the chosen noun between lesson screens. Without them, the engine owns selection. Changes to lesson vocabulary or settings reset open controls and prevent stale selections. Each instance has independent state and unique educational-window IDs.

## Engine responsibilities

- `model.ts`: noun/verb agreement, determiner meanings, English/aligned Thai/natural Thai composition, configuration types.
- `selection.ts`: shared word-choice and active-picker state. Choices are tracked by word rather than a potentially stale array index.
- `useLocationMatrix.ts`: applies lesson boundaries and singular/plural counterpart rules to that state.
- `MatrixCard.tsx` + `SentenceSlot`: the sole matrix-card shell and role/number visuals.
- `ExampleView.tsx`: aligned authored examples and the established grouped noun layout.
- `SentenceMatrix.tsx`: teaching interactions, carousel, educational expansion, transitions, audio and focus.
- `CompactMatrix.tsx`: existing compact practice presentation, using the same card shell and selection engine.
- `MatrixExplanation.tsx`: educational window; selection callbacks are validated by the engine.
- `PatternComparison`, `HolidayExplorer`, `PluralExplorer`: shared activities, not lesson-local matrix implementations.

Static authored examples remain read-only. Compact assessments disable editing and hide Thai/help; supplied test words are preserved exactly, including intentional mistakes. Do not use the teaching composer's agreement correction to rewrite assessment prompts.

## Audit inventory

| Former implementation / consumer | Result |
| --- | --- |
| `classroom/SentenceLine.tsx` | Compatibility export of `SentenceMatrix`; no lesson-specific implementation |
| `classroom/WordExplanation.tsx`, `WordSlotIcon.tsx`, `wordReference.ts` | Compatibility exports of engine modules |
| `classroom/lesson.tsx` recall, idea, example, review and Lesson 2 | Configuration + presentation only; review now uses a working selection callback |
| `classroom/lesson.tsx` missing-word comparison | Shared `PatternComparison` activity |
| `learning/SentenceSlotBuilder.tsx`, `sentenceSlotEngine.ts` | Compatibility exports of the compact view and shared selection controller |
| `race/TonightSlots.tsx` and `PhonePractice.tsx` | Compact engine with existing assessment mode; race question logic remains separate |
| `learning/ExampleLanguage.tsx` | Compatibility export of `ExampleView`; non-matrix layouts retained |
| `race/RaceWalkthrough.tsx`, `RaceLessonNodeViews.tsx` | Authored data rendered through shared `ExampleLanguage matrix` |
| `race/RaceLessonExamples.tsx`, `PluralWordExplorer.tsx` | Compatibility exports of shared explorer activities; composition uses `locationSentence` |
| `classroom/lessonTwoContent.ts` / race question generation | Uses the same location-sentence composer; existing questions and answers preserved |
| `portal/ClassOneMaterial.tsx`, `curriculum/BirdObservationPage.tsx` | Non-matrix ExampleLanguage consumers; existing aligned-text presentation retained |

The existing CSS is retained to preserve the approved classroom and compact practice appearances. No second preview application was introduced.

## Verification

`SentenceMatrix.test.tsx` covers independent feature switches, restricted vocabulary in both selection surfaces, unavailable singular counterparts, switching lessons, independent instances, recorded audio selection, and unchanged incorrect assessment prompts. Existing classroom blueprint, compact practice, lesson content and document tests cover the consuming routes. `engineBoundary.test.ts` prevents matrix markup and interaction implementations from returning to lesson components.

## Required education sections

Every `MatrixExplanation` includes the same visible pronunciation section for every slot and word, including unknown words with no saved pronunciation data. Missing data changes the graph to editable unset points; it never removes the section. Keep it compact and open beneath the usage details. This applies wherever the shared education engine is embedded, independently of selection controls. Tests exercise all current lesson nouns, all four slot types and an unknown word.

## Education layout

`MatrixExplanation` uses a single word identity header, followed by How it works, Pronunciation, and Vocabulary (or Choose a word). Nouns use their actual `VocabularyPicture` in the header, not the grammatical apple symbol. Category is a small header label. Avoid repeated word titles or a second oversized category introduction. Number agreement uses `WordUsageVisual`: actual one/many noun artwork, authored singular/plural forms with changed letters highlighted, and a clear connection to is/are. Pair-only words show one pair with are; words without authored counterparts do not invent a plural. Other teaching facts use stacked labelled rows. All section titles use `EducationSectionHeading` for the same icon size, typography, spacing and action alignment. The one/many apple switch belongs in the Vocabulary heading, inside the same section as its list.

## Vocabulary category filters

The education vocabulary shelf combines category and singular/plural filters without changing the explained word. Categories come from `vocabularyCategories.ts`; `ClassroomWord.categories` can explicitly tag new content and supports multiple memberships. Known singular/plural forms share categories through their singular base. Only categories represented in the supplied lesson catalogue appear. Category buttons remain readable and enabled. Selecting a category switches the number filter when necessary to show its available words; tapping the selected category again clears it to All. Changing number resets to All if needed to avoid an empty list. Unknown words remain accessible under All. Add new food or other category vocabulary through authored tags rather than displaying empty categories.

## Cumulative lesson vocabulary

Teaching catalogues include every word introduced through the selected lesson. `lessonOneCatalogue` contains Lesson 1 words; `lessonTwoIntroducedCatalogue` records only new Lesson 2 forms; `lessonTwoCatalogue` merges both with `cumulativeCatalogue`. Later records enrich existing words without duplicates or mutation of earlier lessons. Future lessons must merge only stages reached so far. Both the inline picker and education vocabulary filters consume this cumulative catalogue. Categories therefore expand with the words available, while the compact icon controls stay beside the apple switch. Do not invent plural counterparts for earlier words. Lesson 2 reuses Lesson 1 recordings for carried-over nouns and its own recordings for newly authored forms.

## Student Notes in LINE

The left-hand LINE rich-menu Notes action uses the shared LIFF entry with `?lesson=2&view=notes`. Both that destination and `/english/notes?lesson=2` pass through `HomeworkEntry` account recognition and class enrolment before rendering the notes. All three menu buttons enrol the learner on entry; no answer is required. Local development retains its existing preview bypass.
`src/classroom/MobileNotes.tsx` is its phone-only host: a Lesson 1/2/3 selector
and the canonical `SentenceMatrix`. Do not mount the classroom rail, Recall,
practice/game tabs, account header, or legacy word help on this route.
The host changes the four-slot layout to two rows for phone readability while
keeping slots 3 and 4 connected. Word pickers, pronunciation, categories, and
explanations still come from the shared matrix engine and cumulative catalogues.
The teacher surface remains `/classroom/index.html?lesson=…`.

## People and location patterns

Set `lesson.pattern: 'people-location'` for the shared Ask / Answer carousel. `PeopleLocationMatrix` composes the existing `ExampleView`, `MatrixCard`, `WordTray`, education headings and pronunciation component. `peopleLocation.ts` owns person agreement, reciprocal I/you replies, destination filtering and recording keys. `ExampleView.semanticSlots` separates semantic colour from sentence position, and `groupLabel` names the grouped subject. Never use a slot colour's old CSS grid column to reorder a new pattern.

## Configurable subject modes

`MatrixLesson.subjectModes` enables the three-way selector above the yellow noun block on any shared `SentenceMatrix`, without requiring the Lesson 3 carousel. Omit it for earlier lessons. The configuration owns allowed pronouns, proper names, initial selections, and optional recorded audio resolution. Empty catalogues hide their mode.

`subjectEngine.ts` owns available modes, allowed-word resolution, person/number agreement and aligned question composition. `subjectVerb` also supplies agreement to the existing people/location pattern. UI components must not maintain their own proper-name lists or verb mappings. A subject declares grammatical `person` and `number`; third-person singular is the default. Names are authored exactly as taught, including any articles that genuinely belong to a name.

`NounModeToggle` and `SubjectQuestionMatrix` are shared engine views. They reuse `ExampleView`, `MatrixCard`, `WordTray`, education headings and `PronunciationComparison`. `ExampleView.groupSize` supports the two-piece determiner/noun group or a single pronoun/name within the same yellow unit. Selecting a mode does not change the retained determiner/noun selection.

Engine and component tests exercise a separate custom lesson using Maya, we and it; they verify agreement, unavailable modes, scope boundaries and restoration of the original noun phrase.


### Layout requests (one geometry owner)

`ExampleLanguage` accepts `layout={{ construction: 'question', noun: 'phrase', nounSwapper }}`.
`MatrixLayout` supplies the centered composition: control row, leading slots, yellow noun group, translation/audio, and selection dock. The other requests are `noun: 'single'` for pronouns/names and `construction: 'location-answer'` for I / am / at / [the / hotel]. Callers provide content and behavior, never per-mode x/y offsets or card heights.

Optional `MatrixSettings.layout` accepts `density: 'comfortable' | 'compact'` and `maxWidth` in pixels. `matrixLayout.css` owns responsive geometry and keeps the same leading/group allocation, card heights, art/word/gloss rows, selector anchors, and translation/dock coordinates across modes. The phone arrangement is driven by available container width, rather than the route name. `MatrixPicker` supplies the same dropdown control for every variable slot. Keep lesson, subject-mode and word-tray styles free of sentence geometry overrides.

`nounSwapper` and `subjectSwapper` are optional layout-request settings containing `{mode, modes, onChange, label}`. The engine renders the shared toggle above the corresponding yellow block; callers no longer supply arbitrary control markup. Lesson 3 enables both on the answer slide. Name catalogue entries identify `kind: person | place`, so the destination selector cannot produce “at Bia” or “at you”.

The noun swapper always shows the same three positions. Its request `modes` enables interactions; other modes remain visible as ghosted native-disabled buttons. Lessons without subject-mode content request only `noun`. Fade/listening mode continues to hide the entire swapper.

## Construction invariant: reuse the noun block

Every construction requests `SentenceMatrix` with its cumulative `lesson.vocabulary`.
Lesson hosts must never assemble `MatrixCard`, `MatrixLayout`, `MatrixPicker`,
`NounGroup`, or `WordTray` themselves. `engineBoundary.test.ts` enforces this boundary
and the single markup owner for noun groups, dropdowns and vocabulary trays.

`NounGroup` is the same joined yellow determiner/noun shell in Lessons 1, 2 and 3.
`nounPhraseUnits` requires the determiner, noun and optional preposition as separate
fields; it rejects an article bundled into the noun. Compound nouns such as
`air conditioner` remain intact. Action noun teaching opens `MatrixExplanation`,
the canonical education view, and uses `WordTray.vocabulary` for the existing
number and topic filters. Do not add a construction-specific replacement.

Present-action objects come from `objectsForAction(verb, lesson.vocabulary)`.
The cumulative catalogue is the source; semantic compatibility narrows it:
food for eating, drinkable nouns for drinking, reading materials for reading,
and places/destinations for going. Authored `meaning.actionContexts` overrides
broad browsing categories (water is under Food but is drinkable, not edible).
All compatible singular and plural forms already taught remain available.
Standalone verbs such as sleeping never acquire an object. New words are added
once to the cumulative catalogue with their meaning, number metadata and art;
never add a private lesson picker list.


## Lesson requests and language capabilities

`src/learning/lessonRegistry.ts` owns the numbered Lesson 1–4 configurations,
ordered race stages, cumulative matrix vocabularies, subject catalogues,
determiners, allowed actions and initial presentation. `classroom/matrixLessons.ts`
is a compatibility export. Course lesson numbers are not practice-level numbers:
the existing university journey and its Level 1–6 progress remain independent.

`lessonRequests.ts` is the shared URL/LINE parser. An absent lesson means the
established entry; an explicit unsupported value is an error. Public classroom,
notes and homework hosts display the request error instead of substituting Lesson 1.
Old named lesson aliases adapt to numbered requests through `notesRoute.ts`.

For action language use `actionCapabilities(lesson)` for scoped choices and
`composeLessonAction(lesson, request)` for a validated same-subject sentence.
All person/agreement facts come from `subjectEngine`; `actionSubjects` derives
its legacy reciprocal replies from that source, preserving existing recordings.
`ActionMatrix` uses those capabilities for inline and education choices.
An explicitly empty pronoun catalogue disables pronouns; it does not expose a
global replacement list. Authored noun/name modes remain available.

`race/lessonPractice.ts` adapts existing banks without changing question IDs or
recording paths. Lessons 1–2 retain their original recorded projections. Lesson 3
uses its recorded location answers. Lesson 4 validates existing recorded action
answers against the configured actions, subjects, objects and determiners before
making them available to modules, decks and the classroom race pool. The registry preserves the adaptive foundation journey for Lesson 1–2 links and
selects recorded lesson packs for Lesson 3–4. The unnumbered university journey
is retained. Its ordered foundation noun lists now resolve meanings and forms
from the same catalogue instead of copying Thai records.
No migration or progress-key reset is part of this consolidation.

Structured assessment documents go through `ListeningMatrix` → `LanguageQuadrant`.
They preserve role-separated noun groups instead of splitting an action or location
answer into four positional words. Both Thai layers and interactive help remain
hidden for unanswered assessments. This transport validates geometry and alignment;
it does not prove the grammatical correctness of arbitrary supplied documents.

Classroom catalogues are authored curriculum data. They are separate from the
database gloss/profile snapshots used by legacy reading help; this change does not
claim that a database gloss edit automatically rewrites authored lesson meanings.
The intentional recorded-race and expanded-matrix vocabulary projections remain.

`lessonParity.test.tsx` checks all supported routes/LINE requests, registry/facade
identity, race stages, module/deck banks, exact recording manifest text, Lesson 4
composition and actual inline/education interactions, and hidden Thai in assessment.
Run it with the engine boundary, construction and consuming-route tests.


## Lesson 4 action stars

The Lesson 4 `practiceMode: action-stars` request and the next university journey
level both open `ActionStarCourse`. Existing Levels 1–5 and their progress keys
remain intact. `actionStarContent.ts` enumerates the action blueprint through
`actionCapabilities` and `composeLessonAction`, then joins exact existing recorded
sentences. It selects three disjoint 50-question sets and retains source question
IDs, choices, audio paths and a request-level provenance record. There are no
invented recordings or hand-authored replacement sentences.

One star consolidates eating, reading and drinking. Two stars introduce holding,
opening and washing in separate stages and return to familiar content. Three
stars mix all six actions. Each tier covers I/you/he/she/we/they and
my/your/his/her/our/their. Later stars require two complete unassisted results of
at least 45/50. New-verb stages also require repeated correct audio-only answers
before the next new verb. Teaching examples are separate recorded sentences,
never the next assessed sentence. Both Thai layers, English and icons are hidden
until an assessment is answered; audio must finish before an answer is enabled.
Answer positions are balanced 25/25 and survive a reload through a saved run seed.

`lessonPractice.ts`, classroom race pools and the star course use the same selected
150 records. Existing recorded vocabulary projections remain intentional: all
compatible words may be taught by the matrix, while the assessed sets select
recorded combinations. `practiceStage.css` owns its two host regions only;
content-sized quadrant geometry belongs to `matrixLayout.css`.

Run `node --import tsx scripts/auditActionStars.ts` followed by
`python3 scripts/auditActionStarAudio.py`. The reports retain all 150 English/Thai
rows, request provenance, recording paths, contrast checks and decoded PCM metrics,
plus three separate teaching examples. PCM decoding is signal-integrity evidence,
not a pronunciation certification. The phrase “there’s 30” remains unassigned
pending clarification; these tiers contain the explicitly requested 50 questions.
