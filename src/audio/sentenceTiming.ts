export type SpokenWord = {start: number; end: number}
export type TimedWord = SpokenWord & {text: string; startTime: number; endTime: number}
export type SentenceTiming = {version: 1; text: string; words: TimedWord[]}

const wordsIn = (text: string) => [...text.matchAll(/[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu)]
const seconds = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0

/** Offsets refer to the displayed text, including repeated words and apostrophes. */
export function parseSentenceTiming(value: unknown, text: string): SentenceTiming | null {
  if (!value || typeof value !== 'object') return null
  const timing = value as SentenceTiming
  const expected = wordsIn(text)
  if (timing.version !== 1 || timing.text !== text || !Array.isArray(timing.words) || timing.words.length !== expected.length || !expected.length) return null
  let previousStart = 0
  for (const [index, word] of timing.words.entries()) {
    const match = expected[index]
    if (!word || word.text !== match[0] || word.start !== match.index || word.end !== match.index! + match[0].length ||
        !seconds(word.startTime) || !seconds(word.endTime) || word.endTime < word.startTime || word.startTime < previousStart) return null
    previousStart = word.startTime
  }
  return timing
}

/** ElevenLabs returns character timings. Reject changed text instead of guessing a match. */
export function timingFromAlignment(text: string, value: unknown): SentenceTiming | null {
  if (!value || typeof value !== 'object') return null
  const alignment = value as {characters?: unknown; character_start_times_seconds?: unknown; character_end_times_seconds?: unknown}
  const characters = alignment.characters, starts = alignment.character_start_times_seconds, ends = alignment.character_end_times_seconds
  if (!Array.isArray(characters) || !Array.isArray(starts) || !Array.isArray(ends) || !characters.length ||
      characters.length !== starts.length || characters.length !== ends.length ||
      characters.some(char => typeof char !== 'string' || !char.length) || characters.join('') !== text) return null
  const offsets: number[] = []
  let offset = 0, previousStart = 0
  for (let index = 0; index < characters.length; index++) {
    if (!seconds(starts[index]) || !seconds(ends[index]) || ends[index] < starts[index] || starts[index] < previousStart) return null
    previousStart = starts[index]
    for (let char = 0; char < characters[index].length; char++) offsets[offset++] = index
  }
  return parseSentenceTiming({version: 1, text, words: wordsIn(text).map(match => ({
    text: match[0], start: match.index!, end: match.index! + match[0].length,
    startTime: starts[offsets[match.index!]], endTime: ends[offsets[match.index! + match[0].length - 1]],
  }))}, text)
}

export function wordAtTime(timing: SentenceTiming, time: number): SpokenWord | null {
  const word = timing.words.find(word => word.startTime <= time && time < word.endTime)
  return word ? {start: word.start, end: word.end} : null
}

export function wordAtCharacter(text: string, index: number): SpokenWord | null {
  const match = wordsIn(text).find(word => word.index! <= index && index < word.index! + word[0].length)
  return match ? {start: match.index!, end: match.index! + match[0].length} : null
}
