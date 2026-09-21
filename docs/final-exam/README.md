# Chapters 3–4 final-exam preparation

Source: the learner's 15 textbook photos supplied on 21 September 2026. Originals are preserved in `reference-images/`; `sources.json` records the attachment names. Images 1 and 2 duplicate the same vocabulary page. Synced project sources were not modified.

Requested scope: prioritise this material in the existing continuous practice flow. Keep the approved learner UI. No exam menu, new layout, or separate mock-exam screen.

## Textbook coverage

| Area | Pages | Captured / authored practice |
|---|---|---|
| Chapter 3 vocabulary | 34, 36, 38, 40 | 36 entries |
| Chapter 4 vocabulary | 46, 48, 50 | 28 entries |
| House dialogues | 34, 36, 37 | 16 practice questions |
| Prepositions of place | 40–41 | 10 picture-based sentence questions |
| Different Houses | 39 | 11 comprehension questions |
| A Train above You | 51 | 13 comprehension questions |

All 64 vocabulary entries are in `src/content/finalExamVocabulary.ts`. The book's “go to sleep/bed” is one entry, tested with separate “go to bed” and “go to sleep” prompts and distinct meanings. “bicycle / bike” also receives two prompts. The 64 entries therefore produce 66 vocabulary questions.

Page 36 is visibly numbered in photo 10. Other page assignments follow the supplied exam outline and page sequence; their numbers are not visible in these crops. The reading passages match the existing app text. The photos crop the printed comprehension exercises, so the 24 comprehension questions are newly authored practice, not transcriptions of unseen questions. Handwritten listening answers were not used as audio transcripts. The printed “What are these ...? / Those are ...” exchange is not used to teach a near/far contrast without clear visual context.

The place targets are under, behind, in front of, between, beside, above, on, in, over and next to. A visible spatial illustration makes each blank answerable in the existing sentence card. Synonyms beside/next to and overlapping above/over never compete as distractors in the same question. Time phrases appear in vocabulary help, but the grammar section remains place prepositions.

## Practice behaviour

All learners get ten exam-topic questions per round, mixed across vocabulary, dialogue, place grammar and reading. Category shares balance over four consecutive complete rounds, matching ten questions per section. Unrelated general review and rare discoveries are suspended during exam priority. Mistakes take priority, then unlearned and least-recently-seen questions. Existing saved answers remain intact. No exam date was supplied, so this priority stays enabled until explicitly changed.

All new vocabulary exercises show English with four Thai meanings. Sentence and reading questions have four English options. Reading excerpts use the existing context area. New content uses the existing buttons, help modal, audio, feedback, flag and progress tracking. The approved theme and controls are unchanged; place questions add a compact spatial illustration within the existing card.

There are 116 new question IDs with independent server answer keys. Existing word scoring keys are preserved. All 116 exam questions have current Thai explanation records. New word help is stored in the language database; reviewed existing meanings and profiles are preserved. Reading/dialogue responses do not count as mastery of an entire response phrase in the word collection.

## Validation

Content tests cover scope, four unique choices, source excerpts, audio assets, category balance, retained review, mistake repair, eventual coverage and distinct scoring keys. The actual app runs at `/app` in the main repository, with its existing dark-and-gold theme and components. New recordings use the existing Kokoro af_heart neural voice and silent sentence blanks. See [AUDIT.md](AUDIT.md) for the coverage score, limitations and release checks.
