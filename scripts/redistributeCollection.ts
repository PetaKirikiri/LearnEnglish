import { writeFileSync } from 'node:fs'
import previous from '../src/content/collectionCatalogue.v1.json'
import young from '../src/content/youngLearnerBenchmarks.v2.json'
import review from '../src/content/collectionReview.v2.json'

const ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Mythic', 'Legendary', 'Unranked'] as const
type Rank = typeof ranks[number]
// Historical edition is an immutable baseline, not the runtime catalogue.
const baseline: Record<string, Rank> = { Foundation:'Silver', Bronze:'Silver', Silver:'Gold', Gold:'Platinum', Platinum:'Diamond', Diamond:'Diamond', Mythic:'Mythic', Legendary:'Legendary', Unranked:'Unranked' }
const youth = young.words as Record<string, { level: string; page: number }>
const overrides = new Map(review.groups.flatMap(group => group.words.map(word => [word, group] as const)))
const tiers = Object.fromEntries(ranks.map(rank => [rank, [] as string[]])) as Record<Rank, string[]>
const audit: string[][] = [['word','previous_rank','rank','reason','source','page']]
const allWords = new Set(Object.values(previous.tiers).flat())
for (const word of overrides.keys()) if (!allWords.has(word)) throw new Error(`Review contains unknown word: ${word}`)
for (const [oldTier, words] of Object.entries(previous.tiers)) for (const word of words) {
  let tier = baseline[oldTier]
  let reason = 'Baseline general-English range, retained unless child vocabulary or meaning review supplies a better placement.'
  let source = previous.source
  let page = ''
  if (youth[word] && oldTier !== 'Unranked') {
    tier = youth[word].level === 'A2' ? 'Silver' : 'Bronze'
    reason = `Young-learner ${youth[word].level} basic meaning; game rank selected for child familiarity.`
    source = young.source
    page = String(youth[word].page)
  }
  const override = overrides.get(word)
  if (override) { tier = override.tier as Rank; reason = override.reason; source = 'collectionReview.v2.json'; page = '' }
  if (!tier) throw new Error(`Missing review for ${word}`)
  tiers[tier].push(word)
  audit.push([word, oldTier, tier, reason, source, page])
}
for (const words of Object.values(tiers)) words.sort()
const output = { version:review.version, sources:[previous.source, young.source], review:'collectionReview.v2.json', tiers }
writeFileSync('src/content/collectionCatalogue.v2.json', JSON.stringify(output, null, 2) + '\n')
const cell = (value: string) => `"${value.replaceAll('"','""')}"`
writeFileSync('docs/collection-redistribution-v2.csv', audit.map(row => row.map(cell).join(',')).join('\n') + '\n')
console.log(Object.fromEntries(Object.entries(tiers).map(([tier, words]) => [tier, words.length])))
