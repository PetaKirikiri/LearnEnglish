import { describe, expect, it } from 'vitest'
import { worldCamera, WORLD_HORSE_WIDTH } from './worldCamera'
import { demoAt } from './demoRace'

describe('one world, one race camera', () => {
  it('preserves the actual number of horse lengths in a gap at every zoom and screen size', () => {
    for (const [width,height] of [[390,600],[1440,700]]) {
      for (const gap of [18,90,180,600,1000]) {
        const players=demoAt(0).players.map((p,i)=>({...p,metres:200+(i===0?gap:0)}))
        const c=worldCamera(players,width,height,4)
        const pixels=c.screenX(200+gap)-c.screenX(200)
        expect(pixels/(WORLD_HORSE_WIDTH*c.scale)).toBeCloseTo(gap/WORLD_HORSE_WIDTH)
        expect((c.screenX(250)-c.screenX(200))/(WORLD_HORSE_WIDTH*c.scale)).toBeCloseTo(50/WORLD_HORSE_WIDTH)
        expect(c.laneHeight*c.scale*4).toBeCloseTo(height-44)
        expect(c.screenY(1)-c.screenY(0)).toBeCloseTo((height-44)/4)
      }
    }
  })
  it('keeps full horses and lanes on screen from countdown through the finish',()=>{
    for (const [width,height] of [[390,450],[1440,700]]) for(let t=0;t<=100000;t+=500) {
      const players=demoAt(t).players,c=worldCamera(players,width,height,4)
      for (const p of players) {
        expect(c.screenX(p.metres)-WORLD_HORSE_WIDTH/2*c.scale).toBeGreaterThanOrEqual(0)
        expect(c.screenX(p.metres)+WORLD_HORSE_WIDTH/2*c.scale).toBeLessThanOrEqual(width)
      }
      expect(c.y).toBeGreaterThanOrEqual(0)
      expect(c.y+c.trackHeight*c.scale).toBeLessThanOrEqual(height)
      expect(WORLD_HORSE_WIDTH*c.scale).toBeGreaterThan(width < 600 ? 30 : 110)
      expect(WORLD_HORSE_WIDTH/1.5*c.scale+24).toBeLessThanOrEqual(c.laneHeight*c.scale+1e-8)
    }
  })
  it('does not compress growing gaps by leaving the horse artwork oversized',()=>{
    const initial=demoAt(0).players.map((p,i)=>({...p,metres:i===0?30:0}))
    const later=initial.map((p,i)=>({...p,metres:p.metres+(i===0?30:16)*5}))
    const a=worldCamera(initial,600,1000,4),b=worldCamera(later,600,1000,4)
    const before=(a.screenX(initial[0].metres)-a.screenX(initial[1].metres))/(a.scale*WORLD_HORSE_WIDTH)
    const after=(b.screenX(later[0].metres)-b.screenX(later[1].metres))/(b.scale*WORLD_HORSE_WIDTH)
    expect(after-before).toBeCloseTo(70/WORLD_HORSE_WIDTH)
    expect(b.scale).toBeLessThanOrEqual(a.scale)
  })
  it('zooms horizontally as the field spreads while keeping the lanes full height',()=>{
    const close=demoAt(0).players
    const spread=close.map((p,i)=>({...p,metres:i*450}))
    const a=worldCamera(close,1440,700,4),b=worldCamera(spread,1440,700,4)
    expect(b.scale).toBeLessThan(a.scale)
    expect(b.trackHeight*b.scale).toBeCloseTo(a.trackHeight*a.scale)
    expect(b.screenY(3)-b.screenY(0)).toBeCloseTo(a.screenY(3)-a.screenY(0))
  })
})
