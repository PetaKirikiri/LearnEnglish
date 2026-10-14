# Padel & Pilates staff English

Routes: `/padel` (shared LINE account required), `/padel/content` (existing EnglishSuccess admin only). `/padel/preview` is development-only and cannot write Hotel scores.

The curriculum has 324 recordings / 162 two-way contrasts across 22 topics. The original 112 Padel and 112 Pilates questions remain interleaved from the opening lesson. Another 100 operational questions cover court bookings, times/durations, player numbers, prices/payment, racket hire, balls/grips, rain, rules and Pilates packages. Sources: `src/padel/content.ts`, `src/padel/pilatesContent.ts` and `src/padel/clubContent.ts`; the lesson and content table use the same ordered question collection. Core booking/hire topics follow people, equipment and amounts, before the advanced grammar topics. Stable authored pair IDs preserve progress when pairs are inserted. The URL, login mode and storage keys remain `padel` after the display-name change.

Sports rules source: [FIP Rules of Padel](https://www.padelfip.com/wp-content/uploads/2025/12/FIP_Rules-of-Padel-1.pdf), service/return rules. Both alternatives can be heard as English, so never pair a true rule with a false instruction. Ball/glass/bounce contrasts describe events, not rulings; pricing and rain/refund policies are examples awaiting venue confirmation. Staff ask the manager about refunds rather than promise one.

Both customer conversations and colleague handovers are included. Pilates covers instructors, mats, reformers, grip socks, studios, lockers, private and group classes, availability, waiting lists, bookings, class times, payments, comfort and equipment handovers. Pain or dizziness is referred to the instructor, not treated as exercise advice. Opening times, availability, prices and permissions in exercises are language examples, not statements of actual venue policy.

The shared Hotel listening component provides two shuffled Thai choices, audio completion gating, tappable English tokens, word help, independent word fading, assisted-answer handling and manual Next. Two current topics are mixed with earlier review; practice continues after all topics are completed. Padel's word profiles use its own sentence corpus and neighbors, not Hotel examples.

Progress and word familiarity are stored locally under `padel:v1:<user-id>` and `padel:words:v1:<user-id>`. They are separate from Hotel and other learners. This version does not add a Padel scoreboard or cloud progress synchronization. Correct-sentence word exposure drives support fading, as in Hotel; this is not proof that each unchanged word was independently tested.

## Audio

Run `node --import tsx scripts/generatePadelAudio.ts`. Uses the existing local Kokoro runtime, voice and generator. Recordings and exact-text manifest are under `public/audio/padel`. No browser-voice substitution or external audio API.

## Login release dependency

The shared registered LINE callback in `/Users/petakirikiri/Coding/SuccessPadel` must recognize the allowlisted `mode=padel` and preserve it through approval and the one-use account ticket return. Changes are scoped to:

- `src/lib/line/englishEntry.ts`
- `src/lib/line/englishHandshake.ts`
- `src/englishSuccessEntry.ts`
- `scripts/test-english-padel-entry.mts`

Hotel remains the default. Existing player QR claims and `sp_return_to` routes are excluded. No arbitrary return URL is accepted. Shared accounts and profile creation are unchanged.

Publish that callback update before publishing the EnglishSuccess route. Do not commit unrelated SuccessPadel changes: that checkout contains extensive existing work. Both releases are git-based; neither has been released as part of adding this route locally. Automated new/existing-account tests use injected LINE/account responses and are not a real-phone signup verification.

## Verification

`npm test -- src/padel src/hotel` checks content/recordings, every word's glossary and profile coverage, sequencing/review, admin access, assisted answers, word fading, persistence isolation and existing Hotel behavior. `npm run typecheck:test` and `npm run build` check types and production bundling.

In the SuccessPadel checkout, run the existing `scripts/test-english-entry.mts` plus `scripts/test-english-padel-entry.mts` with a TypeScript runner. Test a real new and returning LINE account after publishing, ending at EnglishSuccess `/padel`.
