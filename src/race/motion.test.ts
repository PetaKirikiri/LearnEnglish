import { expect, it } from 'vitest'
import { movingPlayers } from './motion'
import type { RaceView } from './types'
const view: RaceView={id:'r',run:1,stageId:'test',title:'Race',phase:'answering',round:0,finish:1600,serverNow:1000,motionAt:1000,opensAt:0,closesAt:5000,players:[{id:'p',name:'P',lane:0,metres:100,speed:16,answered:false}]}
it('moves smoothly between snapshots without changing the authoritative data',()=>{
  expect(movingPlayers(view,1250)[0].metres).toBe(104)
  expect(movingPlayers(view,1500)[0].metres).toBe(108)
  expect(view.players[0].metres).toBe(100)
})
it('limits stale extrapolation and stops at the boundary, countdown and finish',()=>{
  expect(movingPlayers(view,10000)[0].metres).toBe(112)
  expect(movingPlayers({...view,closesAt:1100},2000)[0].metres).toBe(101.6)
  expect(movingPlayers({...view,phase:'finished'},1500)[0].metres).toBe(100)
  expect(movingPlayers({...view,opensAt:2000,motionAt:2000},1500)[0].metres).toBe(100)
})
it('uses the same ramp as the server for the actual speed readout and position',()=>{
  const ramp={...view,players:[{...view.players[0],speed:10,targetSpeed:20,accelerationRemainingMs:1000}]}
  expect(movingPlayers(ramp,1500)[0]).toMatchObject({speed:15,metres:106.25,accelerationRemainingMs:500})
  expect(ramp.players[0].speed).toBe(10)
})
