# Hotel listening prototype

Route: `/hotel`. Isolated from FIFA curriculum, scoreboard and name login.
Admin-only scoreboard: `/hotel/scoreboard`.
Local-only `/hotel/preview` shows the lesson with a labelled preview identity.

320 locally recorded Kokoro prompts; twenty focuses with sixteen items each,
two active focuses, every fourth question reviews earlier completed contrasts.
All sixteen distinct unassisted correct items unlock the next focus. This is a
prototype recognition threshold, not a claim of
long-term mastery. Errors restore support; revealed answers do not build mastery.
Thai alternatives stay fully readable. English is shown from the start, with
individual word opacity based on learner-specific repeated successful encounters.
The first two unassisted successes keep a word fully visible; successes three to
eight gradually fade it to 25%. New words stay visible even beside familiar words.
Wrong answers reduce familiarity; word lookups restore that word's support.
These are support heuristics, not evidence of individual word mastery. Encounters
count once per distinct word per answered question, never for reloads or replays.
Word memory is stored separately under `hotel:words:v1:<userId>` on this device;
existing learners begin with full word support. Advancement is manual.
Completed topics continue rotating in review; there is no final batch or end screen.
The reception revision replaces 152 prompts and retains 40 unchanged prompts.
Replacements use `-r2` IDs and new audio paths so old mastery and cached recordings
cannot be applied to a new meaning. Loading progress retains unchanged active IDs
and historical attempt/correct totals, but removes obsolete IDs from mastery.
Completing the old four-item starter set does not skip the expanded topic.
The review cursor rotates independently of the
four-question review interval so no completed topics are starved.

`course.ts`, `expandedContent.ts`, and `routineContent.ts` are the shared
practice/content-page source.
The admin-only `/hotel/content` table shows all items in curriculum order. Actual
practice interleaves the two active focuses and earlier review. Short chunks grow
into receptionist-to-guest interactions: bookings, room readiness, directions,
transport, requests, and offers of help. Conversation and help add 32 prompts,
including flights, daily plans, and calling reception. Housekeeping is referred
to as another team, not as the receptionist's own cleaning work. The foundational
person, quantity, possession, negative, and time/aspect contrasts remain.

The routines expansion adds 96 prompts (hotel-225 through hotel-320): facilities,
opening/closing hours, early check-in and late checkout, wake-up calls,
arrivals/departures, and hotel rules. Existing IDs, audio and progress are unchanged.
Patterns recur across facilities: pool/gym/sauna, at/from/until/by, before/after,
open/closed, early/late, and can/cannot. Times, locations, charges and rules are
fictional training situations, not verified policies for a real hotel.

Learning progression is local storage scoped by the signed-in Supabase ID and
browser origin. Clearing browser data removes this mode's learning progression.
Hotel membership, answers and points are stored separately in the shared accounts
DB (SuccessPadel), using only `englishsuccess_hotel_*` tables and `hotel_*` RPCs.
The language DB and existing FIFA/Padel point ledgers are unchanged.

Scoring starts with this release; old local progress is not backfilled as points.
Correct answers earn 10 points, or 5 after Show words. Each question awards at most
10 per learner per Bangkok calendar day; improving an assisted answer awards the
remaining 5. Wrong answers and repeats still count as activity. The DB verifies the
canonical choice against the shipped answer registry and calculates the award;
it never accepts client points/correct flags. Retries use stable event UUIDs, and a
per-account transaction lock prevents concurrent devices from exceeding the cap.
Offline answers remain in an account-scoped browser queue and sync on subsequent
answers, Retry, reconnect, or opening the app. Periods use server receipt time;
offline answers count on the day they sync. Clearing browser data loses unsynced
answers, not already saved scores. Pending queues are not imported across accounts.

The administrator sees all Hotel members, including zero scorers, with Today,
This week, This month and All time (Bangkok boundaries), answers, accuracy, LINE
photo/name and last activity. Membership begins when a signed-in user opens Hotel
practice. Preview never registers or scores. The table and RPC are admin-only.
Deploy `20261012120000_hotel_scoreboard.sql` to the accounts DB, then apply the
registry produced by `scripts/hotelScoringCatalogue.ts` before deploying the UI.
Refresh that registry whenever the Hotel catalogue changes. Run
`supabase/tests/hotel_scoreboard.sql` inside a rollback transaction for scoring,
retry, access and cross-product isolation checks.

## Existing LINE approval, shared accounts, EnglishSuccess destination

Sign up → existing LINE approval → EnglishSuccess `/hotel`.
No QR, player-claim token, name/email form or second registration confirmation.
No new LINE Developers configuration or `VITE_HOTEL_LIFF_ID` is needed.

The existing registered entry is `2010311582-o2c1DCnP` in channel `2010311582`.
Its registered endpoint remains `https://success-padel-ffzt.vercel.app/login`.
The URL carries `app=englishsuccess&mode=hotel` and, only for signup, `intent=signup`.
At that endpoint, SuccessPadel's `src/main.tsx` intercepts these markers before
loading App, its providers or any Padel interface. `englishSuccessEntry.ts` finishes
LINE initialization there, then returns directly to EnglishSuccess. This transient
callback still has the registered hostname; it displays only EnglishSuccess.
Do not redirect away before LINE initialization completes or change Padel's endpoint.

The callback verifies identity through existing `line-liff-recognize`. Known members
are reused; unknown members with explicit signup intent go through `line-liff-auth`,
which creates/reuses the shared account using verified LINE name/photo. Accounts
are not created before identity verification. Unknown ordinary sign-ins return to
Hotel with a signup prompt. Padel's existing browser session is neither read nor
replaced. Existing QR player-claim links and other Padel entries remain unchanged.

Recognition issues a one-use ticket. Only that ticket goes in the `/hotel#ticket=…`
fragment, never LINE or session tokens. Hotel removes it immediately and uses
`verifyOtp` to establish its own session in the shared account DB. A pre-existing
EnglishSuccess session is validated and retained. Progress stays on this origin.

**Release order:** deploy Padel's isolated callback first, then the English entry.
Both use Git deployment. No DB migration or new edge function is needed.
The old project-level Vercel rewrites named `EnglishSuccess LINE initial redirect`
and `EnglishSuccess LINE entry` must remain disabled. They served English's HTML
under the LINE callback hostname with incompatible asset URLs, bypassing the
handler and producing a blank page. Routing is now handled by the callback code.
Callback network/SDK work is bounded to 20 seconds and prevents late follow-up
writes after timeout. A cancelled login does not loop. LINE may still require its
own authentication/consent; never promise that can be bypassed.
Mocked tests cover new and existing identities but do not replace an actual new
user completing LINE consent and arriving signed in at `/hotel` on a phone.

## Audio

Run `node --import tsx scripts/generateHotelAudio.ts` from the repository root.
Uses the existing cached Kokoro runtime; no runtime AI API or browser voice fallback.
Recordings and voice manifest live in `public/audio/hotel/`.

## Word help

Visible English words in practice and the admin content table open FIFA's shared
word-help modal. Hotel adds context-specific Thai glosses for words outside FIFA's
dictionary; every Hotel English token has an offline gloss. The modal loads the
shared language database on demand for existing word profiles and details, with
local glosses available if that request fails. Its audio button replays the whole
recorded sentence, not an isolated word.

Show words restores all English to full opacity. Using it or opening word help
before answering keeps the existing assisted-answer scoring and mastery rules.
The default visible English is not charged as help. Opening word help does not
submit an answer. Reviewing words after answering does not deduct additional points
or change the submitted attempt.

## Review

Thai pronoun choices deliberately disambiguate a woman/man, rather than treating
Thai third-person pronouns as inherently gendered. Aspect examples use explicit
now/every day/already/plans contexts; they do not equate all Thai `laew` with English
past tense. Have the learner/native speaker review naturalness before expanding.
