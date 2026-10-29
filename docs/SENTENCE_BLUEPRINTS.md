# Sentence content contract

The beginner matrix uses shared blueprints in `src/learning/sentenceRules/blueprints.ts`.
Run `npm run audit:sentences`; the build runs it automatically. No model, network service, or AI tokens are involved. The command writes `reports/sentence-blueprints.json` and exits unsuccessfully on unexpected findings. Findings identify the content ID, blueprint, sentence, slot, word and rule code.

## Meaning and structure

- `where-noun`: Where + agreeing be + determiner + locatable noun. Places, people and physical objects fit; abstract senses do not. Phone is valid; thought is not approved in this beginner construction.
- `where-person`: Where + subject-agreeing be + pronoun/person.
- `person-at-place`: subject + agreeing be + at + determiner + approved destination. Physical objects are not destinations merely because they can be located. Bedroom needs a separate preposition treatment.

Words may explicitly supply `meaning: {kind, locationPrepositions}`. Reviewed vocabulary categories supply defaults for existing content. Explicit meanings take precedence, so a different sense of a word can be tagged independently. Unknown meanings are audit errors, never guessed from spelling. Singular/plural agreement uses authored number metadata, including pair-only nouns.

UI category filters are for browsing; sentence eligibility is a separate shared contract. Location answer choices and generators use the shared validator. The location-question selector uses the same validator as the audit: abstract and unclassified words are not offered. Custom word senses need reviewed meaning metadata before selection.

Intentionally incorrect question prompts must be checked as negative examples: their expected agreement violation is verified, rather than exempting the entire question bank. The audit validates the rendered Lesson 3 answer and dialogue texts as well as exhaustive supported noun/determiner combinations across Lessons 1–3. New construction families need a registered blueprint and an audit adapter; this is not an unrestricted English-language parser or a claim to audit every legacy course.

## Content creation

Tag new word senses before adding questions. Choose a construction, supply its semantic slots, validate, then generate options/audio. Review each reported failure and fix the word metadata or content; do not silence it by marking everything physical or allowing every noun with every preposition. Additional verbs will need relationship constraints such as animate agent or edible object.


## Extended checks

The audit also covers the Lesson 1/tonight, holiday, and Lesson 2 authored question banks. Each negative example must exhibit its intended omission or agreement error; unrelated errors remain failures. Positive questions must match their blueprint.

Additional checks catch duplicate IDs within a bank, duplicate rendered answer options, empty prompts/options, out-of-range correct-answer indexes, missing meanings, duplicate vocabulary entries, incorrectly labelled authored singular/plural forms, and pair-only nouns marked singular. Audio coverage is reported separately as warnings, with unassigned recordings distinguished from broken assigned file paths.

`meaningProfiles.ts` holds reviewed sense-level classifications beyond browsing categories. For example, an ATM remains a physical object but has an explicit destination role allowing “at the ATM”; a phone has no such destination approval. Mass/plural-only metadata is available for new senses. Do not infer plural number simply because spelling ends in s (bus is singular), and do not infer meaning solely from a broad UI category.

The JSON report is machine-readable; `reports/sentence-blueprints.md` is the short human-readable summary. Current metadata checks use authored forms; they are not a comprehensive English inflection or pronunciation engine.


## Bidirectional choice engine

`choices.ts` supplies `nounsForSentence`, `blueprintsForNoun`, and `agreeingNoun`. The matrix picker, destination list and verb counterpart selection consume these helpers. They delegate to the validator; they do not maintain separate whitelist rules. The audit includes a word-to-blueprint compatibility table and checks that forward/reverse selection agree for every Lesson 3 noun. Meaning eligibility, agreement, and lesson vocabulary availability must all hold before a counterpart can be offered.
