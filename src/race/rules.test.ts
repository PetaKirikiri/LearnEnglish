import { describe, expect, it } from 'vitest'
import { MAX_SPEED, MIN_SPEED, racePositions, roundResult, speedFor, wrongAnswerPenalty } from './rules'

describe('five kilometre boosts and proportional braking',()=>{
  it.each([[0,5],[2000,4],[5000,2.5],[10000,0]])('adds %sms response boost of %s km/h', (ms,gain)=>{
    expect(speedFor(true,ms,1,25/3.6)*3.6).toBeCloseTo(25+gain)
    expect(speedFor(true,ms,29,25/3.6)).toBe(speedFor(true,ms,1,25/3.6))
  })
  it.each([[1,60,20],[2,40,24],[3,30,28],[4,20,32]])('position %s loses %s percent', (position, penalty, remaining)=>{
    expect(wrongAnswerPenalty(position)*100).toBe(penalty)
    expect(speedFor(false,0,0,40/3.6,position)*3.6).toBeCloseTo(remaining)
    expect(speedFor(false,0,0,MIN_SPEED,position)).toBe(MIN_SPEED)
    expect(speedFor(true,2000,0,40/3.6,position)*3.6).toBeCloseTo(40)
  })
  it('ranks by distance, shares ties, and protects last place in smaller fields',()=>{
    expect(racePositions([{metres:10},{metres:30},{metres:30},{metres:20}])).toEqual([4,1,1,3])
    expect(racePositions([{metres:0},{metres:0},{metres:0},{metres:0}])).toEqual([1,1,1,1])
    expect(wrongAnswerPenalty(2,2)).toBe(.2)
    expect(wrongAnswerPenalty(10,10)).toBe(.2)
  })
  it('clamps timing but retains fractional milliseconds',()=>{
    expect(speedFor(true,-10)).toBe(speedFor(true,0))
    expect(speedFor(true,11000)).toBe(speedFor(true,10000))
    expect(speedFor(true,1234)-speedFor(true,1234.125)).toBeCloseTo(5/3.6*.125/10000,10)
  })
  it('accumulates from the earned target if another round closes during a ramp',()=>{
    const pending={speed:20/3.6,targetSpeed:25/3.6,streak:4}
    expect(roundResult(pending,true,0)).toMatchObject({streak:5,targetSpeed:30/3.6,accelerationRemainingMs:1000})
    expect(roundResult(pending,false,0)).toMatchObject({streak:0,targetSpeed:MIN_SPEED,accelerationRemainingMs:1000})
  })
})

it('caps repeated boosts and stale higher speeds at 40 km/h',()=>{
  let speed=MIN_SPEED
  for(let round=0;round<100;round++) {
    speed=speedFor(true,0,round,speed)
    expect(speed).toBeLessThanOrEqual(MAX_SPEED)
  }
  expect(speed).toBe(MAX_SPEED)
  expect(speedFor(true,0,0,100/3.6)).toBe(MAX_SPEED)
  expect(speedFor(false,0,0,100/3.6,4)).toBeCloseTo(32/3.6)
})
