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

Progress is versioned local storage scoped by the verified LINE user's Supabase ID.
It is not cloud synced and does not award leaderboard points. Clearing browser data
removes this mode's progress. Do not describe it as cross-device persistence.

## LINE setup required

Create a LIFF app on the same LINE Login channel already accepted by the existing
`line-liff-auth` function. Set its endpoint to
`https://learn-english-coral.vercel.app/hotel`, enable `openid` and `profile`, and set
`VITE_HOTEL_LIFF_ID` to that LIFF ID before building/deploying. Do not reuse an ID
whose endpoint sends users to another application. Register/confirm the permitted
return URL in LINE. No secrets belong in Vite variables.

The hotel entry always exchanges a LINE ID token with the existing backend. An
existing name-login session is not accepted as proof of LINE authentication.
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
