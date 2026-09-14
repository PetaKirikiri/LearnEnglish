# Content controls practice

`src/learning/contentOrder.ts` is the shared ordering rule for the admin Content table and learner scheduler. It orders target words by supplied-story frequency, then by word, mode and question ID. Do not restore shuffled story selection or forced vocabulary/sentence alternation in the learner stream.

`createPracticeRound` selects the earliest unfinished target block. All ten `the` sentences therefore precede `a`, then `is`, and so on. Within that block, unattempted/least-recently attempted questions are served first, up to ten per pass. A pass can be shorter than ten. Learner practice remains continuous with no completion screen between passes.

Every question needs correct answers in three distinct passes and on three Bangkok dates after its last mistake. A mistake clears that question's successful-pass/date evidence. Later targets stay locked until every question in the current block meets this rule. Earlier mistakes reopen their block. After all content is complete, least-recently practised items continue as revision.

Local learning memory retains this evidence across reloads. Legacy answer counters remain intact but do not establish pass/day mastery. Server events and leaderboard scoring are unchanged; this scheduling evidence is currently device-local, not a claim of cross-device synchronization.

Regression coverage: `contentProgression.test.ts`, `QuizPage.test.tsx`, and `AdminSheets.test.tsx`. Content wording, options, audio, and question IDs must not change as a side effect of scheduling work.
