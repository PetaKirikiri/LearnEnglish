// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { cityCloudAction, type CityStore, type CityRow } from './cityCloud'
import { cityIdentity } from '../src/city/cloudProtocol'
function storage():CityStore {
 const rows=new Map<string,CityRow>()
 return {insert:async row=>{if(rows.has(row.code))return false;rows.set(row.code,structuredClone(row));return true},read:async code=>structuredClone(rows.get(code)??null),save:async row=>{if(rows.get(row.code)?.revision!==row.revision)return false;rows.set(row.code,structuredClone({...row,revision:row.revision+1}));return true}}
}
describe('cloud city room permissions and recovery',()=>{
 it('allows QR joining but only teacher credentials can change membership',async()=>{
  const store=storage(), identity=await cityIdentity(),host=await cityCloudAction(store,'create',{publicKey:identity.publicKey},'')
  const player=await cityCloudAction(store,'join',{code:host.credentials.code,name:'Alex',avatar:2,publicKey:identity.publicKey},'')
  expect(player.credentials.role).toBe('player');expect(player).not.toHaveProperty('lease');expect(player).not.toHaveProperty('members')
  await expect(cityCloudAction(store,'sync',{code:host.credentials.code,lease:host.lease},player.credentials.token)).rejects.toThrow('teacher screen')
  await expect(cityCloudAction(store,'resume',{code:host.credentials.code},'fake-token')).rejects.toThrow('no longer')
  const sync=await cityCloudAction(store,'sync',{code:host.credentials.code,lease:host.lease},host.credentials.token)
  expect(sync.members).toHaveLength(1);expect(sync.members![0]).not.toHaveProperty('tokenHash')
  await cityCloudAction(store,'remove',{code:host.credentials.code,lease:host.lease,playerId:player.credentials.playerId},host.credentials.token)
  await expect(cityCloudAction(store,'resume',{code:host.credentials.code},player.credentials.token)).rejects.toThrow('no longer')
 })
 it('resumes checkpoints and invalidates the previous host lease',async()=>{
  const store=storage(),identity=await cityIdentity(),host=await cityCloudAction(store,'create',{publicKey:identity.publicKey},'')
  const snapshot={code:host.credentials.code,players:[],target:'bank',paused:true,now:Date.now()}
  await cityCloudAction(store,'sync',{code:host.credentials.code,lease:host.lease,snapshot},host.credentials.token)
  const resumed=await cityCloudAction(store,'resume',{code:host.credentials.code},host.credentials.token)
  expect(resumed.snapshot).toEqual(snapshot);expect(resumed.lease).not.toBe(host.lease)
  await expect(cityCloudAction(store,'sync',{code:host.credentials.code,lease:host.lease},host.credentials.token)).rejects.toThrow('another teacher screen')
 })
 it('handles simultaneous joins, enforces capacity and expiration',async()=>{
  const store=storage(),identity=await cityIdentity(),host=await cityCloudAction(store,'create',{publicKey:identity.publicKey},'',1000)
  const join=(i:number)=>cityCloudAction(store,'join',{code:host.credentials.code,name:`P${i}`,publicKey:identity.publicKey},'',2000)
  await Promise.all(Array.from({length:8},(_,i)=>join(i)))
  await Promise.all(Array.from({length:8},(_,i)=>join(i+8)))
  await expect(join(17)).rejects.toThrow('full')
  expect((await store.read(host.credentials.code))?.data.members).toHaveLength(16)
  await expect(cityCloudAction(store,'resume',{code:host.credentials.code},host.credentials.token,9*3600000)).rejects.toThrow('not found')
 })
 it('rejects private keys and malformed identities',async()=>{
  const store=storage(),identity=await cityIdentity()
  await expect(cityCloudAction(store,'create',{publicKey:identity.privateKey},'')).rejects.toThrow('identity')
  await expect(cityCloudAction(store,'create',{publicKey:{kty:'EC',crv:'P-256',x:'bad',y:'bad'}},'')).rejects.toThrow('identity')
 })
})
