import edition from '../content/collectionCatalogue.v1.json'
import type { WordRarity } from './wordRarity'

// A fixed collection edition. Lesson availability never defines membership.
// Publish an explicit new edition to change these lists; do not build them from
// getQuizCatalogue(), corpus frequencies, or learner activity.
export const COLLECTION_EDITION = edition.version
export const COLLECTION_CATALOGUE = Object.entries(edition.tiers).flatMap(([tier, words]) =>
  words.map(word => ({ word, rarity: tier === 'Unranked' ? null : tier as WordRarity })),
)
export const COLLECTION_TIERS = new Map(COLLECTION_CATALOGUE.map(entry => [entry.word, entry.rarity]))
export const COLLECTION_TOTALS = Object.fromEntries(Object.entries(edition.tiers).map(([tier, words]) => [tier, words.length])) as Record<WordRarity | 'Unranked', number>
