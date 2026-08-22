import type { Reading } from '../content/readings'

export type WordCount = {
  word: string
  count: number
}

export type WordData = {
  totalWords: number
  uniqueWords: number
  ranking: readonly WordCount[]
}

type PersistedWordData = WordData & {
  sourceSignature: string
}

const storageKey = 'fifa-english:word-data:v3'
const emailPattern = /\b[^\s@]+@[^\s@]+\b/gu
const numericOrdinalPattern = /\b\d+(?:st|nd|rd|th)\b/giu
const timeAbbreviationPattern = /\b[ap]\.m\./giu
const wordPattern = /\p{L}+(?:[’']\p{L}+)*/gu

function normalizeWord(word: string) {
  return word.toLocaleLowerCase('en').replaceAll('’', "'")
}

export function parseWords(text: string) {
  const cleanedText = text
    .replace(emailPattern, ' ')
    .replace(numericOrdinalPattern, ' ')
    .replace(timeAbbreviationPattern, ' ')

  return Array.from(
    cleanedText.matchAll(wordPattern),
    ([word]) => normalizeWord(word),
  ).filter((word) => word === 'a' || word === 'i' || word.length > 1)
}

export function buildWordData(readings: readonly Reading[]): WordData {
  const counts = new Map<string, number>()

  for (const reading of readings) {
    const storyText = [reading.title, ...reading.paragraphs].join('\n')

    for (const word of parseWords(storyText)) {
      counts.set(word, (counts.get(word) ?? 0) + 1)
    }
  }

  const ranking = Array.from(counts, ([word, count]) => ({ word, count })).sort(
    (left, right) => right.count - left.count || left.word.localeCompare(right.word),
  )

  return {
    totalWords: ranking.reduce((total, { count }) => total + count, 0),
    uniqueWords: ranking.length,
    ranking,
  }
}

function createSourceSignature(readings: readonly Reading[]) {
  return JSON.stringify(
    readings.map(({ id, title, paragraphs }) => [id, title, paragraphs]),
  )
}

export function loadOrBuildWordData(
  readings: readonly Reading[],
  storage: Pick<Storage, 'getItem' | 'setItem'> = window.localStorage,
) {
  const sourceSignature = createSourceSignature(readings)
  const savedValue = storage.getItem(storageKey)

  if (savedValue) {
    try {
      const saved = JSON.parse(savedValue) as PersistedWordData

      if (saved.sourceSignature === sourceSignature) {
        return saved
      }
    } catch {
      // Rebuild invalid local data from the canonical stories below.
    }
  }

  const wordData = buildWordData(readings)
  const persisted: PersistedWordData = { sourceSignature, ...wordData }
  storage.setItem(storageKey, JSON.stringify(persisted))
  return persisted
}
