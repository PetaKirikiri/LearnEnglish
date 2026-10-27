// @vitest-environment node
import { expect, it } from 'vitest'
import { cloudAction, type RaceStore } from './classroomRaceCloud'
import { token, type Room } from './classroomRace'
import type { RaceView } from '../src/race/types'
function memoryStore() {
  const rows = new Map<string, { id: string; revision: number; state: Room }>()
  const store: RaceStore = {
    async insert(room) { rows.set(room.id, { id: room.id, revision: 0, state: structuredClone(room) }) },
    async read(id) { return structuredClone(rows.get(id) ?? null) },
    async save(id, revision, state) {
      const current = rows.get(id)
      if (current?.revision !== revision) return false
      rows.set(id, { id, revision: revision + 1, state: structuredClone(state) }); return true
    },
  }
  return { store, rows }
}
const origin = 'https://learn-english-coral.vercel.app'
const selection = { stage: 'holiday-meaning', questionIds: ['race-meaning-taxi', 'race-meaning-hotel'] }
it('allows account-free hosting and ten concurrent guest joins, keeping host controls private', async () => {
  const { store, rows } = memoryStore()
  expect(await cloudAction(store, 'config', 'GET', '', '', {}, origin, 0)).toEqual({ canHost: true, joinOrigin: origin })
  const host = await cloudAction(store, 'create', 'POST', '', '', selection, origin, 0) as { room: string; token: string }
  const guests = Array.from({ length: 10 }, (_, i) => ({ name: `Guest ${i}`, token: token() }))
  await Promise.all(guests.map(g=>cloudAction(store,'join','POST',host.room,g.token,{name:g.name},origin,1,()=>1)))
  expect(rows.get(host.room)?.state.players).toHaveLength(10)
  const guest = await cloudAction(store,'state','GET',host.room,guests[0].token,{},origin,2,()=>2) as RaceView
  expect(guest.me).toBeDefined(); expect(guest.joinUrl).toBeUndefined(); expect(guest.questionIds).toBeUndefined()
  expect(JSON.stringify(guest)).not.toContain(host.token)
  await expect(cloudAction(store,'control','POST',host.room,guests[0].token,{action:'start',round:-1,run:1},origin,3)).rejects.toThrow('Only the host')
  const view = await cloudAction(store,'state','GET',host.room,host.token,{},origin,4,()=>4) as RaceView
  expect(view.joinUrl).toBe(`${origin}/english/race/join/${host.room}`)
})
it('stores simultaneous answers once and shares a single question across boundary polls', async () => {
  const { store, rows } = memoryStore()
  const host = await cloudAction(store,'create','POST','','',selection,origin,0) as {room:string;token:string}
  const guests = Array.from({length:10},(_,i)=>({name:`Guest ${i}`,token:token()}))
  await Promise.all(guests.map(g=>cloudAction(store,'join','POST',host.room,g.token,{name:g.name},origin,1,()=>1)))
  const start = await cloudAction(store,'control','POST',host.room,host.token,{action:'start',round:-1,run:1},origin,10,()=>10) as RaceView
  const correct=rows.get(host.room)!.state.deck[0].correct
  const at=start.opensAt+250
  await Promise.all(guests.map(g=>cloudAction(store,'answer','POST',host.room,g.token,{choice:correct,round:0,run:1},origin,at,()=>at)))
  expect(rows.get(host.room)!.state.round).toBe(1)
  expect(rows.get(host.room)!.state.opensAt).toBe(at)
  expect(Object.keys(rows.get(host.room)!.state.answers)).toHaveLength(0)
  await cloudAction(store,'answer','POST',host.room,guests[9].token,{choice:correct,round:0,run:1},origin,at+1,()=>at+1)
  expect(rows.get(host.room)!.state.round).toBe(1)
  expect(rows.get(host.room)!.state.players.every(p=>p.speed>=0&&p.targetSpeed!>2&&p.streak===1)).toBe(true)
  const revision=rows.get(host.room)!.revision
  await Promise.all(guests.map(g=>cloudAction(store,'state','GET',host.room,g.token,{},origin,at+100,()=>at+100)))
  expect(rows.get(host.room)!.revision).toBe(revision)
  const boundary=at+10000+1
  const views=await Promise.all(guests.map(g=>cloudAction(store,'state','GET',host.room,g.token,{},origin,boundary,()=>boundary) as Promise<RaceView>))
  expect(rows.get(host.room)!.revision).toBe(revision+1)
  expect(new Set(views.map(v=>JSON.stringify(v.question))).size).toBe(1)
  expect(views.every(v=>v.round===2&&v.question?.english===rows.get(host.room)!.state.deck[2].english&&v.question?.correct===undefined)).toBe(true)
  await expect(cloudAction(store,'prepare','POST',host.room,host.token,{...selection,run:1},origin,boundary)).rejects.toThrow('Finish the current race')
  await cloudAction(store,'control','POST',host.room,host.token,{action:'finish',round:2,run:1},origin,boundary)
  const prepared=await cloudAction(store,'prepare','POST',host.room,host.token,{...selection,run:1},origin,boundary+1) as RaceView
  expect(prepared.players).toHaveLength(10);expect(prepared.phase).toBe('lobby');expect(prepared.run).toBe(2)
  await expect(cloudAction(store,'answer','POST',host.room,guests[0].token,{choice:0,round:0,run:1},origin,boundary+2)).rejects.toThrow('race has changed')
})
it('rejects invalid routes, expired rooms and failed atomic writes',async()=>{
  const {store,rows}=memoryStore()
  await expect(cloudAction(store,'state','POST','AAAAAAAAAA','',{},origin,0)).rejects.toThrow('request method')
  await expect(cloudAction(store,'state','GET','invalid','',{},origin,0)).rejects.toThrow('not valid')
  const host=await cloudAction(store,'create','POST','','',selection,origin,0) as {room:string;token:string}
  await expect(cloudAction(store,'state','GET',host.room,'',{},origin,86400001)).rejects.toThrow('has ended')
  const blocked={...store,save:async()=>false}
  await expect(cloudAction(blocked,'join','POST',host.room,token(),{name:'Guest'},origin,1)).rejects.toThrow('busy')
  expect(rows.get(host.room)!.state.players).toHaveLength(0)
})

it('keeps game QR links on the public website even when the host uses a preview address', async () => {
  const { store } = memoryStore()
  const host = await cloudAction(store, 'create', 'POST', '', '', selection, 'http://localhost:5185', 0) as {room:string;token:string}
  for (const hostOrigin of ['http://localhost:5185', 'https://preview.example.com']) {
    const view = await cloudAction(store, 'state', 'GET', host.room, host.token, {}, hostOrigin, 1, () => 1) as RaceView
    expect(view.joinUrl).toBe(`${origin}/english/race/join/${host.room}`)
  }
})

it('runs the three lesson-two pools in one room while preserving the student QR and roster', async () => {
  const {store,rows}=memoryStore()
  const host=await cloudAction(store,'create','POST','','',{stage:'lesson-two-number'},origin,0) as {room:string;token:string}
  const guest=token()
  await cloudAction(store,'join','POST',host.room,guest,{name:'Lesson two test'},origin,1,()=>1)
  let view=await cloudAction(store,'state','GET',host.room,host.token,{},origin,2,()=>2) as RaceView
  const joinUrl=view.joinUrl
  for(const stage of ['lesson-two-number','lesson-two-owner','lesson-two-review']){
    view=await cloudAction(store,'prepare','POST',host.room,host.token,{stage,run:view.run},origin,3,()=>3) as RaceView
    expect(view.stageId).toBe(stage)
    expect(view.players.map(p=>p.name)).toEqual(['Lesson two test'])
    expect(view.joinUrl).toBe(joinUrl)
    expect(rows.get(host.room)!.state.pool.every(q=>/^\/audio\/race-(lesson-two|holiday)\/.+\.wav$/.test(q.audioUrl))).toBe(true)
    view=await cloudAction(store,'control','POST',host.room,host.token,{action:'start',round:view.round,run:view.run},origin,10,()=>10) as RaceView
    const player=await cloudAction(store,'state','GET',host.room,guest,{},origin,11,()=>11) as RaceView
    expect(player.question?.choices).toHaveLength(2)
    expect(player.question?.correct).toBeUndefined()
    if(stage==='lesson-two-review'){
      expect(rows.get(host.room)!.state.kind).toBe('meaning')
      expect(view.questionIds).toHaveLength(134)
      expect(player.question!.choices.every(choice=>/[ก-๙]/.test(choice))).toBe(true)
    }
    expect(view.question?.english).toMatch(/^Where (is|are) (the|my|your) /)
    view=await cloudAction(store,'control','POST',host.room,host.token,{action:'finish',round:view.round,run:view.run},origin,12,()=>12) as RaceView
  }
})


it('serves lesson three stages through the same host and phone race flow',async()=>{
 const {store}=memoryStore()
 const origin='https://race.test'
 const host=await cloudAction(store,'create','POST','','',{stage:'lesson-three-past'},origin,0) as {room:string;token:string}
 const guest=token()
 await cloudAction(store,'join','POST',host.room,guest,{name:'Lesson three test'},origin,1,()=>1)
 let view=await cloudAction(store,'state','GET',host.room,host.token,{},origin,2,()=>2) as RaceView
 for(const stage of ['lesson-three-past','lesson-three-owner','lesson-three-review']){
  view=await cloudAction(store,'prepare','POST',host.room,host.token,{stage,run:view.run},origin,3,()=>3) as RaceView
  view=await cloudAction(store,'control','POST',host.room,host.token,{action:'start',round:view.round,run:view.run},origin,4,()=>4) as RaceView
  const player=await cloudAction(store,'state','GET',host.room,guest,{},origin,5,()=>5) as RaceView
  expect(player.question?.english).toBe(view.question?.english)
  expect(player.question?.choices).toHaveLength(2)
  expect(view.question?.audioUrl).toMatch(/^\/audio\/race-/)
  if(stage!=='lesson-three-past')expect(player.question!.choices.every(choice=>/[ก-๙]/.test(choice))).toBe(true)
  view=await cloudAction(store,'control','POST',host.room,host.token,{action:'finish',round:view.round,run:view.run},origin,6,()=>6) as RaceView
 }
})
