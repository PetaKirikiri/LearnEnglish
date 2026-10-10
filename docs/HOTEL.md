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

## Shared LINE entry

Uses the existing LIFF app `2010311582-o2c1DCnP` with `app=englishsuccess&mode=hotel`.
The existing Padel `/login?app=englishsuccess` rewrite serves this app under the
registered LINE endpoint. The hotel destination is carried through `liff.state`
and the secondary redirect. No separate hotel LIFF app or environment variable is needed.

LINE entry exchanges the LINE ID token with the existing `line-liff-auth` backend.
Ordinary visits reuse an existing EnglishSuccess session after server validation
with `getUser`; this is account reuse, not proof of a fresh LINE login. New visitors
use LINE. The hotel stays within the shared entry origin after login; audio uses
the canonical EnglishSuccess origin. Progress remains local to that origin.
Test on an actual phone in LINE and in a normal browser before sharing with learners.
No changes to shared SuccessPadel authentication or data are required.

## Audio

Run `node --import tsx scripts/generateHotelAudio.ts` from the repository root.
Uses the existing cached Kokoro runtime; no runtime AI API or browser voice fallback.
Recordings and voice manifest live in `public/audio/hotel/`.

## Review

Thai pronoun choices deliberately disambiguate a woman/man, rather than treating
Thai third-person pronouns as inherently gendered. Aspect examples use explicit
now/every day/already/plans contexts; they do not equate all Thai `laew` with English
past tense. Have the learner/native speaker review naturalness before expanding.
