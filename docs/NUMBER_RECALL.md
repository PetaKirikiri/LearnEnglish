# Number practice: vocabulary and recall

The production practice flow uses `numberCatalogue.ts`, `numberRecall.ts` and `numberRecallStore.ts`. Fixed `numberDeck` lists are retained only for deterministic design previews and legacy-session compatibility.

- All 100 authored forms from the cumulative Lesson 1–3 matrix catalogue are available. Each keeps its earliest lesson assignment; later lessons enrich existing entries rather than changing that priority.
- Validate each form against the `where-noun` sentence blueprint. Abstract or incompatible words do not enter this bank. New content must supply all three audio recordings (noun phrase, matching sentence and mismatched sentence), existing classroom artwork and authored number forms before release.
- Number listening rounds omit plural-only pair nouns such as trousers: one pair is not several things. Those remain eligible for verb agreement practice.
- New words are ordered by first lesson assignment. Due reviews normally get three opportunities for each new-word opportunity; use whichever queue is available. Unseen words cannot be repeated as unseen in the same session.
- Keep 30-question rounds and a randomized balance of 15 singular / 15 plural prompts. A wrong or supported item returns only after at least three intervening prompts. Never force a not-yet-due item just to fill a round; finish a shorter review if nothing eligible remains. Only a full 30-question round can earn the existing module-pass milestone.
- Recalculate the next prompt after every answer. A pre-generated queue must not delay a newly identified weakness until another session.

## What is measured

Track attempts separately for each word form and each skill: (1) noun-phrase number recognition, (2) full-sentence number recognition, (3) judgement of is/are agreement in a complete sentence. Correct recognition of `hotel` does not imply knowledge of `hotels`, sentence listening, or that the learner can translate hotel. Do not convert these results into blanket vocabulary mastery.

Each immutable attempt records correct/wrong, answer, time, support at presentation, heard audio, playback count and pre-answer help use. Server-side validation derives correctness from the catalogue. Retries use the same attempt ID. Account-scoped local history and an upload outbox retain offline attempts; authenticated server history restores them across devices. Guest history stays local.

Two consecutive independent successes at the current support level advance text fade through 100%, 67%, 33%, 0%. Sentence pictures and slot icons stay visible at every fade level (`keepIconsWhenFading`); only written cues are removed. Wrong answers restore one support step and reset the recall interval. Help, extra playback, silent development answers or an easier stale prompt do not advance fading or intervals. The full pattern is restored after answering so the learner can review it; this does not change the support recorded for that attempt.

First independent success: repeat later in this session. Subsequent independent successes: due after 1, 3, 7, 21, then 60 days. Wrong/assisted attempts reset the interval and become eligible after the intervening-question gap. These are transparent initial product rules, not scientifically calibrated mastery estimates.

## Release checks

- `npx vitest run src/race/numberRecall.test.ts src/race/numberRecallStore.test.ts src/race/numberFoundation.test.tsx src/race/PracticePatternExplanation.test.tsx src/race/PhonePracticePlacement.test.tsx`
- `node --import tsx scripts/generateNumberFoundationAudio.ts` regenerates the 300 local neural recordings with the existing voice; no paid API.
- The account DB requires `20261030000100_number_recall.sql` and `20261030000200_number_recall_catalogue.sql` (shared accounts, not the language content database). No existing learner scores are reset or inferred as recall evidence.

Level 3 presents complete sentences with either matching or deliberately mismatched is/are. Correct and wrong sentences are balanced 15/15 independently of singular/plural nouns. Answer 0 is correct, answer 1 is wrong. Store the presented verb; the server derives the expected judgement. Legacy blank-verb attempts are retained but do not advance this new skill. Apply `20261030000300_number_judgement.sql` before releasing this client.
