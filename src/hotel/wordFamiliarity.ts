import { normalizeHelpWord } from '../learning/helpPoints'

export type WordFamiliarity = Record<string, { seen: number; strength: number }>
export const wordMemoryKey = (userId: string) => `hotel:words:v1:${userId}`
export function loadWordFamiliarity(userId: string): WordFamiliarity {
  try {
    const raw = JSON.parse(localStorage.getItem(wordMemoryKey(userId)) ?? '{}')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    return Object.fromEntries(Object.entries(raw).filter(([word, value]) => {
      const item = value as WordFamiliarity[string] | null
      return /^[a-z]+(?:'[a-z]+)*$/.test(word) && item && Number.isInteger(item.seen) && item.seen >= 0 && Number.isInteger(item.strength) && item.strength >= 0 && item.strength <= 8
    })) as WordFamiliarity
  } catch { return {} }
}
export function recordWordExposure(memory: WordFamiliarity, sentence: string, correct: boolean, assisted: boolean): WordFamiliarity {
  const result = { ...memory }
  // One exposure per distinct word per completed question, not per render/replay.
  const words = new Set((sentence.match(/[\p{L}]+(?:[’'][\p{L}]+)*/gu) ?? []).map(normalizeHelpWord))
  for (const word of words) {
    const prior = memory[word] ?? { seen: 0, strength: 0 }
    result[word] = { seen: prior.seen + 1, strength: !correct ? Math.max(0, prior.strength - 2) : assisted ? prior.strength : Math.min(8, prior.strength + 1) }
  }
  return result
}
export function wordOpacity(memory: WordFamiliarity, word: string): number {
  const item = memory[normalizeHelpWord(word)]
  if (!item || item.seen < 3) return 1
  return 1 - Math.max(0, Math.min(6, item.strength - 2)) * 0.125
}
