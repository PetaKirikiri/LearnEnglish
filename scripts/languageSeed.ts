// One-time migration seed. Production reads SubtitleDisplay, not these fixtures.
import { readings } from '../src/content/readings'
import { thaiTranslations } from '../src/content/thaiTranslations.generated'
import { lessonThaiTranslations } from '../src/content/lessonThaiTranslations'
import { buildWordData } from '../src/lib/wordData'
const ranking = buildWordData(readings).ranking
const corpus = new Map(ranking.map((row, index) => [row.word, { count: row.count, rank: index + 1 }]))
const words = [...new Set([...corpus.keys(), ...Object.keys(thaiTranslations), ...Object.keys(lessonThaiTranslations)])].sort().map(word => ({
  word, thai_gloss: thaiTranslations[word] ?? null, lesson_thai_gloss: lessonThaiTranslations[word] ?? null,
  corpus_count: corpus.get(word)?.count ?? 0, corpus_rank: corpus.get(word)?.rank ?? null,
}))
console.log(JSON.stringify({ version: 1, words }))
