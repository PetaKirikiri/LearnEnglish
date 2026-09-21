# Word modal

The approved word modal is the richer word explorer, not a translation-only popup. It was recovered from the separate `ui-preview.html` checkout on 2026-09-21.

Preserve this order: word and close control, learner confidence faces, Thai meaning, word details. Nouns show singular and plural rows with one/many quantity icons and before/after word combinations. Verbs retain their forms and conservative context-based tense hints. Update its visual theme without dropping these features or replacing it with a branded translation card.

`WordHelp` mounts `wordInfo/WordConfidence` and `wordInfo/WordDetails`. The language snapshot's optional `word_profile` field is validated and installed into `wordProfiles`; silently stripping it removes the richer content. Profiles and reviewed usage frames already exist in the language database. Never manufacture forms or frames for missing profiles.

Confidence ratings are self-reports saved per authenticated learner and word in `fifa_english_word_confidence`. They are separate from the answer evidence used for collected words and levels. Unsaved ratings stay pending and must not appear as synced.

Database schema files are retained for reproducibility. The language profile migration targets the language project; the confidence migration targets the account/progress project. Do not run either against the other project or overwrite existing reviewed profile data with seed fixtures.
