# Classroom Game

Teacher: `/classroom/index.html` → Students (existing QR) → Game. Student attendance and LINE identity are reused. Start drawing opens the game on all joined phones. One student is enough to test the full round. The default drawing time is 60 seconds; 30/90/120 are also available.

Each participant receives one private Thai noun from their practised course vocabulary, with the course’s six starter nouns as a fallback. Drawings autosave during the timer, with a tab-local backup. Tap Done to submit and lock the drawing. Server-recorded finishing bonuses are +3/+2/+1 for the first three, once per round. Autosaves do not count as finishes. All players finishing advances the round early; otherwise the server ends drawing time. Teacher presents each picture; the question and drawings stay on the classroom screen. Phones show only waiting, the full-screen canvas, names to award a point, then names for the favourite-picture vote. Answers are spoken. Only the current artist can award one point to another round participant. Awarding reveals the English answer; the teacher can reveal without a point and advance past absent artists.

After all pictures, each participant votes once for another nonempty picture. Teacher closes voting. All tied winners receive three points; no votes means no bonus. Scores accumulate across rounds in this class, separately from practice coins. Late joiners can watch; they participate from the next round. “Return phones to class” hides the game; reopening resumes it.

Backend: `supabase/migrations/20261110000500_drawing_game.sql`. Tables are RLS-protected with no direct participant grants. The RPC checks the existing class host secret / authenticated attendance, locks the session, validates phases and round IDs, and filters private prompts. The follow-up drawing migrations add solo play and course vocabulary; do not apply unrelated pending migrations.

The Game tab includes the live class join QR and links to `/english/game/preview`, which stays on a scan-first QR screen. Scanning opens `/english/game/preview?phone=1` and only then starts the automatic phone test, without signing in or saving points. Browser classroom joins start LINE login and retain the class query through the return URL.

Checks: `npx vitest run src/drawing/DrawingGame.test.tsx src/classroom/session.test.ts`. `integration.sql` exercises a two-student game and rolls back all test data; run through the project's privileged SQL management connection. Physical phone and classroom Wi-Fi conditions still need in-room confirmation.
