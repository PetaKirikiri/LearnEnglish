import { describe, expect, it, vi } from 'vitest'
import { readings, type Reading } from '../content/readings'
import { thaiTranslations } from '../content/thaiTranslations.generated'
import { buildWordData, loadOrBuildWordData, parseWords } from './wordData'

const sampleReadings: readonly Reading[] = [
  {
    id: 'sample',
    title: 'Hello World',
    chapter: 1,
    paragraphs: ["Hello, world! It’s a world."],
  },
]

describe('word data', () => {
  it('normalizes case, punctuation, and curly apostrophes', () => {
    expect(parseWords("Bird, BIRD! It’s bird's.")).toEqual([
      'bird',
      'bird',
      "it's",
      "bird's",
    ])
  })

  it('removes email addresses, numbers, and stray single-letter fragments', () => {
    expect(
      parseWords('From bsmith@rres.edu, 3rd grade at 7 a.m. Take the L. I have a book.'),
    ).toEqual(['from', 'grade', 'at', 'take', 'the', 'i', 'have', 'a', 'book'])
  })

  it('counts titles and story text and ranks by frequency', () => {
    expect(buildWordData(sampleReadings)).toEqual({
      totalWords: 7,
      uniqueWords: 4,
      ranking: [
        { word: 'world', count: 3 },
        { word: 'hello', count: 2 },
        { word: 'a', count: 1 },
        { word: "it's", count: 1 },
      ],
    })
  })

  it('persists the result and reuses it while stories are unchanged', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    }

    const first = loadOrBuildWordData(sampleReadings, storage)
    const second = loadOrBuildWordData(sampleReadings, storage)

    expect(second).toEqual(first)
    expect(storage.setItem).toHaveBeenCalledTimes(1)
  })

  it('has a Thai translation for every saved word', () => {
    const wordData = buildWordData(readings)

    expect(
      wordData.ranking.filter(({ word }) => !thaiTranslations[word]),
    ).toEqual([])
  })
})
