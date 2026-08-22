import { describe, expect, it } from 'vitest'
import { readings } from './readings'

describe('starter readings', () => {
  it('includes A Big Family as the complete first reading', () => {
    const reading = readings[0]

    expect(reading?.title).toBe('A Big Family')
    expect(reading?.chapter).toBe(1)
    expect(reading?.paragraphs.at(-1)).toBe('Jessica')
  })

  it('includes Getting to Know Your Child as the complete second reading', () => {
    const reading = readings[1]

    expect(reading?.title).toBe('Getting to Know Your Child')
    expect(reading?.chapter).toBe(2)
    expect(reading?.paragraphs.at(-1)).toBe('Barbara Smith')
  })

  it('includes Different Houses as the complete third reading', () => {
    const reading = readings[2]

    expect(reading?.title).toBe('Different Houses')
    expect(reading?.chapter).toBe(3)
    expect(reading?.paragraphs).toHaveLength(7)
    expect(reading?.paragraphs.at(-1)).toContain('for thousands of years')
  })

  it('includes A Train above You as the complete fourth reading', () => {
    const reading = readings[3]

    expect(reading?.title).toBe('A Train above You')
    expect(reading?.chapter).toBe(4)
    expect(reading?.paragraphs).toHaveLength(5)
    expect(reading?.paragraphs.at(-1)).toContain('wake up when they reach their stop')
  })

  it('includes Birdwatching as the complete fifth reading', () => {
    const reading = readings[4]

    expect(reading?.title).toBe('Birdwatching')
    expect(reading?.chapter).toBe(5)
    expect(reading?.paragraphs).toHaveLength(4)
    expect(reading?.paragraphs.at(-1)).toContain('A birder never hurts a bird!')
  })

  it('includes Street Food as Story 7 without inventing Story 6', () => {
    const reading = readings[5]

    expect(reading?.title).toBe('Street Food')
    expect(reading?.chapter).toBe(7)
    expect(reading?.paragraphs).toHaveLength(4)
    expect(reading?.paragraphs.at(-1)).toContain('a little bit of tartar sauce')
    expect(readings.some(({ chapter }) => chapter === 6)).toBe(false)
  })

  it('includes Around the World Right Now as Story 8', () => {
    const reading = readings[6]

    expect(reading?.title).toBe('Around the World Right Now')
    expect(reading?.chapter).toBe(8)
    expect(reading?.paragraphs).toHaveLength(4)
    expect(reading?.paragraphs.at(-1)).toContain('— Marilyn')
  })

  it('includes Rona’s Diary as Story 9', () => {
    const reading = readings[7]

    expect(reading?.title).toBe('Rona’s Diary')
    expect(reading?.chapter).toBe(9)
    expect(reading?.paragraphs[0]).toBe('Saturday')
    expect(reading?.paragraphs.at(-1)).toContain('What an exciting end to a wonderful trip!')
  })

  it('includes Climate Around the World as Story 10', () => {
    const reading = readings[8]

    expect(reading?.title).toBe('Climate Around the World')
    expect(reading?.chapter).toBe(10)
    expect(reading?.paragraphs).toHaveLength(2)
    expect(reading?.paragraphs[0]).toContain('views of the northern lights!')
    expect(reading?.paragraphs[1]).toContain('but we love our home.')
  })
})
