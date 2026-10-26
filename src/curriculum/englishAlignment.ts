import type { Curriculum, Level } from './schema'

// Teaching bands for the CURRENT English exercises, not proficiency awards.
// Reviewed against BC/Eaquals Core Inventory, printed pp. 10–11. Same forms
// recur at multiple levels: grade the meaning contrast, not the verb spelling.
const bands: { level: Level; topics: [string, string][] }[] = [
  { level: 'A1', topics: [
    ['meeting-names', 'introducing yourself; personal information'],
    ['meeting-origins', 'personal information; asking where someone is from'],
    ['meeting-people', 'introductions; personal pronouns'],
    ['meeting-belongings', 'possessive adjectives; demonstratives'],
    ['first-actions', 'present continuous; personal pronouns'],
    ['first-negatives', 'present simple/continuous negatives'],
    ['be-forms', 'to be, including questions'],
    ['ownership', 'possessives'],
    ['reference', 'demonstratives and reference to familiar objects'],
    ['time-place', 'prepositions of place'],
    ['routine-now', 'present simple versus present continuous'],
    ['negation', 'negative statements with be and present continuous'],
    ['past-state', 'past simple of be'],
    ['past-events', 'past simple versus routine present'],
    ['participants', 'personal subject/object pronouns; previously introduced past simple'],
    ['questions', 'questions; present and past simple'],
    ['request-basics', 'can for requests and permission'],
    ['simple-links', 'connecting ideas with and/but'],
  ] },
  { level: 'A2', topics: [
    ['future', 'future time: will; contrast with current and past events'],
    ['obligation', 'ability and obligation'],
    ['quantity', 'countability and quantifiers'],
    ['comparison', 'comparative relationships'],
    ['sequence', 'sequencing events'],
    ['completion', 'present perfect; contrast with ongoing activity'],
  ] },
  { level: 'B1', topics: [
    ['past-sequence', 'past perfect versus past continuous'],
    ['verb-shapes', 'present/past perfect auxiliary selection'],
    ['verb-complements', 'verb + object + infinitive; participant roles'],
    ['passive', 'simple passive; doer and affected person'],
    ['repair', 'checking understanding; indirect questions'],
    ['possibility', 'deduction and possibility with must/may'],
    ['hypothetical', 'real and second conditional meanings'],
    ['nuance', 'past modal possibility and advice with may/should have'],
  ] },
  { level: 'B2', topics: [
    ['reported', 'reported speech with backshift and time reference'],
    ['relative', 'relative clauses; subject/object roles'],
    ['future-completion', 'future perfect versus future continuous'],
    ['counterfactual', 'unreal present versus past consequences'],
    ['qualification', 'cause versus concession in complex clauses'],
    ['professional-response', 'current options versus past modal alternatives'],
    ['complex-time', 'narrative time across multiple clauses'],
    ['focus', 'scope of only and restricted participants'],
  ] },
]

export const englishAlignment = bands.flatMap(({level, topics}) => topics.map(([id, focus]) => ({id, level, focus})))

export function alignEnglish(skills: Curriculum['skills']): Curriculum['skills'] {
  if (skills.length !== englishAlignment.length || skills.some(s => !englishAlignment.some(a => a.id === s.id)))
    throw new Error('Every English topic needs a reviewed CEFR teaching band')
  return skills.map(skill => {
    const index = englishAlignment.findIndex(a => a.id === skill.id)
    const alignment = englishAlignment[index]
    // Two active topics, then the next pair. Earlier patterns continue in
    // review; none can be bypassed just because a later topic has no parents.
    const pairStart = Math.floor(index / 2) * 2
    return { ...skill, englishOrder: index, englishLevel: alignment.level,
      englishPrerequisites: englishAlignment.slice(Math.max(0, pairStart - 2), pairStart).map(a => a.id),
      englishReferences: [{ sourceId: 'core-inventory', status: 'adapted' as const,
        locator: `Core Inventory, printed pp. 10–11; ${alignment.level}: ${alignment.focus}. Local teaching placement, not an item-level EGP descriptor.` }],
    }
  })
}
