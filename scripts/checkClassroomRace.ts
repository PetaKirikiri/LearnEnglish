import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
const origin = 'http://127.0.0.1:5185'
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, Math.max(0, ms)))
async function call(path: string, room = '', token = '', body?: unknown) {
  const response = await fetch(`${origin}/api/classroom-race/${path}${room ? `?room=${room}` : ''}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  return { status: response.status, data: await response.json() }
}
const { data: host } = await call('create', '', '', { stage: 'man-woman' })
assert.ok(host.room)
const players = Array.from({ length: 10 }, (_, i) => ({ token: randomBytes(24).toString('hex'), name: `QA Rider ${i + 1}` }))
const joins = await Promise.all(players.map(p => call('join', host.room, p.token, { name: p.name })))
assert.ok(joins.every(j => j.status === 200))
assert.equal((await call('state', host.room, host.token)).data.players.length, 10)
assert.equal((await call('join', host.room, randomBytes(24).toString('hex'), { name: 'Overflow' })).status, 400)
assert.equal((await call('control', host.room, players[0].token, { action: 'start', round: -1 })).status, 400)
const opened = (await call('control', host.room, host.token, { action: 'start', round: -1 })).data
assert.equal(opened.finish,1600); assert.equal(opened.closesAt-opened.opensAt,5000)
const privateRoom = JSON.parse(await readFile(`.classroom-races/${host.room}.json`, 'utf8'))
assert.equal(privateRoom.pool.length,2)
const correct = privateRoom.deck[0].correct
assert.equal((await call('answer', host.room, players[0].token, { choice: correct, round: 0 })).status,400)
assert.equal((await call('state', host.room, players[0].token)).data.question.english,undefined)
await sleep(opened.opensAt - Date.now() + 100)
await Promise.all(players.slice(0, 5).map((p, i) => call('answer', host.room, p.token, { round: 0, choice: i === 0 ? 1 - correct : correct })))
await sleep(1000)
await Promise.all(players.slice(5).map(p => call('answer', host.room, p.token, { round: 0, choice: correct })))
const result = (await call('state', host.room, host.token)).data
assert.equal(result.phase,'answering'); assert.equal(result.round,0)
assert.equal(result.players[0].speed,8)
assert.ok(result.players[1].speed > result.players[5].speed)
assert.ok(result.players[1].metres > result.players[0].metres)
await call('answer', host.room, players[0].token, { round: 0, choice: correct })
assert.equal((await call('state', host.room, host.token)).data.players[0].speed,8)
const reconnect = (await call('join', host.room, players[1].token, { name: players[1].name })).data
assert.equal(reconnect.me.id,result.players[1].id); assert.equal(reconnect.players[1].speed,result.players[1].speed)
await sleep(opened.closesAt - Date.now() + 100)
const next = (await call('state', host.room, host.token)).data
assert.equal(next.round,1); assert.equal(next.phase,'answering')
assert.ok(next.players.every((p:{metres:number},i:number)=>p.metres>result.players[i].metres))
assert.equal(next.opensAt,opened.closesAt)
await sleep(next.closesAt - Date.now() + 100)
const missing = (await call('state', host.room, host.token)).data
assert.equal(missing.round,2); assert.ok(missing.players.every((p:{speed:number})=>p.speed===8))
const persisted=JSON.parse(await readFile(`.classroom-races/${host.room}.json`,'utf8'))
assert.equal(persisted.round,2); assert.equal(persisted.players[1].metres,missing.players[1].metres)
assert.equal((await fetch(`${origin}/.classroom-races/${host.room}.json`)).status,403)
await call('control',host.room,host.token,{action:'finish',round:2})
console.log(JSON.stringify({passed:true,seats:10,windowSeconds:5,poolSize:2,wrongSpeed:result.players[0].speed,fastSpeed:result.players[1].speed,slowerSpeed:result.players[5].speed,autoProgression:true,timeoutSlows:true,rejoin:'preserved',privateFiles:'blocked'}))
