import { COLLECTION_TIERS } from './collectionCatalogue'

// Course topic counts never determine a tier. See docs/RARITY_POLICY.md.
export const RANKED_RARITIES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Mythic', 'Legendary'] as const
export const RARITIES = ['Foundation', ...RANKED_RARITIES] as const
export type WordRarity = typeof RARITIES[number]
export const RARITY_DESCRIPTIONS: Record<WordRarity, string> = {
  Foundation: 'Everyday building blocks',
  Bronze: 'Everyday range',
  Silver: 'Independent vocabulary',
  Gold: 'Broader, more precise vocabulary',
  Platinum: 'Advanced expression',
  Diamond: 'Flexible, precise expression',
  Mythic: 'Nuance and register',
  Legendary: 'Natural, sophisticated usage',
}
// Product mapping, not a claim that CEFR defines game ranks. Higher tiers also
// need contextual and productive assessment, which the current bank lacks.
export function wordRarity(word: string): WordRarity | null {
  return COLLECTION_TIERS.get(word.trim().toLowerCase()) ?? null
}
