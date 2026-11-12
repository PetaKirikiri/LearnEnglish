# Shared sentence audio

Practice keeps its existing sentence boxes and pictures. GeneratedPractice uses account-wide word evidence for the next question; action practice delegates to it. Existing recordings have first priority. Missing recordings are prepared in the background, shared across accounts, and fall back to a local English speechSynthesis voice without waiting for ElevenLabs.

## Server configuration

Configure these as server-only environment variables in Vercel and, for local use, the ignored `.env.local` file:

- `ELEVENLABS_API_KEY`: a current speech-generation key. Never prefix with `VITE_`, put in source, or send to the phone.
- `ELEVENLABS_VOICE_ID`: the chosen English voice ID.
- `ELEVENLABS_MODEL_ID`: optional; default `eleven_multilingual_v2`.
- `SUPABASE_SERVICE_ROLE_KEY`: existing app database service credential (`CITY_SUPABASE_SERVICE_KEY` also accepted).
- `VITE_SUPABASE_URL`: existing app database URL.

The old one-day Māori test key is not a production credential. Add a current key securely; do not paste it in chat. `vite` loads local secrets only into its server middleware. Vite exposes only its usual `VITE_` variables to client code.

Apply `supabase/migrations/20261111010000_sentence_audio.sql`. The public `sentence-audio` bucket contains only authored lesson audio. The cache, spending counters and provider cooldown are service-role-only. `node scripts/buildRaceServer.mjs` bundles `api/sentence-audio.js`; the route has a 60-second Vercel timeout.

## Selection and forecast

`nextPersonalQuestion` uses the same vocabulary eligibility and evidence across Levels 1–6. Each actual answer selects the next question using updated evidence. `forecastPractice` makes a temporary evidence copy and simulates ten correct, unassisted answers, including the actual fading/listening requirements. These hypothetical answers never enter storage or earn XP. The forecast includes the current sentence plus ten upcoming sentences. All lesson routes use this forecast, including identification. Lessons provide only construction constraints through `lessonPracticeTemplate`; none can supply a question array or deck callback.

Forecast work is deferred until after rendering and replenished on question/evidence changes. A batch contains the current sentence, ten forecast answers, and up to one queued replacement scenario per word type, deduplicated and capped at 16 sentences. Two generation requests can run at once per browser; server leases deduplicate globally. The construction catalogue defines valid combinations for validation and rendering; account evidence selects the actual questions. The old identification v1 catalogue remains solely to resolve already-issued classroom turns. It is not a source for new individual practice rounds.

## Cache and failure behaviour

The server accepts a question ID from the shared authored/generated catalogue, not client-supplied arbitrary text. It authenticates the learner, resolves the sentence server-side, and hashes exact normalized text, punctuation, voice, model, language, output format and voice settings. Account ID is not part of that identity.

A database row lock gives one worker a two-minute lease. Ready audio is reused across users. A worker checks storage before generation to recover an already-uploaded file. Generation times out after 40 seconds. Failed requests back off for 15 minutes; quota/auth/rate failures pause generation for one hour. Three failed/abandoned attempts stop automatic retries for that sentence until an operator reviews it. A per-account cap of 100 new generation claims per UTC date limits speculative spending; cache hits are not charged against it.

A provider success followed by a network/process failure before upload can still incur a duplicate provider charge on retry: ElevenLabs generation and our storage upload are not one atomic transaction. Leases and storage recovery reduce that risk but cannot promise exactly-once billing.

Playback never calls ElevenLabs. It plays a known recording/shared-cache URL or immediately requests a local English voice. Missing local voices or browser autoplay restrictions show the existing replay control. Listening credit is granted only after playback ends. Actual iPhone voice availability, sound quality and offline playback still require a device check.

## Verification

Tests cover forecast/live selection parity, no simulated progress writes, cross-level vocabulary eligibility, 30-answer practice rounds, exact resume, cache identity, auth rejection, duplicate jobs, quota fallback, recording preference and local-only speech. Database checks run inside rollback transactions and verify locking ownership, shared hits and RPC permissions.

## Ordered word hierarchies

`wordHierarchy.ts` owns five ordered tracks: nouns, verbs, adjectives, pronouns and determiners. Nouns have two Current subjects and two Current objects, each with a separate Next replacement. Verbs have three Current transitive and three Current intransitive uses, with independent replacement queues. Other tracks have four Current unfinished words and one Next queued replacement. Current words rotate; any learnt slot refills from the hierarchy. Historic exposure to a later word does not move that frontier or admit the later word into the current question. Existing independent listening mastery remains the completion criterion; visible correct counts still control fading, not curriculum position.

Question selection rotates across compatible track frontiers before applying variety or recency. Correct sentences use the completed prefix and current word. The immediate following item can appear as a contrasting alternative, but cannot become the credited target early. If a construction cannot express the current word, shared noun prerequisite practice is used instead of skipping ahead to a food/object that happens to fit. Thirty answers may revisit the current word; thirty distinct sentences is no longer a reason to introduce later vocabulary. Round 6 stars do not supply verb lists. The review page shows all five lists from the same source.

Saved sets use v16 so an old banana question cannot resume under the new policy. Answer history and earned scores remain intact. The audio forecast uses this same selector and simulates hierarchy advancement without storing hypothetical progress.

## Fading, proof and scheduled review

`english_word_progress` now stores canonical fading weight, independent confirmation, proof date and next review date. `learningLifecycle.ts` mirrors the database replay. Five initial successes retain full support; the next twenty fade it to 100%. Errors reduce support confidence. Only three correct, first-play, unassisted hidden-word answers after full fading can mark a word learnt. Historical attempts are replayed in occurrence order; summary-only legacy exposure can backfill fading as of migration time, but cannot manufacture old confirmation. Raw answer counts are retained for audit, not presented as a proficiency rating.

Initial proof schedules a one-day review. Successful due reviews then use 3, 7, 14 and 30 days, continuing at 30 days. Early practice cannot push a due review forward. A failed review restores support and requires fresh proof. Due reviews take priority when compatible with the structure. Local pending answers and forecast simulations use the same transitions; already-uploaded events are not counted twice.

Queued audio preparation checks both noun subgroup queues independently and temporarily assumes the closest Current word in each pool is learnt and picks one compatible sentence for the queued replacement. This neither serves the queued word nor writes progress. The actual ten-answer forecast remains separate and includes stage transitions and review results.

Pronoun subjects enter compatible sentence structures after two distinct noun families are Learnt, counting subjects and objects together. Fading or exposure alone does not unlock them; singular and plural forms count as one family. Existing proved pronouns remain available for established learners. Once unlocked, every third question opportunity prioritizes a Current pronoun when the structure and known vocabulary support it; noun practice and due reviews continue. The audio forecast uses the same threshold.

The expanded catalogue contains 34 verbs. Phrasal particles such as putting on and taking off remain complete action chunks; getting on and arriving use reviewed on/at complements. Every verb has a genuinely contrastive, creditable listening question. Current eligibility bounds client-side candidate construction; the full server allowlist uses stable, collision-checked compound question identifiers. The forecast uses the same candidate and progression rules.
