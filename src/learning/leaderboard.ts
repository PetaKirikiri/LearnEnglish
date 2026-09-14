import { PETA_ACCOUNT_ID } from '../auth/appAccess'
import { getQuizCatalogue } from './quizContent'
import { questionProgressKey, summarizeProgress, type ProgressEvent } from './progressData'

const catalogue = getQuizCatalogue()
const wordKeys = new Set(catalogue.vocabulary.map(questionProgressKey))
const sentenceKeys = new Set(catalogue.sentences.map(questionProgressKey))
export function buildLeaderboard(learners: { id: string; display_name: string }[], events: ProgressEvent[]) {
  const grouped = new Map<string, ProgressEvent[]>()
  for (const event of events) {
    const list = grouped.get(event.learner_id) ?? []
    list.push(event)
    grouped.set(event.learner_id, list)
  }
  const rows = learners.filter(learner => learner.id !== PETA_ACCOUNT_ID).map(learner => {
    const summary = summarizeProgress(grouped.get(learner.id) ?? [])
    let words = 0, sentences = 0, correct = 0, wrong = 0
    for (const [key, item] of summary.items) {
      if (!wordKeys.has(key) && !sentenceKeys.has(key)) continue
      correct += item.correct
      wrong += item.wrong
      if (item.status === 'Learned') {
        if (wordKeys.has(key)) words++
        else sentences++
      }
    }
    return { ...learner, words, sentences, learned: words + sentences, attempts: correct + wrong,
      accuracy: correct + wrong ? correct / (correct + wrong) : 0, rounds: summary.rounds }
  }).filter(row => row.attempts > 0)
  rows.sort((a, b) => b.learned - a.learned || b.accuracy - a.accuracy || a.display_name.localeCompare(b.display_name) || a.id.localeCompare(b.id))
  let rank = 0
  return rows.map((row, index) => {
    const previous = rows[index - 1]
    if (!previous || row.learned !== previous.learned || row.accuracy !== previous.accuracy) rank = index + 1
    return { ...row, rank }
  })
}
