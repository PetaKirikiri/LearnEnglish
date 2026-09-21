# Fixed word collections

Edition: `2026-09-v1`. Membership is saved in
`src/content/collectionCatalogue.v1.json`, separately from questions and stories.

| Collection | Fixed capacity |
| --- | ---: |
| Foundation | 918 |
| Bronze | 801 |
| Silver | 692 |
| Gold | 603 |
| Unranked | 4 |
| Total | 3,018 |

The four upper tiers remain unpublished. Their member lists and advanced usage
assessment must be reviewed before a capacity or progress fraction is shown.

## Meaning of the counter

Bronze `1 / 801` means one word earned from a fixed 801-word collection. It does
not mean 801 lessons exist. All members are browsable and searchable, with
collected, practising, and unseen states. Words without questions display
"Not in lessons yet". Question availability is independent of membership.

Adding, removing or duplicating questions must not change any tier capacity.
New lesson targets outside this edition remain unranked and do not extend ranked
capacities. Publish an explicit reviewed edition to add or reclassify members.
Do not silently regenerate the edition from the currently loaded course.

## Source and normalization

The base is the Oxford 3000 by CEFR level, retrieved 2026-09-20:
https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf

This file contributes 2,978 distinct normalized written forms after combining
repeated headwords, senses and parts of speech. Names are lowercased to match
progress keys, homograph numbers and explanatory parentheses are removed,
multiword entries retain spaces, and the printed a/an pair is split. A form
appearing at multiple levels uses its earliest listed level for this basic-word
collection; it cannot earn a second advanced-sense award without a separate ID.
No definitions or example sentences are reproduced.

The existing reviewed course forms and Cambridge sense-specific adjustments
from `wordBenchmarks.ts` are pinned into the edition. This preserves existing
word identities such as cities and city; inflections are not silently merged
and earned progress is not migrated or discarded. The resulting edition has
3,018 members. Its totals are a product catalogue, not Oxford's official counts
or a claim about all vocabulary in English.

Source selection rationale:
https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000

## Validation

Regression tests pin the capacities and uniqueness of members, verify that
question-bank changes leave them unchanged, and check that earning one word
changes the numerator without earning unplayed words or changing the denominator.
Current lessons remain the only source of practice questions; catalogue-only
entries never create fake questions or evidence of learning.
