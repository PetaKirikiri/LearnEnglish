import { expect, it } from 'vitest'
import { motionAfter, secondsToFinish } from './kinematics'

it('integrates acceleration and braking rather than jumping to a target speed',()=>{
  const up={metres:0,speed:10,targetSpeed:20,accelerationRemainingMs:1000}
  expect(motionAfter(up,.5)).toEqual({metres:6.25,speed:15,targetSpeed:20,accelerationRemainingMs:500})
  expect(motionAfter(up,2)).toMatchObject({metres:35,speed:20,accelerationRemainingMs:0})
  expect(motionAfter({...up,speed:20,targetSpeed:10},.5)).toMatchObject({metres:8.75,speed:15})
})
it('finds the exact finish crossing during acceleration, braking and steady motion',()=>{
  for(const [speed,targetSpeed] of [[0,10],[10,20],[20,10],[10,10]]) {
    const player={metres:0,speed,targetSpeed,accelerationRemainingMs:1000}
    for(const finish of [1,5,20,100]) {
      const time=secondsToFinish(player,finish)
      expect(motionAfter(player,time).metres).toBeCloseTo(finish,8)
    }
  }
  expect(secondsToFinish({metres:0,speed:0},100)).toBe(Infinity)
})
it('is independent of poll frequency and preserves a stationary opening',()=>{
  const start={metres:0,speed:0,targetSpeed:10,accelerationRemainingMs:1000}
  let repeated=start
  for(let i=0;i<200;i++) repeated=motionAfter(repeated,.01) as typeof start
  expect(repeated.metres).toBeCloseTo(motionAfter(start,2).metres,9)
  expect(repeated.speed).toBe(10)
  expect(motionAfter({metres:0,speed:0},10).metres).toBe(0)
})
