# Local progression acceptance

Run `npm run test:acceptance` on the local computer. This runs the focused checks
then all construction-bank integrity audits, and then the fresh long walk in one invocation. `npm run test:progression` runs
only the long walk. This makes no service calls,
creates no real learner answers and generates no speech. Its learner begins empty.

The long walk calls the existing `nextPersonalQuestion` and `classroomWordQuestion`
entry points, changing lessons after every answer. It saves through `saveEvidence`
and reads the same `learningStates` used by the app. No test selector or substitute
progression algorithm supplies its questions.

Each encounter checks:

- the lesson's construction and account-wide Current frontier;
- the question and both alternatives against reviewed verb frames, object and
  subject affordances, adjective compatibility, determiner and auxiliary agreement;
- aligned displayed words, choice/source correspondence and one semantic change
  (with necessary auxiliary agreement allowed);
- a separate presentation worth one point, followed by a correct focus bonus of
  two, and Learnt exactly at full fade;
- progression to every word supported by the existing blueprints, with unsupported
  verbs explicitly reported as waiting rather than fitted to invented frames;
- noun, verb, adjective, determiner and pronoun contrasts, and both caller paths.

`reports/full-progression-audit.json` records coverage and cold/warm selection times.
The runner uses Node directly because a long synchronous catalogue build could
exceed Vitest's worker reporting timeout. Assertions are identical in the optional
Vitest wrapper. A failed assertion or incomplete traversal returns a nonzero exit.

Focused companion tests cover empty entry in all six lessons, the learnt-water /
unfinished-drinking case, actual question rendering, refresh/deduplication, and
negative examples proving that the blueprint observer rejects invalid sentences.
Run these with:

```
npx vitest run src/race/adaptiveExposureRegression.test.ts \
  src/race/testing/blueprintIntegrity.test.ts src/race/GeneratedPractice.test.tsx \
  src/learning/wordProgress/learningLifecycle.test.ts \
  src/learning/wordProgress/store.test.ts --maxWorkers=1 --testTimeout=30000
```

The observer lives only in test code. Production selection, candidate caches,
background receipts, database scoring and sentence blueprints are unchanged by
this acceptance-test change. Cold construction and warm selection are measured
separately; a fast warm result does not establish that cold construction happens
only once.

## Local control page

Run `npm run test:gui`, then use http://127.0.0.1:5200/practice-test.html.
The page starts/stops the same local acceptance command and shows live output,
counts, elapsed time and the final result. It is available only on this computer
and is excluded from the production page entries.

Edit `src/race/testing/progressionAcceptance.ts` for the long test,
`src/race/testing/blueprintIntegrity.ts` for sentence assertions, or
`practice-test.html` for the control page.
