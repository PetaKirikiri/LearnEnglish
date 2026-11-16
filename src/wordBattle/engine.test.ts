import { describe, expect, it } from 'vitest'
import { advance, evaluate, extendsPhrase, newMatch } from './engine'
describe('word battle', () => {
  it('banks phrases and rewards complete ordered sentences', () => {
    expect(evaluate(['the', 'dog']).score).toBe(4)
    expect(evaluate(['the', 'big', 'dog', 'runs']).score).toBe(22)
    expect(evaluate(['dog', 'the', 'runs']).valid).toBe(false)
    expect(evaluate(['the', 'dog', 'eats']).valid).toBe(false)
    expect(evaluate(['the', 'dog', 'eats', 'a', 'fish']).valid).toBe(true)
    expect(evaluate(['runs', 'quickly']).valid).toBe(true)
    expect(evaluate(['quickly', 'runs']).valid).toBe(false)
    expect(evaluate(['the', 'fish', 'sleeps']).valid).toBe(true)
  })
  it('allows insertion while preventing replacement or reorder exploits', () => {
    expect(extendsPhrase(['the', 'dog'], ['the', 'big', 'dog', 'runs'])).toBe(true)
    expect(extendsPhrase(['the', 'dog'], ['the', 'cat', 'runs'])).toBe(false)
    expect(extendsPhrase(['the', 'dog'], ['dog', 'the', 'runs'])).toBe(false)
    expect(extendsPhrase(['the', 'dog'], ['the', 'dog'])).toBe(false)
  })
  it('counter units win equal strength encounters', () => {
    let state = { ...newMatch(), units: [{ id: 1, kind: 'bow' as const, side: 'you' as const, lane: 1, x: 48, hp: 8 }, { id: 2, kind: 'shield' as const, side: 'bot' as const, lane: 1, x: 52, hp: 8 }] }
    state = advance(advance(state)) as typeof state
    expect(state.units).toHaveLength(1)
    expect(state.units[0].side).toBe('you')
  })
  it('applies base damage once and spawns predictable enemy waves', () => {
    const state = { ...newMatch(), units: [{ id: 1, kind: 'horse' as const, side: 'you' as const, lane: 0, x: 99, hp: 8 }] }
    const next = advance(state)
    expect(next.bot).toBe(36)
    expect(advance(next).bot).toBe(36)
    expect(advance({ ...newMatch(), tick: 17 }).units[0].kind).toBe('shield')
    expect(state.units[0].x).toBe(99)
  })
})
