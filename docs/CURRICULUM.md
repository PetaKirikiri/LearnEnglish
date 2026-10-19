# Thai-supported learning route

## Ownership

The language database is SubtitleDisplay (`gbsopnbovsxlstnmaaga`), **not** the SuccessPadel account database. This change adds public educational catalogue tables; it does not move identities, change LINE login, overwrite existing dictionary translations, or reset scores/progress.

`englishsuccess_curriculum_v2()` returns the validated catalogue. English Success and Hotel each install their own filtered scope before mounting practice, content or curriculum. The existing language URL and anonymous key are used; account session tokens are never forwarded. A validated, origin-specific cached catalogue works offline. A first-time failed load shows Retry instead of silently substituting a different course.

## Separate courses

- `/english`: English Success, 2,196 general-English listening questions.
- `/hotel`: Hotel, its original 294 professional-English questions.
- Each has `/content`, `/curriculum` and `/scoreboard`; content and score navigation remains admin-only. Development review uses `/english/preview` and `/hotel/preview` (with `/content` or `/curriculum`).
- The compact course picker changes course without mixing practice queues or scores. FIFA, Padel and Coach keep their existing routes and banks.
- General questions are selected from authored `grammar.domain` metadata. Legacy `hotel-g3-general-*` IDs and the shared catalogue's old `course: hotel` wire field remain for compatibility, not product ownership. Tests assert the domain/ID classification for every question.
- Existing combined progress is read as a fallback, filtered by question ID, then saved to separate `english:grammar:v1` and `hotel:grammar:v3` keys. The old `hotel:grammar:v2` save is never overwritten by either new course. Word familiarity has matching independent keys and a legacy fallback. Progress is still device-local; server-side answer/points records remain account-based.
- The accounts migration `20261019110000_separate_listening_courses.sql` retains all historical answers and point amounts. Course membership and score views are separate; old clients can still submit general answers through the old endpoint, but those points belong to English Success.
- Shared LINE accounts remain unchanged. The SuccessPadel callback's fixed return allowlist must ship with `mode=english` returning to `/english` before this new entry is released. Hotel/Padel/Coach return destinations are unchanged. Automated callback tests are not a real-phone LINE acceptance test.

## What is present

- 34 independently authored focus nodes across provisional A1–C1 teaching bands.
- Thai-to-English contrast notes, prerequisites and source references for every node.
- 141 concrete sentence frames across 34 sections, with English/Thai examples, focus words, question links and source references.
- 2,490 questions in 35 practice groups: the previous 294 plus 2,196 everyday-English listening questions. Original IDs, answers and audio remain unchanged.
- 479 exact word forms, with contextual Thai meanings, first-use section and links to every structure family using them. These are this course's words, not the Oxford 3000/5000.
- Matching neural recordings for the additional questions, including separate silent-gap prompts for the existing form questions. Meaning alternatives hold incidental vocabulary stable; form alternatives replace only the blank.
- Everyday examples in all 34 sections: Home, Family, Food, Work, Study, Shopping, Travel and Leisure. Each new contrast supplies both directions as separate questions. A sentence reused to test a different contrast is not counted as a new unique sentence and cannot serve as unseen transfer if it appears in supported practice.
- Links from question words to `englishsuccess_words` entries. Missing entries reuse the existing Hotel glosses and word profiles without overwriting existing rows. These are contextual meanings, not universal one-to-one equivalents.
- Admin-only navigation at `/english/curriculum` and `/hotel/curriculum`; development review at each course's `/preview/curriculum`. Sources and exercise data are public, like the previously bundled question bank. The admin navigation is not a confidentiality boundary for educational answers.

Every node has multiple everyday contexts in English Success, separate from the retained Hotel content. These are authored compositional contrasts, not 2,490 independent grammatical skills. Advanced route headings include preparatory contrasts and must not be treated as evidence of advanced ability. This is not a complete A1–C1 exercise bank, a placement assessment, or CEFR certification. There is no new learner settings page in this change. Padel and Coach retain their existing catalogues.

## Reference boundaries

Course-separation verification (19 October 2026): the accounts migration passed rollback tests, was applied, and passed again. All 426 historical answer records and all answer definitions retained identical fingerprints; the four existing Hotel members remain. Backups are in the private local `/tmp/english-course-split.tEstgq` directory. The focused 134-test suite, test typecheck, targeted lint and production build passed. Local browser inspection showed English Success 2,196 and Hotel 294 with course-specific tables and no phone-width page overflow. Browser annotation mode intercepted playback clicks, so this pass does not claim an end-to-end audio or real-phone LINE check. The app and shared callback changes are not yet committed or pushed.

British Council / Eaquals Core Inventory (2011), essential guide printed pages 10–11, informs broad teaching bands. Our labels, sequence, Thai bridges and exercises are our own synthesis. Whole sentences can contain language beyond the target feature's provisional band.

English Profile is linked for future detailed cross-checks; individual descriptor IDs have **not** been verified. Oxford 3000/5000 is a vocabulary-review reference only; no publisher word list is imported and no Oxford levels are assigned to dictionary entries. CEFR global descriptors describe wider ability, not a score obtainable from binary recognition alone.

## Adaptive behaviour

The database's Hotel group order feeds the adaptive scheduler. It concentrates on two not-yet-ready groups, unlocks transfer questions after practice evidence, and returns ready groups every fourth question for review. Within each focus it starts with the shortest unfinished sentence tier and prefers the least-practised questions, then progresses to longer clauses. Listening-meaning questions start with word-by-word text support. After two unaided supported successes on an item, its subsequent attempts hide the English completely. Transfer meaning questions are always audio-only. Revealing words or opening word help makes the attempt assisted; replay alone is allowed. An incorrect/assisted audio check resets that item's listening streak and restores supported practice (transfer checks remain audio-only with optional help).

Readiness requires two unaided **audio-only** successes for every meaning question, two unaided successes for every form question, and at least ten successes in the most recent twelve answers. Completion additionally requires retained evidence after 24 hours in four contexts including two transfer contexts; meaning retention must also be audio-only. Existing form/blank questions remain structural supplements, not evidence of listening comprehension. They have not been converted into Thai meaning pairs by this change.

Every distinct word in a correctly answered, unassisted sentence gains one familiarity step, including stable incidental words. Familiarity is not mastery. English opacity starts at 1, fades from the third successful encounter, and reaches 0 at eight; mistakes restore two steps and help restores the looked-up word. Other courses retain their existing opacity policy. Existing progress counters and scores are preserved, but old successes lacking explicit audio evidence cannot be reclassified as listening mastery. These mastery/fading records remain browser-local; existing queued answer points use the shared scoreboard service. This change does not add cross-device mastery synchronization.

The prerequisite graph now controls eligibility: all groups mapped to prerequisite nodes must be ready before a dependent group enters the two-focus queue. Previously learned groups continue to return for review. The graph is not a placement test. Word exposure/fading remains separate from grammatical mastery. Speaking and pronunciation are not measured by listening-choice success.

## Installation and safe editing

Apply the three `supabase/language/20261019*_curriculum*.sql` migrations in timestamp order **only** to the language project above. Verify the project reference explicitly; the normal repo Supabase link can point to the accounts database. The migrations are additive. The seeds use conflict-do-nothing so rerunning them cannot overwrite existing database content. Word additions have no story rank and a story count of zero, and do not add FIFA vocabulary exercises.

The frontend requires the RPC before deploying these frontend changes. Regenerate seeds through `node --import tsx scripts/curriculumSeed.ts` and `node --import tsx scripts/curriculumWordSeed.ts` after authoring changes, and review the resulting SQL. These scripts are initial import tools, not ongoing synchronizers. Once imported, database catalogue/order is authoritative at runtime.

For the populated route, author `src/curriculum/syllabus.ts`, `expandedContent.ts` and `newGlosses.ts`; run `node --import tsx scripts/buildSyllabus.ts`. It produces the reviewed snapshot, the additive language seed, and the scoring-ID migration. Apply `20261019090300_syllabus.sql` then `20261019090400_syllabus_seed.sql` to **language**. Apply `supabase/migrations/20261019090500_hotel_syllabus_questions.sql` to **accounts** to register the 128 new answer IDs. This does not award points or modify profiles. The language seed updates section ordering and structure/vocabulary metadata, but does not overwrite questions or shared dictionary rows. Back up the existing catalogue first. Generate new clips with `node --import tsx scripts/generateCurriculumAudio.ts`.

Existing IDs represent existing evidence: give materially changed questions new IDs, new audio and reviewed alternatives; do not reuse an old ID for a different skill or answer. Every group needs multiple practice questions and transfer contexts. Keep incidental vocabulary stable between alternatives, with only the intended grammar or meaning contrast changing. Verify both branches, Thai meanings, ambiguity and audio before publishing.

The everyday expansion is authored in `generalContent.ts` and `generalGlosses.ts`. The same build script now writes `supabase/language/20261019090600_general_listening_seed.sql` for the language project and `supabase/migrations/20261019090700_general_listening_questions.sql` for shared scoring. It does not rewrite the earlier applied seeds. If the database management API rejects the large seed body, stage its rows in a task-owned table with RLS and all public/anonymous/authenticated privileges revoked, then perform the equivalent upserts and remove staging in one transaction. Do not expose a partially imported catalogue. Back up the original questions and dictionary and compare them after import; register only new scoring IDs, never reset learner points.

New words require reviewed entries in the shared Thai dictionary. The word-link import matches exact lowercase forms; missing matches need a deliberate review, not automatic lemmatization or machine-gloss substitution. Update the catalogue revision when publishing changes. Browser caches refresh on a subsequent full page load; an active lesson keeps its initial snapshot.

## Checks

`npx vitest run src/curriculum src/hotel/HotelPage.test.tsx src/hotel/HotelContentPage.test.tsx src/hotel/course.test.ts`

Tests cover schema rejection, atomic loading, cache isolation, unchanged saved evidence, database order in practice/content, prerequisite gating, all-question reachability, assistance not earning readiness, paired vocabulary invariance, word profiles and audio fingerprints. Also run `npm run typecheck:test`, `npm run build`, and `node --import tsx scripts/verifySyllabus.ts`; inspect the local curriculum/content/practice routes with a real language RPC response. Passing these checks does not imply a production deployment or complete curriculum coverage.

### Initial index verification, 19 October 2026

The three migrations were applied to the language project above after rollback checks. The anonymous RPC returned 34 nodes, 16 groups, 166 questions and 786 question/word links covering all 157 distinct English word forms in those questions. There were no missing links. The language snapshot validated with 1,348 entries: 58 missing forms were added using existing Hotel meanings/profiles. A before/after fingerprint of the original 1,290 dictionary rows was identical. Anonymous catalogue access was verified as read-only (no insert, update or delete privileges).

85 focused Hotel/curriculum/Padel tests, test typechecking, targeted lint and production build passed. The existing large-bundle build warning remains. Local browser inspection confirmed the learning route, C1 gaps, linked 22-question pronoun table and two-choice practice screen; no console errors were observed. This revision has not been pushed or deployed to Vercel.

### Populated route, 19 October 2026

The language RPC now returns 34 sections, 87 frames, 35 groups, 294 questions, 249 word forms and 1,666 question-word links. All vocabulary entries resolve to shared dictionary rows. The original 166 question rows and all 1,348 previous dictionary rows were compared with the backup and remain unchanged; 44 dictionary rows were added with zero story counts and no story ranks. Anonymous access to the new tables is select-only. The 128 scoring IDs were registered in the accounts project; the previous 486 scoring definitions retained the same fingerprint. No learner points or profiles were changed. The frontend is still local, not pushed.

99 focused tests, test typechecking, targeted lint and production build passed (existing large-bundle warning remains). The local browser showed the actual frames, searchable vocabulary, an eight-question linked contrast set and working new-word help with forms/examples. A preview answer required Next, and the next question switched from role meaning to object-pronoun form. This preview check did not write scores to a real learner account. The recordings were checked against their text/fingerprints and WAV headers; not every clip has been manually listened to. The curriculum's recorded level bands remain provisional.

### Listening progression revision, 19 October 2026

Added separate audio-only evidence, per-word fading to zero, automatic practice checks after supported success, mistake recovery and guarded playback callbacks. Existing attempts are preserved but not retroactively awarded listening mastery. The 294-question catalogue and scoring IDs were not changed. Focused tests cover the supported-to-audio transition, help invalidating checks, delayed retention, old-progress loading, independent fading, prerequisites, continued review, full-course reachability and unchanged Padel behaviour. Browser inspection exercised two-choice listening, disabled answers during playback, feedback and manual Next in local preview only. No real learner was marked or scored, and this revision has not been pushed.

### Everyday listening expansion, 19 October 2026

Revision `2026-10-19.3` adds 2,196 questions (1,098 two-direction contrasts) to the previous 294: **2,490 total**, 141 frames, 479 word forms and 14,213 question-word links. The new questions cover Home 332, Family 486, Food 282, Work 252, Study 214, Shopping 214, Travel 220 and Leisure 196. All 34 sections have everyday examples. Reused sentences can test different contrasts, but there are no identical English/question-kind/answer-pair duplicates. The incidental people, verbs and objects stay stable within each pair; inflection, small words, roles or word order carry the difference.

The language import was staged privately, rollback-tested and applied atomically after recording generation. The public RPC matches the reviewed snapshot exactly. Fingerprints confirm that all 294 previous question rows and 1,392 previous dictionary rows remain unchanged; 111 new shared dictionary entries were added. Course-local multi-sense glosses cover forms such as book, water, free, called and order without overwriting shared translations. The 2,196 new scoring definitions were registered, giving 2,810 total; the preceding 614 definitions are unchanged. No profiles or learner scores were edited. The task-owned staging table was removed by the successful transaction.

All 111 tests across 18 Hotel/curriculum/Padel files pass, including reachability of all 2,490 questions, vocabulary invariance, no duplicate pairs, transfer separation, word help and audio text/fingerprint/WAV checks for every new clip. Test typechecking, targeted lint and production build pass; the existing large-bundle warning remains. Browser verification confirmed `Content 2490`, all eight situation filters and real new rows, plus successful playback from the Food filter. These checks do not mean every clip has been manually listened to or that the provisional bands certify CEFR proficiency. The frontend and new recordings remain local and have not been pushed to Vercel.
