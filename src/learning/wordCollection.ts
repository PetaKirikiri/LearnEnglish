import { wordRarity, type WordRarity } from './wordRarity'
import { questionFrequency, questionWord } from './contentOrder'
import type { QuizQuestion } from './quizContent'
import type { ProgressEvent } from './progressData'
import { buildWordConfidence } from './wordConfidence'
import { COLLECTION_CATALOGUE, COLLECTION_TOTALS, COLLECTION_EDITION } from './collectionCatalogue'

export type CollectionStatus = 'Conquered' | 'Practising' | 'Yet to see'
export type CollectedWord = { word: string; rank: number; rarity: WordRarity | null; status: CollectionStatus; needsReview: boolean; available: boolean }
export const WORDS_PER_LEVEL = 10

export function buildWordCollection(events: readonly ProgressEvent[], questions: readonly QuizQuestion[], now = Date.now()) {
  const ranks = new Map(questions.map(q => [questionWord(q), questionFrequency(q).rank]))
  const words = new Map<string, CollectedWord>(COLLECTION_CATALOGUE.map(entry => [entry.word, {
    ...entry, rank:ranks.get(entry.word) ?? Infinity, status:'Yet to see', needsReview:false, available:ranks.has(entry.word),
  }]))
  for (const evidence of buildWordConfidence(events, questions, now)) {
    const previous = words.get(evidence.word)
    const conquered = Boolean(evidence.conqueredAt) || previous?.status === 'Conquered'
    const seen = Boolean(evidence.lastAnswered || evidence.legacy) || previous?.status === 'Practising'
    words.set(evidence.word, {
      word: evidence.word,
      rank: ranks.get(evidence.word) ?? Infinity,
      rarity: wordRarity(evidence.word),
      status: conquered ? 'Conquered' : seen ? 'Practising' : 'Yet to see',
      needsReview: Boolean(previous?.needsReview || (evidence.conqueredAt && evidence.status === 'Needs review')),
      available: true,
    })
  }
  const ordered = [...words.values()].sort((a, b) => Number(b.available) - Number(a.available) || a.rank - b.rank || a.word.localeCompare(b.word))
  const conquered = ordered.filter(w => w.status === 'Conquered').length
  return { words: ordered, conquered, catalogueTotal:COLLECTION_CATALOGUE.length, tierTotals:COLLECTION_TOTALS, edition:COLLECTION_EDITION, level: 1 + Math.floor(conquered / WORDS_PER_LEVEL), toNextLevel: WORDS_PER_LEVEL - conquered % WORDS_PER_LEVEL }
}
export type WordCollection = ReturnType<typeof buildWordCollection>
