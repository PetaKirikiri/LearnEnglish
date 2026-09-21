// Source-backed ratings for the basic meanings currently taught; not global
// frequency ranks or certifications of a learner's overall proficiency.
export type VocabularyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export const BENCHMARK_SOURCES = {
  oxford3000: 'https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf',
  oxford5000: 'https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_5000_by_CEFR_level.pdf',
} as const
export type WordBenchmark = { level: VocabularyLevel; source: string; lemma: string; sense: string; checkedAt: string }
const benchmarks = new Map<string, WordBenchmark>()
// Explicit inflections only. Never guess a new word's rating by stripping endings.
const lemmas: Record<string, string> = {
  are:'be', is:'be', was:'be', does:'do', these:'this', apartments:'apartment',
  buses:'bus', cars:'car', cats:'cat', cities:'city', friends:'friend', houses:'house',
  pencils:'pencil', photographs:'photograph', questions:'question', stars:'star',
  streets:'street', sweaters:'sweater', farms:'farm', hills:'hill', rocks:'rock',
  storms:'storm', tracks:'track', woods:'wood', supplies:'supply', suburbs:'suburb',
}
function add(words: string, level: VocabularyLevel, source: string, sense: string) {
  for (const word of words.split(/\s+/).filter(Boolean)) {
    benchmarks.set(word, { level, source, lemma: lemmas[word] ?? word, sense, checkedAt:'2026-09-20' })
  }
}
add('a and are at because before but by do does for from her in is its me my of our the them these they this to us was we will with your airport apartments beach bird bread brother buses cars cats cheese child cities city cold doctor family father fish food friends grandfather grandmother hobby houses meat morning mother pencils people photographs plane police questions salt school sister stars station streets sun sweaters teacher ticket train trip warm water weather winter farms island midnight traffic', 'A1', BENCHMARK_SOURCES.oxford3000, 'Basic course use; Oxford A1 part of speech. Inflections map to the listed lemma.')
add('diary fishing gate hills ocean pilot platform rocks sauce shape storms temperature tracks woods basketball sky', 'A2', BENCHMARK_SOURCES.oxford3000, 'Concrete noun meaning in the current course.')
add('countryside supplies', 'B1', BENCHMARK_SOURCES.oxford3000, 'Countryside as rural area; supplies as materials/equipment.')
add('cave suburbs', 'B2', BENCHMARK_SOURCES.oxford5000, 'Physical cave; residential area outside a city.')
// Cambridge's explicit paper sense overrides Oxford's broad B2 notebook entry.
const dictionaryEntries: [string, string, VocabularyLevel, string][] = [
  ['notebooks','notebook','A2','Paper book for writing notes, not a computer.'],
  ['elevator','elevator','A2','Lift carrying people between floors.'],
  ['folders','folder','A2','Paper folder, not a computer directory.'],
  ['suitcase','suitcase','A2','Travel luggage.'],
  ['thunder','thunder','B1','Weather sound, not figurative speech or movement.'],
  ['pancakes','pancake','B2','Food.'],
  ['handouts','handout','B2','Printed information given to a class.'],
  ['vinegar','vinegar','B2','Liquid used in food.'],
  ['volcano','volcano','B2','Physical mountain.'],
]
for (const [word, lemma, level, sense] of dictionaryEntries) {
  benchmarks.set(word, { level, source:`https://dictionary.cambridge.org/us/dictionary/english/${lemma}`, lemma, sense, checkedAt:'2026-09-20' })
}
// Evidence exists, but recognition of this concrete noun cannot award an
// advanced-usage tier. Keep the evidence without automatically awarding it.
add('nest', 'C1', BENCHMARK_SOURCES.oxford5000, 'Bird nest; current task is translation recognition only.')
export const PENDING_WORD_RATINGS: Readonly<Record<string, string>> = {
  birdwatching:'No published level verified for this sense.',
  corn:'Cambridge B1 label is for UK grain; the course teaches maize. Do not transfer a different sense rating.',
  nest:'Oxford C1 headword evidence does not establish advanced usage in this recognition exercise.',
  treehouses:'No published level verified for this compound.',
}
export function wordBenchmark(word: string): WordBenchmark | null {
  return benchmarks.get(word.trim().toLowerCase()) ?? null
}
