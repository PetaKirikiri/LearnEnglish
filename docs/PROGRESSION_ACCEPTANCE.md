# Local practice acceptance

Run `npm run test:gui` and open http://127.0.0.1:5200/practice-test.html,
or run `npm run test:acceptance` in a terminal. These use local CPU, no AI,
speech credits or real learner writes. Stop in the page ends the test process group.

The main serving code is `src/race/blueprintWordServer.ts`. Stable construction
requests live in `src/learning/sentenceRules/practiceBlueprintRequest.ts`.
The main long-walk test is `src/race/testing/progressionAcceptance.ts`.

## Serving contract

1. Read account-wide Current, Learnt and review state.
2. Pick the word to test, balancing the current words/types.
3. Use that word as an anchor: noun → compatible verbs, verb → compatible
   subjects/objects, determiner → agreeing noun → compatible verbs/subjects,
   adjective → compatible noun, or pronoun → compatible action.
4. Use the existing subject/object groups, verb frames, affordances and agreement
   functions to resolve the other slots. Only eligible context words can be used.
5. Resolve a compatible foil changing one semantic slot; agreement may follow.
6. Compose only that question/foil pair. A phone stores the current question
   snapshot for refresh; it does not prebuild the next 30 questions.
7. Server registration reconstructs the same reviewed ingredients from a bounded
   recipe. Client-supplied answers/credit are ignored. Receipts remain background
   work and failed deliveries retain the recipe in the outbox.

There is no sentence-bank generation or scan in serving. Legacy banks remain
only for explicit historical audits and old pending receipt IDs without a recipe.
Scheduled audio preparation uses the same slot server with hypothetical future
state; it never credits or unlocks queued words in the real account.

## What the tests require

- Sentence-bank entry points throw if the real phone/classroom selector calls
  them, even if a bank might already be cached.
- At most one question/foil pair is composed per selection, including the full
  fresh progression walk through later learner states.
- All six lessons share the same account frontier. Structure dictates eligible
  slots and direct-object / `to` frames; words cannot invent a new preposition.
- Every served sentence and foil obey subject/action, verb/object, adjective/noun,
  determiner/countability and auxiliary agreement rules.
- Every ingredient recipe reconstructs to the exact server ID, sentence, answer
  and credit without a catalogue lookup.
- Presentation earns +1, a correct focused answer adds +2, and Learnt is full
  fade at 25. Current slots refill without a separate confirmation gate.
- All currently supported words progress from an empty account; unsupported
  verbs stay waiting for a future blueprint. The learnt-water / unfinished-drinking
  regression must finish without targeting water again.
- Real phone rendering, thirty answers, refresh, account isolation, one-time
  presentation, receipt transport and forecast immutability are checked too.

`reports/full-progression-audit.json` contains the latest completed walk and
selection timings. A failure stops the command with a nonzero exit; a previous
correctness result is not evidence that a different serving implementation passes.
`npm run test:progression` runs just the guarded fresh walk. The full command first
checks the architecture and focused regressions, then runs that same walk.
