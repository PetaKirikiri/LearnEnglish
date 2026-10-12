# Hotel listening prototype

Route: `/hotel`. Isolated from FIFA curriculum, scoreboard and name login.
Local development only: `/hotel/preview` shows the lesson with a clearly labelled
preview identity. Production builds do not enable this preview entry.

32 locally recorded Kokoro prompts; eight contrasts, two active focuses, every
fourth question reviews earlier mastered contrasts. Four distinct correct items
unlock the next focus. This is a prototype recognition threshold, not a claim of
long-term mastery. Errors restore support; revealed answers do not build mastery.
Both alternatives use identical opacity per aligned segment, with a readable floor.
English transcript appears only after answering. Advancement is manual.

Progress is versioned local storage scoped by the signed-in user's Supabase ID and browser origin.
It is not cloud synced and does not award leaderboard points. Clearing browser data
removes this mode's progress. Do not describe it as cross-device persistence.

## Separate LINE entry, shared accounts

Requires `VITE_HOTEL_LIFF_ID`, a dedicated LIFF app in the existing LINE Login
channel `2010311582`. Set its endpoint to
`https://learn-english-coral.vercel.app/hotel`, full size, with `openid` and `profile`
scopes. Leave Padel's existing entry untouched. Configure the resulting ID in
Vercel and rebuild. Do not reuse Padel's LIFF ID: it is explicitly rejected.
Without a dedicated ID, login and QR generation are disabled; there is no fallback.
Only the account services/database are shared, not the website entry.

The login starts on EnglishSuccess and goes directly to LINE, with no preliminary
Padel website redirect. LINE entry first checks `line-liff-recognize`, which never
creates an account. An unknown user sees **Create my account**. Only that explicit
confirmation calls the existing `line-liff-auth` backend, which verifies LINE and
creates the shared profile (or reuses an account created in the meantime).
The entry screen provides a saveable QR and an Open LINE alternative. Each QR
has a distinct request ID; this is only a signup entry link, NOT a database-bound
Padel player claim token and NOT an identity credential. Account identity always
comes from server-verified LINE. Scanning continues in the scanning LINE browser;
it does not sign a different desktop browser in automatically.
SDK and API stages have a 15-second overall deadline with aborted/late-write
guards. Passive entry and OAuth redirects are bounded to prevent retry loops.
Ordinary visits reuse an existing EnglishSuccess session after server validation
with `getUser`; this is account reuse, not proof of a fresh LINE login. New visitors
use LINE. After LIFF identity verification, `line-liff-recognize` issues the same
one-use handoff ticket used by Padel. EnglishSuccess `/hotel` consumes
it with `verifyOtp`; the ticket travels only in the fragment and is removed immediately.
An already signed-in canonical account is never replaced. Both the LINE endpoint
and OAuth return stay on EnglishSuccess `/hotel`. Old saved links served under a
different origin are sent back to EnglishSuccess before any auth initialization.
Audio uses the canonical EnglishSuccess origin. Progress remains local to the account origin.
Test on an actual phone in LINE and in a normal browser before sharing with learners.
No changes to shared SuccessPadel authentication or data are required.
Console setup and real-device acceptance remain required; passing mocked tests
does not establish that the configured LINE entry works on a new user's phone.

## Audio

Run `node --import tsx scripts/generateHotelAudio.ts` from the repository root.
Uses the existing cached Kokoro runtime; no runtime AI API or browser voice fallback.
Recordings and voice manifest live in `public/audio/hotel/`.

## Review

Thai pronoun choices deliberately disambiguate a woman/man, rather than treating
Thai third-person pronouns as inherently gendered. Aspect examples use explicit
now/every day/already/plans contexts; they do not equate all Thai `laew` with English
past tense. Have the learner/native speaker review naturalness before expanding.
