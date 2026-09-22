# Question-language review — 22 September 2026

## Benchmark

The supplied textbook pages are the reference. Their visible prompts use ordinary
questions such as “Where is your bedroom?” and “What is in the bathroom?”, simple
there-is/there-are sentences, everyday vocabulary and picture-based prepositions.
The reading passages contain harder words and longer sentences. That does not
justify adding harder language to the questions themselves.

Use one clear task per question. Ask directly about a person, place, number,
action, reason or order. Keep answer choices short. Reuse the book's words when
possible. A learner should not need to learn an unrelated term to understand the
task. Read each completed blank aloud and check all four choices for other
ordinary meanings that fit. A Thai pop-up is support, not a reason to accept a
needlessly difficult question.

This is an editorial judgment against the supplied material, not a formal CEFR
assessment or confirmation of the teacher's unseen test paper.

## Scope and findings

Reviewed prompts and choices in all 424 questions currently eligible for exam
practice or assessment. The 251 older catalogue questions are excluded from this
exam flow and are not counted as reviewed here.

| Section | Reviewed | Revised in this pass | Finding |
|---|---:|---:|---|
| Vocabulary | 264 | 25 | Removed unnecessary wording such as “four-wheeled”, “no longer awake”, “types of” and hanger/board-game descriptions. Kept the target words. |
| Dialogue | 48 | 3 | Used a concrete list of two things instead of adding the “both … and …” construction to the conjunction task. |
| Grammar | 40 | 0 | Short picture-backed prompts already use “The ball/book/apple/cube is …” or “moves …”. |
| Reading | 72 | 36 | Simplified prompts and choices, split longer questions, removed academic phrasing, and clarified a sequence question's starting point. |
| Total | 424 | 64 | 9 answer strings changed; question IDs and syllabus targets retained. |

Examples:

| Before | After |
|---|---|
| What does “soft” describe? | Which things are soft? |
| Where are the trains compared with the cars? | The cars are on the road. Where are the trains? |
| What do riders do first? | You are on the platform. What do you do first? |
| Do all trains run all day and night? — The text only says some trains. | How many trains run all day and night? — Some trains. |
| Our family travels by road in our four-wheeled _____. | We drive to school in our _____. It has four wheels. |

The full before/after record is [level-review-changes.json](level-review-changes.json).

## What remains deliberately challenging

- Textbook target words and passage words such as suburbs, platform, columns,
  overhead, percent and thousands remain. Questions around them use direct wording.
- Learners still find facts, read not/some/many, compare costs and frequency,
  follow a short order, identify what They/them means, and give simple reasons.
- Source passages retain the supplied text, including its more advanced grammar.
  The app's authored questions should not add a separate academic-language test.
- Supporting everyday words are still needed to write usable questions. Every
  visible/help token is checked for Thai help; availability of help alone is not
  evidence that a question is appropriate.

## Release checks

Preserve all 424 IDs, 64 book vocabulary entries plus two alternative forms, ten
place relations, both source readings, and the 308 practice / 116 assessment split.
Regenerate changed recordings, update server answer keys and Thai explanations,
check word-help coverage, and verify representative replacements in the live app.
The rejected-phrase regression test is a backstop; contextual editorial review is
still required for new questions and choices.
