# Shared quadrant requests

Use `LanguageQuadrant` for assessed sentence documents. Use `SentenceMatrix` for an interactive classroom lesson. Both render through the existing `ExampleView`, `MatrixLayout`, `MatrixCard` and noun-group components. Screens must not recreate role colours, icons or determiner/noun grouping.

```tsx
<LanguageQuadrant scores={progress.scores} request={{
  document: {
    construction: 'action-answer',
    english: 'She is reading her book.',
    thai: 'เธอกำลังอ่านหนังสือของเธอ',
    units: [
      {english:'She', thai:'เธอ', role:'person'},
      {english:'is', thai:'กำลัง', role:'be'},
      {english:'reading', thai:'อ่าน', role:'action'},
      {english:'her', thai:'ของเธอ', role:'determiner'},
      {english:'book.', thai:'หนังสือ', role:'object'},
    ],
  },
  presentation: {
    size: 'phone',
    english: true,
    thaiMeanings: false,
    thaiTranslation: false,
    icons: true,
    fadeMode: true,
    keepIconsWhenFading: true,
  },
}}/>
```

## Presentation contract

- `size`: classroom, phone, compact; layout density/maxWidth can override geometry. Responsive CSS owns wrapping. No forced height that could clip longer sentences.
- `english`, `thaiMeanings`, `thaiTranslation`, `icons`: independent visibility. Legacy `translations` remains a fallback for both Thai layers.
- `fadeMode`, `fadeStart`, `fadeEnd`: shared per-word opacity. Defaults retain visibility through 5 successes and reach zero at 25. Fade mode suppresses Thai answers and reveal controls. Icons require `keepIconsWhenFading`, and `icons:false` always wins.
- `explanations`, `wordPicker`, `explanationSelection`, `audio`: shared interactive lesson controls. A document renderer does not invent education content, choices or audio. The existing lesson engine provides these; practice retains recorded autoplay/replay and answer handling. Word-picker control is separate from the noun/pronoun/name mode selector.
- Scores are loaded by the authenticated app with `useWordProgress` and passed to the engine. Do not accept an arbitrary client learner ID as authorization. Missing scores keep words visible.

## Content and curriculum

Documents require authored contextual Thai meanings, natural full translation, and semantic roles. They are not a dictionary translation or arbitrary text parser. Determiners and nouns must be separate units. Unsupported structure or misalignment throws instead of guessing a layout.

Supported document constructions: noun phrase, location question, present-action question, present-action answer. Existing lesson builders still handle other interactive patterns. Practice levels 1–5 now use this document request, including the full action bank.

For generated practice, `rankQuadrantCandidates` filters validated candidate documents using `vocabularyThroughLesson` and `allowedStructures`, then ranks proximity to `familiarWordShare` from learner scores. Each candidate must carry its highest vocabulary prerequisite from the catalogue. The requested proportion is a ranking target, not a guaranteed composition. Empty results mean no eligible content; do not silently fall back outside the policy. This selector is available for scheduling integration; it does not change the current practice scheduler.

The existing action builders remain responsible for compatible verbs/objects, noun number and agreement. The renderer validates role/layout shape, not linguistic truth. It must receive content from a validated builder or reviewed adapter.

## Integration boundary

LINE and subtitle adapters are not connected by this change. Their translator tokens are not yet this aligned sentence document. Source messages/subtitles must keep their meaning, even when outside a lesson's vocabulary. An adapter must provide validated structure, contextual alignment and audio before using this renderer; unsupported content must be handled explicitly. Cross-product identity/proficiency synchronization and a public authenticated language endpoint remain separate work.
