// Both answers must come from the words chosen for this race.
export function meaningChoices<T extends { choices: string[]; correct: number }>(questions: T[]): T[] {
  return questions.map((question, index) => {
    const meaning = question.choices[question.correct]
    const other = [...questions.slice(index + 1), ...questions.slice(0, index)].find(q => q.choices[q.correct] !== meaning)
    if (!other) return question
    const choices = [...question.choices]
    choices[1 - question.correct] = other.choices[other.correct]
    return { ...question, choices }
  })
}
