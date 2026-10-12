# Hotel listening prototype

Route: `/hotel`. Isolated from FIFA curriculum, scoreboard and name login.
Local-only `/hotel/preview` shows the lesson with a labelled preview identity.

32 locally recorded Kokoro prompts; eight contrasts, two active focuses, every
fourth question reviews earlier mastered contrasts. Four distinct correct items
unlock the next focus. This is a prototype recognition threshold, not a claim of
long-term mastery. Errors restore support; revealed answers do not build mastery.
Both alternatives use identical opacity per aligned segment, with a readable floor.
English transcript appears only after answering. Advancement is manual.

Progress is local storage scoped by the signed-in Supabase ID and browser origin.
It is not cloud synced and does not award leaderboard points. Clearing browser data
removes this mode's progress.

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

## Review

Thai pronoun choices deliberately disambiguate a woman/man, rather than treating
Thai third-person pronouns as inherently gendered. Aspect examples use explicit
now/every day/already/plans contexts; they do not equate all Thai `laew` with English
past tense. Have the learner/native speaker review naturalness before expanding.
