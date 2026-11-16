export const words = ['the', 'a', 'big', 'small', 'dog', 'cat', 'runs', 'sleeps', 'quickly', 'eats', 'fish', 'slowly'] as const
export type Word = typeof words[number]
export type Card = { id: number; word: Word }
export type Kind = 'shield' | 'bow' | 'horse'
export const troops: Record<Kind, { name: string; icon: string; beats: Kind; cost: number }> = {
  shield: { name: 'Guard', icon: '🛡️', beats: 'horse', cost: 6 },
  bow: { name: 'Archer', icon: '🏹', beats: 'shield', cost: 6 },
  horse: { name: 'Rider', icon: '🐎', beats: 'bow', cost: 6 },
}
export function evaluate(input: string[]): { valid: boolean; score: number; reason: string } {
  const text = input.join(' ')
  const noun = '(?:the|a) (?:(?:big|small) )?(?:dog|cat|fish)'
  const phrase = new RegExp(`^${noun}$`).test(text)
  const action = /^(runs|sleeps)( (quickly|slowly))?$/.test(text)
  const sentence = new RegExp(`^${noun} (?:(?:runs|sleeps)(?: (?:quickly|slowly))?|eats ${noun}(?: (?:quickly|slowly))?)$`).test(text)
  if (phrase || (action && input.length > 1) || sentence) return { valid: true, score: input.length ** 2 + (sentence ? 6 : 0), reason: sentence ? 'Complete sentence · +6 bonus' : 'Phrase · keep building or bank it' }
  return { valid: false, score: 0, reason: 'Use a/the + optional big/small + dog/cat/fish. Add runs/sleeps, or eats + another noun phrase. Quickly/slowly goes after the action.' }
}
export function extendsPhrase(old: string[], next: string[]) {
  let i = 0
  for (const word of next) if (word === old[i]) i++
  return next.length > old.length && i === old.length
}
export type Unit = { id: number; kind: Kind; side: 'you' | 'bot'; lane: number; x: number; hp: number }
export type Match = { tick: number; you: number; bot: number; units: Unit[]; nextId: number }
export const newMatch = (): Match => ({ tick: 0, you: 40, bot: 40, units: [], nextId: 1 })
export function advance(state: Match): Match {
  const next: Match = { ...state, tick: state.tick + 1, units: state.units.map(unit => ({ ...unit })) }
  if (next.tick % 18 === 0) {
    const kinds: Kind[] = ['shield', 'bow', 'horse']
    next.units.push({ id: next.nextId++, kind: kinds[Math.floor(next.tick / 18 - 1) % 3], side: 'bot', lane: Math.floor(next.tick / 18 - 1) % 3, x: 94, hp: 8 })
  }
  const damage = new Map<number, number>()
  for (const unit of next.units) {
    const enemy = next.units.find(other => other.side !== unit.side && other.lane === unit.lane && Math.abs(other.x - unit.x) < 7)
    if (enemy) damage.set(enemy.id, (damage.get(enemy.id) ?? 0) + (troops[unit.kind].beats === enemy.kind ? 4 : 1))
    else unit.x += unit.side === 'you' ? 1 : -1
  }
  for (const unit of next.units) {
    unit.hp -= damage.get(unit.id) ?? 0
    if (unit.hp > 0 && unit.x >= 100) next.bot = Math.max(0, next.bot - 4)
    if (unit.hp > 0 && unit.x <= 0) next.you = Math.max(0, next.you - 4)
  }
  next.units = next.units.filter(unit => unit.hp > 0 && unit.x > 0 && unit.x < 100)
  return next
}
