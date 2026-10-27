import { expect, it } from 'vitest'
import { horsePowerVisuals } from './horsePowerVisuals'

it('charges slowly at three, faster at four and transforms at five',()=>{
  expect(horsePowerVisuals(15,2)).toMatchObject({charge:0,powered:false})
  const three=horsePowerVisuals(15,3),four=horsePowerVisuals(15,4)
  expect(three.charge).toBe(3)
  expect(four.charge).toBe(4)
  expect(four.pulseSeconds).toBeLessThan(three.pulseSeconds)
  expect(four.pulseSeconds).toBeGreaterThanOrEqual(.8)
  expect(horsePowerVisuals(15,5)).toMatchObject({charge:0,powered:true,level:1})
})
it('keeps increasing cadence and energy without unbounded growth or a hard animation cap',()=>{
  const first=horsePowerVisuals(16,5),later=horsePowerVisuals(40,29),fastest=horsePowerVisuals(80,60)
  expect(later.auraScale).toBeGreaterThan(first.auraScale)
  expect(fastest.auraScale).toBeGreaterThan(later.auraScale)
  expect(fastest.wakeScale).toBeGreaterThan(later.wakeScale)
  expect(fastest.gallopSeconds).toBeLessThan(later.gallopSeconds)
  expect(fastest.flowSeconds).toBeLessThan(later.flowSeconds)
  expect(horsePowerVisuals(1000,1000).auraScale).toBeLessThanOrEqual(1.7)
  expect(horsePowerVisuals(1000,1000).wakeScale).toBeLessThanOrEqual(2.2)
  expect(horsePowerVisuals(1000,1000).gallopSeconds).toBeGreaterThan(.22)
})
