# Word proficiency and listening fade

## Implemented contract

- Stable IDs are `en:<lowercase word form>`. Punctuation/case normalise; contractions retain apostrophes. Forms such as `is`/`are` and `shoe`/`shoes` have separate scores and shared lemma references where authored.
- One correct sentence answer awards one practice credit per distinct word, including repeated real practice on the same day. This is sentence evidence, not proof of independent word mastery.
- The database grades the selected answer against a versioned catalogue. Clients cannot write aggregates. An attempt UUID is idempotent; real repeats get new UUIDs.
- A correctly rejected ungrammatical sentence records the judgement but never awards positive word credit for incorrect wording. Incorrect answers record attempts without reducing earned credit.
- Student identity comes from auth.uid(), with an additional expected-account guard against account switches during queued requests. Own records and existing authorised administrators can read; students cannot access each other.
- Events retain question/version, selected answer, correctness, original time and server time, replay count, presentation modality and rule version. Aggregates retain attempts, correct sentence credit, direct word credit, audio-only correct, last practice and the last twenty synced outcomes. Recent accuracy refers to sentence outcomes involving that word.
- Scores are separate from self-reported confidence, leaderboard points, grammar mastery and legacy collected-word tiers.

## Engine API

`MatrixSettings` accepts `fadeMode`, `fadeStart`, `fadeEnd`, and `trackWords`. Fade defaults off in shared renderers; tracking is handled independently by the assessment consumer.

`FadingWords` is the sole opacity calculation renderer; `ListeningMatrix`, `CompactMatrix`, and `ExampleView` share it. `SentenceMatrix` forwards settings and scores. Consumers supply `WordScores` keyed by word ID, never embed their own opacity formulas.

Default curve: 0–5 correct = fully visible; 6–24 = linearly fading; 25+ = invisible. This is a configurable starting policy, not a validated mastery threshold. Wrong answers and elapsed time do not restore text. Words retain layout space. Multiword nouns fade token by token. Fade mode suppresses translations, educational popups and word pickers. The listening matrix also fades supporting artwork. No reveal, hover reveal or answer-feedback reveal exists.

Classroom and explorer consumers retain fade off. Authenticated `/english/practice` practice uses fade on and tracking on. Its old hint/reveal path is removed. The existing second pass repeats content; visibility now follows proficiency instead of forcibly hiding unfamiliar words. A question snapshots word scores on mounting so cloud updates do not change its text mid-answer. Attempt modality uses that same snapshot. Punctuation fades with its word. Each question attempts automatic playback on first load, reload, Next and restart. A blocked autoplay request offers a one-tap sound activation button; failures keep a retry button. Old playback is cancelled on question changes and unmount. Replay is unlimited and does not award credit. Answers remain clickable before, during and after playback; blocked or failed audio cannot lock the exercise. Audio errors retain a replay control.

## Persistence and reports

Account-specific local outboxes retain failed requests; online/focus/30-second retries resend the same IDs. Database aggregates refresh after syncing. Pending answers are not displayed as server-confirmed credit. Initial load failure blocks personalised exercises with a retry control rather than silently assuming zero proficiency. If local storage cannot queue an answer it is not accepted and a retry message remains visible.

Student profile and teacher member profile show the new word progress separately from the older word collection. Both fetch authoritative records; updates appear on refresh. These records do not backfill or reinterpret old scores.

## Current boundaries

The initial catalogue contains Lesson 1/2 translations and right/wrong items. The authenticated homework flow records answers. Anonymous live-race nicknames are not linked to user profiles and are not silently treated as student accounts; live-race scoring and other legacy courses remain unchanged. A future consumer must use a reviewed, versioned question catalogue and verified student account before enabling tracking. The RPC supports direct-word evidence, but current seeded questions are sentence-level evidence.

Historical migrations and generated catalogues are versioned. When questions change, increment QUESTION_VERSION and add a new seed migration; never overwrite old question versions. Regenerate with `node --import tsx scripts/seedWordProficiency.ts` only when preparing a new catalogue migration.

## Verification checklist

- [x] Database schema, authentication guard, read isolation and protected aggregates.
- [x] Versioned question catalogue, exact sentence tokenisation, distinct forms.
- [x] Correct credit, repeated practice, idempotent retry, invalid grammar exclusion.
- [x] Account-scoped durable queue, network retry and identity checks.
- [x] Per-word fading, configurable off/on, no reveal, unchanged word spacing.
- [x] Classroom default visibility, homework replay and immediate answer submission.
- [x] Student and teacher word progress panels.
- [x] Focused automated checks and real-database rollback tests (no test scores retained).
- [ ] Production frontend release and signed-in phone acceptance. Database migration being applied is not proof of a complete phone session.

## Validation evidence

- Production build passed; focused suite passed 31 tests, followed by an additional account-score-to-answer integration test (all five homework tests passed).
- Live-database tests ran in a rolled-back transaction: common words received two credits across two different sentences, each noun received one, duplicate delivery added none, malformed-sentence rejection added no positive credit, and account isolation held.
- Browser comparison verified independent opacity with controlled scores and full visibility with fade disabled. Actual local Lesson 2 practice verified answer feedback adds no reveal. A subsequent fix removed the audio-completion answer lock; tests cover immediate submission and failed playback.
- No real learner scores were manufactured for testing. A production signed-in phone session and frontend deployment remain outstanding.
