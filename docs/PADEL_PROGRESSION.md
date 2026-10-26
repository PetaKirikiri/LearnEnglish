# Padel teaching sequence

`src/padel/progression.ts` is the shared stage map for the learner selector,
content table and progress bar. Do not independently sort the table by topic.
Every pair must belong to exactly one stage; unmapped/duplicate content fails
at module load and in tests. Existing question/audio IDs are unchanged.

The `nodeIds` reference the existing shared curriculum catalogue
(`src/curriculum/syllabus.snapshot.json`), whose sources include the British
Council / Eaquals Core Inventory and English Profile. These are locally
authored stages informed by that reference, not verified descriptor-level
alignment, a complete A1/A2 syllabus, or a CEFR qualification.

## Route

1. People and court equipment: player/coach, racket/ball, net/court.
2. Number and ownership, transferring across familiar nouns.
3. Playing/waiting and I/you/we.
4. Positive/negative.
5. Places and directions, including same-person here/there contrasts.
6. More people and owners.
7. Short requests.
8. Now/routine and can/cannot.
9. Times and durations.
10. Planned, happening and completed.
11. Bookings and player numbers.
12. Hire and payment.
13. Court access, rain and rules.
14. Who/what and where/when.
15. Why/how and duration/number.

The first unfinished stage is active. Its two lanes alternate; completed lanes
yield time to the unfinished lane. Once earlier stages exist, every fourth
question reviews them, preferring the least recently answered item.
An incorrect review reactivates the earlier stage. The Question Words topic
filters the content view but cannot bypass the teaching prerequisites.

## Evidence, not encounters

Each individual question (including both alternatives of each contrast) needs
three consecutive unassisted correct answers, including at least one audio-only
answer. After two supported successes the next attempt hides the English and
icons. "Show words" or word help prevents that attempt counting as mastery.
Wrong/assisted answers reset that question's streak. The selector balances
attempts across examples and avoids immediately repeating the same item.
This is an operational progression gate, not a claim that binary guessing is
impossible or that speaking/pronunciation proficiency has been measured.

Stored historical encounter IDs and totals are retained but cannot stand in
for the new per-question evidence. Progress remains in the existing
learner-scoped Padel local storage; this change does not introduce cloud sync.
No Hotel/English/Pilates progression or identity handling is changed.

Verification: `npx vitest run src/padel src/fimo src/hotel/HotelPage.test.tsx
src/hotel/HotelContentPage.test.tsx` and `npm run build`.
