# Padel Coach

Thai listening for a French-speaking padel coach. Separate from the English-for-staff Padel & Pilates course.

- `/padel-coach`: shared LINE identity, then practice.
- `/padel-coach/content`: existing admin only; full ordered question/meaning/alternative table with audio.
- `/padel-coach/preview` and `/padel-coach/preview/content`: local development only.
- 128 question variants, 64 contrasting pairs, 16 topics: encouragement, contact, movement, net, glass, serve, control, timing, drills, teamwork, demonstration, understanding, explanation, repetition, checking on the player and managing the session. The original 80 IDs and ordering are preserved; the 48 communication prompts follow them. The content table includes authored English review meanings alongside Thai and French.
- Thai audio, two French meanings, randomized answer sides, manual Next. Audio must finish before answering. This tests listening comprehension, not speaking proficiency.
- No automatic whitespace tokenization: authored Thai chunks support tap-for-French help and an approximate Latin reading aid. Audio is the pronunciation reference. Male politeness/self-reference matches the requested coach.
- Correct unaided answers increment each distinct chunk in the sentence once. Unseen chunks do not change. Wrong answers reduce strength by two; assistance does not increase it. Tapping help resets that chunk's strength. Opacity fades independently, down to 20%; revealing restores all text but marks the attempt assisted.
- Two active topics; each question requires two consecutive unaided correct answers. Every fourth round reviews a completed topic. Practice continues when the course is complete. These are practice thresholds, not a claim that guessing is impossible or speech is mastered.
- Progress is learner-scoped on this device under `padel-coach:v1:<id>` and `padel-coach:words:v1:<id>`. This course does not write Hotel or Padel staff scores, and does not yet sync its progress between devices.

## Audio

`node --import tsx scripts/generateCoachAudio.ts` generates local Thai Kanya recordings for all unique sentences and help chunks. Files are content-addressed; tests check the manifest against the exact displayed Thai. French choices are authored, not machine-translated at runtime. Tactical instructions are contextual requests, not universal rules about when to move or hit. A Thai-speaking padel coach should review idiom/pronunciation before a wider release.

## Shared LINE return

The existing account flow needs the `padel-coach` allowlisted mode in SuccessPadel's `src/lib/line/englishEntry.ts`. Its fixed return is EnglishSuccess `/padel-coach`. No new database or LINE channel is created. Both repositories' changes must be released together; real-phone approval/new-account completion is a separate check from automated tests.
