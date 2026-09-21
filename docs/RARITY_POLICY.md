# Word collection tiers

Course topic frequency is not general-English frequency or language difficulty.
A transport chapter must not change train's tier; a weather chapter must not
change winter's tier. Course counts control the existing practice order only.
The profile labels that order explicitly as course order.

## External benchmark and Foundation

Foundation sits below the seven prestige ranks. The initial vocabulary mapping
uses published general-English levels, not percentiles within our question bank:

- Foundation: A1 everyday building blocks, including city, train and winter.
- Bronze: A2 everyday range.
- Silver: B1 independent vocabulary.
- Gold: B2 broader vocabulary.
- Platinum and Diamond: reserved for authored advanced expression challenges.
- Mythic and Legendary: reserved for nuance, register, and natural sophisticated
  usage supported by contextual and productive assessment.

This is a product mapping of external evidence, not a CEFR certification. CEFR
vocabulary levels are not numeric worldwide frequency ranks. Oxford's lists are
based on broad corpora, relevance and expert review. Do not claim that these
levels represent a single universal spoken-English frequency order.

`src/learning/wordBenchmarks.ts` records the published level, source URL, reviewed
lemma/inflection, taught sense and review date for the current lessons. The fixed
collection edition in `src/content/collectionCatalogue.v1.json` pins membership;
`wordRarity.ts` reads that edition. See `docs/COLLECTION_CATALOGUE.md`.
Specific meaning evidence takes precedence over a broad headword list: Cambridge
rates paper notebooks and paper folders A2; do not substitute a computer sense.
Do not stem arbitrary new words or infer a compound's level from its components.

## Review and assessment gates

1. Review the actual meaning and part of speech with Oxford or Cambridge evidence.
   A frequency number must also record its external corpus, version, lemma/sense
   and method. Never manufacture a global number from story counts.
2. Review question format separately: vocabulary recognition is visible English
   to four Thai meanings; particles use self-contained visible context. No
   story-recall blanks with multiple equally valid people or objects.
3. Word-level records currently cover basic course meanings. Before advanced
   senses are introduced, add sense/expression IDs and assessment evidence so
   one sophisticated meaning cannot upgrade all uses of a common word.
4. Recognizing a translation does not establish advanced natural usage. A C1/C2
   dictionary label alone cannot award Platinum, Diamond, Mythic or Legendary.
   Add appropriate usage challenges, earning rules and feedback first.
5. Unsupported words remain unranked with a recorded review reason. A word's
   absence from a short reference list does not make it rare or advanced.
6. Reclassification never removes collected words or earned levels. Foundation
   and unranked words still count toward existing collection progress.
7. Discovery slots use the externally supported tier above the learner's focus.
   They remain occasional and revisit unfinished discoveries. If no suitable
   rated candidate exists, keep ordinary practice.

## Current audit (2026-09-20)

All 118 current lesson targets have either a supported rating or an explicit pending reason.
114 have a Foundation–Gold rating. Four remain unranked:

- birdwatching and treehouses: no published level verified for the taught sense.
- corn: the verified Cambridge B1 label applies to UK grain, not the maize sense
  taught here; transferring it would misrepresent the source.
- nest: Oxford lists the noun at C1, but the current exercise only tests literal
  translation recognition and cannot substantiate advanced usage.

No current question awards the four upper tiers. Do not promote basic content
just to fill the trophy case. Recheck this audit when the content bank changes.
These lesson counts are coverage figures, never collection capacities. Tier
capacities come from the fixed edition and include words without lessons yet.

## Primary references

- [Oxford's corpus and vocabulary selection method](https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000)
- [Oxford 3000 by CEFR level](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf)
- [Oxford 5000 additional words by CEFR level](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_5000_by_CEFR_level.pdf)
- [Cambridge paper notebook](https://dictionary.cambridge.org/us/dictionary/english/notebook)
- [Cambridge paper and computer folder](https://dictionary.cambridge.org/dictionary/english/folder)
- [Cambridge thunder](https://dictionary.cambridge.org/us/dictionary/english/thunder)

Other individual dictionary references are stored alongside the relevant word in
`wordBenchmarks.ts`. Source levels are facts; dictionary definitions and examples
are not copied into the exercises.
