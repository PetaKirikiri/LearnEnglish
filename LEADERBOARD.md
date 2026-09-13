# Group leaderboard

Private groups share a weekly leaderboard. Members join explicitly using a shareable link or 16-character invite code. Anyone with that invite can join (up to 200 members). Users can own five groups. Group members see display names and aggregate weekly points, not private learning events. Leaving removes membership but retains the user's own scores.

## Scoring

- Every distinct active question answered correctly earns 10 points once per learner per week, across groups. Wrong answers can be retried. Joining a group includes points already earned that week.
- A database trigger checks the submitted choice against a server-side answer catalogue. It does not trust a client-supplied score, correctness boolean or timestamp.
- Weeks begin Monday at midnight in Asia/Bangkok. Offline answers count in the week they sync. Old events without the selected choice are not backfilled.
- Tied scores share a rank. Last week remains viewable. No scheduling service or destructive reset is needed.
- Existing name-based login is unchanged. This is casual competition, not verified identity or anti-cheat protection for cash prizes.

## Deployment and content updates

Apply `supabase/migrations/20260913010000_fifa_english_groups.sql` once to the existing project database. It adds isolated FIFA tables and RPCs; it does not modify SuccessPadel tables or progress access policies.

Whenever the quiz catalogue changes, run `node --import tsx scripts/leaderboardCatalogue.ts`. Apply its SQL output to the same database through the authenticated database administration channel. The script deactivates removed questions and upserts current stable question keys and answers without deleting earned points. Run it from the exact deployed revision. Never put service credentials in the client.

The client records the actual selected `choice` in each answer event. Existing durable progress syncing sends it to the database. Public clients cannot directly access groups, memberships, answer keys or points tables. Authenticated membership-checked RPCs expose the required actions and aggregate board only.

## Checks

`npm test`, `npm run typecheck:test`, `npm run build`, `npm run lint`.

Live database verification was performed inside a transaction and rolled back: duplicate scoring, corrected retries, forged correctness, timestamp handling, tie ranking, nonmember privacy, anonymous access, own-event insertion policy, create/join/leave and repeat joins. Browser checks cover phone layout and the invite/sign-in flow. No tests should add scores or answer history to FIFA's account outside a rollback transaction.
