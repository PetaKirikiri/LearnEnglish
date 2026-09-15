export const WORD_HELP_COST = 2
export const QUESTION_POINTS = 10
export function normalizeHelpWord(word: string) { return word.trim().toLowerCase().replaceAll('’', "'") }
export function availableQuestionPoints(words: readonly string[]) {
  return Math.max(0, QUESTION_POINTS - new Set(words.map(normalizeHelpWord).filter(Boolean)).size * WORD_HELP_COST)
}
