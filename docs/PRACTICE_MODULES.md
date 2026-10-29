# Finite practice modules

The default phone practice route uses `NumberFoundationCourse`, backed by `numberFoundation.ts`. The starting sequence is noun-phrase number detection, full-sentence number detection, then subject–verb agreement; vocabulary meaning is not assessed here.

Module 1 has 30 listening questions: hotel/hotels, phone/phones, key/keys, book/books, and watch/watches. Each form occurs three times. The opening pair is hotel/hotels; the remaining prompts are shuffled. Thai answer buttons distinguish one thing from several things. The read-only yellow determiner/noun matrix stays visible, so this practices number recognition with listening support rather than audio-only assessment. A recording must finish before answers unlock.

Module 2 adds chair/chairs, table/tables, bag/bags, shoe/shoes, and sock/socks to the original five pairs. Its 30 questions include each original form once and each new form twice, showing and playing the complete sentence: `Where is the hotel?` or `Where are the hotels?`. The same Thai singular/plural apple buttons remain.

Module 3 uses the expanded ten-noun set and 30-question structure. The shared sentence matrix shows `Where _____ the {noun}?`, and the answer buttons are is/are. Audio contains only `the {noun}`, so it does not disclose the missing verb.

Every attempt ends after 30 questions. Passing requires 27/30 overall and at least 12/15 in each number category. Passing Module 1 unlocks Module 2; passing Module 2 unlocks Module 3. This is a practice progression criterion, not proof of retained vocabulary meaning or long-term mastery. Mistakes do not append questions.

Forty static Kokoro recordings (twenty noun phrases and twenty complete sentences) are included under `public/audio/number-foundation`; regenerate with `npx tsx scripts/generateNumberFoundationAudio.ts`. No browser speech fallback is used.

Unfinished attempts and progress persist per user in local browser storage. Cross-device module completion is not synchronized to the account database. No word-mastery evidence or points are awarded merely for finishing this activity.

The previous authored meaning/practice packs remain in `PracticeCourse`, `practiceModules.ts`, and `PracticeSession` for later curriculum integration; they are no longer the default starting path.

Returning-account placement: after LINE sign-in and EnglishSuccess enrolment, `PhonePractice` reads the signed-in user's all-time EnglishSuccess points through the existing authenticated leaderboard RPC. At 600 points or more, it opens Module 3 (is/are), replacing an unfinished Module 1 or 2 attempt while preserving an existing Module 3 attempt. This does not fabricate completion of earlier modules or award points. Below 600 points, normal saved progress applies; a new account starts Module 1. Score-loading errors offer retry instead of silently assigning Module 1. Local design previews bypass placement. This threshold refers to practice Module 3, not classroom Lesson 3's pronoun curriculum.
