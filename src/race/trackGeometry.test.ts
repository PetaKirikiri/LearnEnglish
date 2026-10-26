import { describe, expect, it } from 'vitest'
import { finishX, laneHeight, startX, trackPosition } from './trackGeometry'

describe('straight race lanes', () => {
  it('gives all ten lanes identical start, finish and distance scales', () => {
    for (let lane = 0; lane < 10; lane++) {
      expect(trackPosition(0, 200, lane).x).toBe(startX)
      expect(trackPosition(200, 200, lane).x).toBe(finishX)
      expect(trackPosition(100, 200, lane).x).toBe((startX + finishX) / 2)
      expect(trackPosition(19.7, 200, lane).x).toBe(trackPosition(19.7, 200, 0).x)
    }
  })
  it('keeps players in evenly spaced lanes and never wraps at the finish', () => {
    for (let lane = 1; lane < 10; lane++) expect(trackPosition(10, 200, lane).y - trackPosition(10, 200, lane - 1).y).toBe(laneHeight)
    expect(trackPosition(220, 200, 0).x).toBe(finishX)
    expect(trackPosition(-1, 200, 0).x).toBe(startX)
  })
})
