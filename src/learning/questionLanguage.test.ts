import { expect, it } from 'vitest'
import { examPracticeQuestions } from './examPracticeContent'

// A narrow regression check for wording rejected in learner review.
// Passing this does not replace reviewing the language and answer meaning.
it('does not put rejected academic instructions or definition tails back into learner questions', () => {
  const rejected = /explicitly reject|central contrast|contrast is central|which interval|which claim goes beyond|which statement is supported|which statement matches|compared with|what does .+ describe|the text only says|four-wheeled|bathroom fixture|basin with (?:a )?taps?|:\s*(?:the|a|an|my)\s+_____/i
  for (const question of examPracticeQuestions) {
    for (const text of [question.prompt, ...question.choices]) {
      expect(text, question.id).not.toMatch(rejected)
    }
  }
})
