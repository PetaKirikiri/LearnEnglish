# Exam alignment audit — 21 September 2026

**Verified coverage: 64/64 supplied vocabulary entries, all 10 listed place relations, the photographed dialogue patterns, and both reading texts.** Depth and learner evidence are measured separately below.

## Coverage against the supplied pages

| Supplied scope | Verified content | Result |
|---|---|---|
| Ch. 3 vocabulary p.34 | bathroom, bedroom, dining room, kitchen, living room, bathtub, dresser, table, refrigerator, couch | 10/10 |
| Ch. 3 vocabulary p.36 | armchair, bed, closet, clothes, lamp, mirror, shower, sink, stove, toilet | 10/10 |
| Ch. 3 vocabulary p.38 | apartment, river, farm, cave, inside, outside, countryside, city | 8/8 |
| Ch. 3 vocabulary p.40 | door, garden, roof, stairs, window, television, yard, wall | 8/8 |
| Ch. 4 vocabulary p.46 | morning, afternoon, today, tomorrow, evening, night, practice, weekend | 8/8 |
| Ch. 4 vocabulary p.48 | wake up, go to sleep/bed, get dressed, brush my teeth, make my bed, pack my bag, go to practice, do my homework, play a game, clean my room | 10/10 |
| Ch. 4 vocabulary p.50 | plane, taxi, car, subway, bus, bicycle/bike, train, fly, drive, ride | 10/10 |
| Dialogue pp.34,36,37 | What is that / What are these/those; What is in / What's in; Where; There is/are; noun number; listing two objects with both…and | 48 questions |
| Grammar pp.40–41 | under, behind, in front of, between, beside, above, on, in, over, next to | 40 visible scenes across ten relations |
| Reading p.39 | Different Houses | Full passage retained; 33 questions |
| Reading p.51 | A Train above You | Full passage retained; 39 questions |

Vocabulary totals **64 textbook entries**, with **66 question targets** because bicycle/bike and go to bed/go to sleep each receive independent practice. Go to bed and go to sleep have distinct Thai meanings rather than being presented as exact synonyms.

The photos show page 36 explicitly; the other page assignments use the user's outline and book sequence. Images 1 and 2 duplicate a vocabulary page. Some surrounding page content, printed comprehension questions and listening scripts are outside the photo crops. Completeness means the visible supplied scope, not unseen textbook material.

## Depth and skill evidence

The earlier **8.8/10** was an editorial alignment score, not a measure of Fifa's readiness. It is superseded here by explicit coverage and evidence checks; question count alone is not a readiness score.

| Section | Practice | Reserved | What varies |
|---|---:|---:|---|
| Vocabulary | 198 | 66 | Each of 66 targets has Thai meaning recognition, English definition matching and a contextual cloze; a fourth prompt is reserved. |
| Dialogue | 32 | 16 | Room/object substitutions test response function, agreement, demonstratives, location and contents. |
| Grammar | 30 | 10 | All ten relations use ball, apple and book scenes in practice; the book view reverses horizontal orientation. Cube scenes are reserved. |
| Reading | 48 | 24 | Original excerpt questions plus different operations using full source paragraphs: detail, reference, sequence, comparison, inference and limits of a claim. |
| **Total** | **308** | **116** | **424 authored questions** |

All 64 listed vocabulary entries are present, with the two printed alternative forms represented separately. Definitions introduce supporting English beyond the word lists; all visible English tokens and help-example tokens have Thai word help. This does not make every supporting word a separate syllabus target.

The existing profile now shows targets encountered and targets demonstrated independently. Demonstrated means three distinct practice examples for vocabulary/position or two for dialogue/reading, across at least two rounds, since the last wrong or assisted answer. Repeating one question cannot satisfy this. Legacy counters cannot establish independent success. These are transparent product criteria, not a validated pass prediction.

A separate 40-question check draws exactly ten unseen questions and distinct targets per section. Reserved IDs are excluded from normal practice. Starting a check reserves its questions in the learner's existing database event stream; an incomplete check resumes with the same choices. Correctness, word help and completed-answer audio are withheld until completion. Results show all four section scores. There is currently enough reserved grammar material for **one completely unseen 40-question check per learner**. After that, the app does not falsely label recycled questions as fresh; ordinary practice continues.

The passages are the textbook passages, not unseen reading passages. Grammar drawings still share a box-based visual model; they do not prove transfer to every real-world scene. The teacher's exact questions, listening scripts, spelling demands and uncropped comprehension exercises are unavailable. No claim is made that practice-bank completion guarantees an exam mark.

## Ambiguity audit and fixes

- Removed the awkward verbal position clues. Every place question now has a picture in the existing question card and a simple cloze. Behind uses occlusion; in front uses the reverse paint order; between shows two boxes; in uses an open container; on shows contact; above shows a gap; over shows a crossing path.
- Above/over and beside/next to never compete in a single answer list because their meanings can overlap.
- The in-front picture's distractors are behind, under and between; all fail the displayed scene.
- Dialogue alternatives test the response type and agreement. The listing question uses **both … and**, preventing an equally valid **or** answer.
- Reading answers are grounded in displayed excerpts; questions ask what the passage says or supports, not what could happen in real life. Alternatives were reviewed for unique correctness.
- Vocabulary distractors have distinct Thai senses. Options are shuffled; the correct answer is not fixed in the first position.
- Blank audio contains silence. Non-blank dialogue/reading audio says only the question before selection, not the answer. No full Thai translation is displayed before answering.

## What Fifa will actually receive

The common learner scheduler draws only the 308 practice questions from this syllabus. Reserved assessment questions never enter normal practice. Each ten-question block includes all four sections; each four blocks gives ten questions per section. Two slots per block are available for mistake repair, with remaining slots prioritising unseen content and balancing target exposure. Old learner progress remains intact. Current account events are merged into scheduling memory at round boundaries.

A 2,000-answer all-correct simulation reached all 308 practice questions by block 79, with 500 questions from each section. A separate all-wrong simulation also reached every practice question within 200 blocks, proving repeated errors cannot permanently starve unseen content. These simulations do not predict how many sessions Fifa will need.

## Release verification

- **169 automated tests passed.** Checks cover unique scoring keys, all supplied targets, four choices, source evidence, overlapping-sense exclusions, silent gaps and audio assets, holdout isolation, error-heavy scheduling, independent evidence, incomplete assessment recovery, and all 40 assessment steps without answer leakage.
- Production build, test type check and lint passed.
- Live language audit: **811/811 English tokens** have Thai meanings and word profiles; 297 missing records added. Added noun/verb families support the new contexts.
- **424/424 active answer keys and Thai question explainers** are checked against current authored content in the account database.
- **616 new audio clips**, 1,322 total course clips, use the established neural voice and silent blank treatment.
- The existing dark-and-gold exercise and collection remain. Only a compact exam progress section inside the profile, neutral assessment selection, and object variations were added.

No real learner answers were fabricated for verification. Assessment scoring is a practice diagnostic; the actual school paper remains unseen.
