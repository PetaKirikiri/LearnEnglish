// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { cityCipher, cityIdentity } from './cloudProtocol'
const secret = () => Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64')
describe('city broadcast identities', () => {
 it('encrypts movement and rejects replay, forgery and another room', async () => {
  const key = secret(), hostId = await cityIdentity(), playerId = await cityIdentity()
  const host = await cityCipher(key, hostId), player = await cityCipher(key, playerId)
  await host.trust('alex', playerId.publicKey); await host.trust('host', hostId.publicKey)
  const message = await player.seal('alex', { type:'move',commands:[{seq:1,x:1,y:0,seconds:.05}] })
  expect(JSON.stringify(message)).not.toContain('commands')
  expect((await host.open(message))?.body.type).toBe('move')
  expect(await host.open(message)).toBeNull()
  expect(await host.open(await player.seal('host', {type:'control',action:'pause'}))).toBeNull()
  const other = await cityCipher(secret(), playerId)
  expect(await host.open(await other.seal('alex', {type:'move'}))).toBeNull()
  expect(await host.open({...message,data:'corrupt'})).toBeNull()
 })
 it('trusts only the registered sender and removes their access', async () => {
  const key=secret(), identity=await cityIdentity(), cipher=await cityCipher(key,identity)
  expect(await cipher.open(await cipher.seal('unknown',{type:'ping'}))).toBeNull()
  await cipher.trust('player',identity.publicKey)
  const newer=await cipher.seal('player',{type:'ping'}), newest=await cipher.seal('player',{type:'ping'})
  expect(await cipher.open(newest)).not.toBeNull();expect(await cipher.open(newer)).toBeNull()
  cipher.forget('player');expect(await cipher.open(await cipher.seal('player',{type:'ping'}))).toBeNull()
 })
})
