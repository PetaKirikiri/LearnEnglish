# UI presentation

- Do not display development-status labels or scaffolding commentary in the product UI unless the user explicitly requests them. This includes badges or notices such as Draft, Prototype, Local preview, Coming soon, Not deployed, and Saved on this device.
- Present the intended product experience during development. Communicate implementation or release limitations in chat, not as unsolicited interface copy.
- Keep genuine actionable errors, necessary saving-failure warnings, and intentional access/publication controls. Do not change permissions or publish unfinished content merely to hide a status label.
- Preserve this preference in subsequent UI work.

# Example language presentation

- Sequence beginner lessons by prerequisites, not sentence length or question count. Introduce one new word, meaningful chunk, or construction at a time; keep the rest familiar. Teach question words on their own before combining them with a stable question frame. Do not introduce location prepositions, auxiliary constructions, quantity constructions, or tense changes incidentally in the first examples.
- The lesson display and homework must use the same ordered stages. Later stages require repeated unassisted success on prerequisites, and earlier content must return for review. Test these teaching constraints as well as audio, counts and rendering; do not pad an introductory lesson with harder sentences to hit a target count.

- English example text uses three layers: English words, their contextual Thai meanings aligned immediately underneath, then the complete natural Thai sentence below.
- Reuse `ExampleLanguage` for example displays. Keep each source/meaning pair together when wrapping on phones. Preserve authored emphasis.
- Author meanings for the actual sentence, not dictionary replacements or a positional split of the Thai translation. Keep genuine multiword constructions together when there is no honest one-word equivalent.
- This is an example-reading convention, not permission to expose translations that reveal the answer in an unanswered listening test.

- In race teaching notes, always present English examples in the established four-box sentence matrix (question / is-or-are / the-my-your / vocabulary), with the same colours and icons as the sentence builder. Use `ExampleLanguage matrix` and the shared `SentenceSlot`; keep Thai meanings inside each box and the natural Thai sentence underneath. Singular words keep their grammatical slot colour. Do not replace this with loose sentence text or a new card design.

# Sentence-structure illustrations

- A new meaning, modifier, vocabulary item or curriculum topic is not automatically a new sentence structure. Organize examples into reusable construction families, with variations and recap/composition examples inside them. Judge changes to clause arrangement, auxiliary/verb construction, complements and participant relationships; do not count this/that, a few/few, bigger/smaller or ordinary uses of only as independent whole-sentence structures.
- Preserve real tense/aspect, question, complement, active/passive, embedded-clause and conditional contrasts, including past-condition/present-result mixed conditionals. Do not flatten these into a single subject–verb–object category. See `docs/SENTENCE_STRUCTURE_REVIEW.md` for the reviewed catalogue and proposed grouping.

- Illustrations carry the meaning, not decoration. Review the picture without its sentence: the action, person, object, location, ownership or time relationship must be visible.
- Never use a generic idle bird plus a question mark as a fallback for unrelated questions. Put the unknown or visual attention on what is actually being asked.
- Use matched scenes or short storyboards for meaningful contrasts. A caption alone does not make two identical pictures communicate different meanings.
- Keep question scene pictures outside the bubble on the right; answer scene pictures outside on the left. Preserve the teacher and learner identities.
- Keep each dialogue on one horizontal row: teacher wolf, question bubble, question picture; then answer picture, answer bubble, student. Do not put the speaker avatar above the sentence.
- Automated coverage tests do not prove that learners can infer the intended meaning. Do not claim picture-only comprehension was validated without that review.
