import type { WordData } from './wordData'

export type DeterminerCount = {
  word: string
  pos: 'D'
  count: number
}

const determinerWords = new Set([
  'a',
  'all',
  'an',
  'another',
  'any',
  'both',
  'each',
  'either',
  'enough',
  'every',
  'few',
  'fewer',
  'her',
  'his',
  'its',
  'many',
  'more',
  'most',
  'my',
  'neither',
  'our',
  'several',
  'some',
  'that',
  'the',
  'their',
  'these',
  'this',
  'those',
  'whatever',
  'which',
  'whichever',
  'whose',
  'your',
])

export function buildDeterminerData(wordData: WordData) {
  return wordData.ranking
    .filter(({ word }) => determinerWords.has(word))
    .map(({ word, count }): DeterminerCount => ({ word, pos: 'D', count }))
}
