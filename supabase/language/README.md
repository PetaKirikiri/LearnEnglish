# EnglishSuccess language database

Target: SubtitleDisplay (`gbsopnbovsxlstnmaaga`). These migrations must NOT run
against SuccessPadel (`bknorpjoyxucrihnpyda`).

`englishsuccess_words` owns English-to-Thai word-help glosses, reviewed lesson
glosses, and the imported corpus frequency/rank. Existing `words_th` and
`meanings_th` remain untouched: a Thai sense is not automatically an English
translation in the opposite direction.

The browser reads a complete snapshot through `englishsuccess_language` using
the language project's public anon key. No Padel session, private user data, or
service-role key is sent to this connection. Anonymous clients cannot write.
All current UI translation consumers and vocabulary generation use the loaded
snapshot. An offline cache contains only a previously validated DB snapshot;
first-time fetch failure blocks lessons with Retry, rather than silently using
the old bundled dictionary. Reload the app to receive published changes.

Accounts, LINE linking, attempts, progress, question reports and point awards
remain in SuccessPadel. Stories, syllabus, question definitions and audio files
remain in the application. This change migrates word data, not those assets.

The original dictionary files are kept as versioned seed/test fixtures only.
`scripts/languageSeed.ts` reproduces the initial import; never rerun its seed to
overwrite corrections made in the database.

Publishing a changed **lesson** gloss can change quiz answers. Before release,
load the new snapshot with `installLanguageSnapshot`, regenerate
`getQuizCatalogue()` and update the Padel `fifa_english_scoring_questions` answer
registry to match. Keep existing question IDs and awarded points. Changing only
`thai_gloss` affects help/admin display and requires no scoring-key change.
