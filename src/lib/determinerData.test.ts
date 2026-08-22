import { describe, expect, it } from 'vitest'
import { buildDeterminerData } from './determinerData'

describe('determiner data', () => {
  it('keeps word-form counts and labels each determiner D', () => {
    const result = buildDeterminerData({
      totalWords: 9,
      uniqueWords: 5,
      ranking: [
        { word: 'the', count: 3 },
        { word: 'glass', count: 2 },
        { word: 'her', count: 2 },
        { word: 'my', count: 1 },
        { word: 'shines', count: 1 },
      ],
    })

    expect(result).toEqual([
      { word: 'the', pos: 'D', count: 3 },
      { word: 'her', pos: 'D', count: 2 },
      { word: 'my', pos: 'D', count: 1 },
    ])
  })

  it('uses the project’s narrow D category', () => {
    const result = buildDeterminerData({
      totalWords: 12,
      uniqueWords: 8,
      ranking: [
        { word: 'all', count: 2 },
        { word: 'its', count: 2 },
        { word: 'less', count: 2 },
        { word: 'little', count: 2 },
        { word: 'much', count: 1 },
        { word: 'no', count: 1 },
        { word: 'such', count: 1 },
        { word: 'what', count: 1 },
      ],
    })

    expect(result).toEqual([
      { word: 'all', pos: 'D', count: 2 },
      { word: 'its', pos: 'D', count: 2 },
    ])
  })
})
