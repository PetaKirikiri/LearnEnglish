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

The left-hand LINE rich-menu Notes action opens `/english/notes?lesson=2`.
`src/classroom/MobileNotes.tsx` is its phone-only host: a Lesson 1/2/3 selector
and the canonical `SentenceMatrix`. Do not mount the classroom rail, Recall,
practice/game tabs, account header, or legacy word help on this route.
The host changes the four-slot layout to two rows for phone readability while
keeping slots 3 and 4 connected. Word pickers, pronunciation, categories, and
explanations still come from the shared matrix engine and cumulative catalogues.
The teacher surface remains `/classroom/index.html?lesson=…`.
