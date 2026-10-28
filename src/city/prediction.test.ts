import { describe, expect, it } from 'vitest'
import { CityPrediction } from './prediction'
import { CityRoom } from '../../server/cityRoom'
import { canWalk } from './world'
function setup(){const room=new CityRoom(),credentials=room.join('Alex',0,0),player=room.players.get(credentials.playerId)!;Object.assign(player,{x:600,y:600});const prediction=new CityPrediction();prediction.reconcile({...player},0,true);return {room,player,prediction}}
describe('local phone prediction',()=>{
 it('moves on the first frame before the host receives any input',()=>{const {player,prediction}=setup();prediction.setInput(1,0);prediction.step(1/60,true);expect(prediction.display()!.x).toBeCloseTo(602);expect(player.x).toBe(600)})
 it('replays unacknowledged steps without applying acknowledged movement twice',()=>{const {room,player,prediction}=setup();prediction.setInput(1,0);for(let i=0;i<3;i++)prediction.step(1/60,true);const packet=prediction.unsent();room.commands(player.id,packet,50);prediction.step(1/60,true);prediction.reconcile({...player},50,true);expect(prediction.player!.x).toBeCloseTo(608);expect(prediction.pending).toHaveLength(1);room.commands(player.id,packet,60);expect(player.x).toBeCloseTo(606)})
 it('converges after 150ms round-trip lag, including a direction change and release',()=>{
  const {room,player,prediction}=setup();const upstream:{at:number;packet:ReturnType<CityPrediction['unsent']>}[]=[],downstream:{at:number;player:typeof player;time:number}[]=[]
  for(let now=10;now<=1800;now+=10){
   if(now===10)prediction.setInput(1,0)
   if(now===510)prediction.setInput(-1,0)
   if(now===1010)prediction.setInput(0,0)
   prediction.step(.01,true)
   if(now%50===0){const packet=prediction.unsent();if(packet.length)upstream.push({at:now+75,packet})}
   while(upstream[0]?.at<=now){const message=upstream.shift()!;room.commands(player.id,message.packet,now)}
   if(now%50===0)downstream.push({at:now+75,player:{...player},time:now})
   while(downstream[0]?.at<=now){const message=downstream.shift()!;prediction.reconcile(message.player,message.time,true)}
  }
  expect(prediction.pending).toHaveLength(0);expect(prediction.player!.x).toBeCloseTo(player.x);expect(prediction.display()!.x).toBeCloseTo(player.x,1);expect(player.x).toBeCloseTo(600);expect(player.dx).toBe(0)
 })
 it('uses identical collision and diagonal speed rules on phone and host',()=>{const {room,player,prediction}=setup();Object.assign(player,{x:670,y:150});prediction.reconcile({...player},1,true);prediction.setInput(1,0);for(let i=0;i<20;i++){prediction.step(.05,true);room.commands(player.id,prediction.unsent(),50*(i+1));prediction.reconcile({...player},50*(i+1),true)}expect(prediction.player!.x).toBe(player.x);expect(canWalk(player.x,player.y)).toBe(true);expect(player.x).toBeLessThan(676)})
 it('discards pending movement on pause/disconnect and resumes from authority',()=>{const {player,prediction}=setup();prediction.setInput(1,0);prediction.step(.05,true);prediction.reconcile({...player},50,false);prediction.step(.05,false);expect(prediction.pending).toHaveLength(0);expect(prediction.display()!.x).toBe(player.x);expect(prediction.display()!.dx).toBe(0)})
 it('ignores old snapshots and begins after the acknowledged sequence on reconnect',()=>{const {player,prediction}=setup();prediction.reconcile({...player,x:620,inputAck:60},100,true);prediction.reconcile({...player,x:600},50,true);expect(prediction.player!.x).toBe(620);prediction.setInput(1,0);prediction.step(.02,true);expect(prediction.unsent()[0].seq).toBe(61)})
 it('caps malicious movement bursts and does not move command-driven players again on tick',()=>{const {room,player}=setup();const packet=Array.from({length:12},(_,i)=>({seq:i+1,x:1,y:0,seconds:.05}));room.commands(player.id,packet,0);expect(player.x).toBeCloseTo(612);room.commands(player.id,packet.map(c=>({...c,seq:c.seq+12})),0);room.tick(.1,100);expect(player.x).toBeCloseTo(612);expect(player.inputAck).toBe(24)})
 it('validates a whole packet before applying it and still enforces pause',()=>{const {room,player}=setup();expect(()=>room.commands(player.id,[{seq:1,x:1,y:0,seconds:.05},{seq:2,x:1,y:0,seconds:Infinity}],10)).toThrow();expect(player.x).toBe(600);room.control(room.hostToken,'pause',null);room.commands(player.id,[{seq:1,x:1,y:0,seconds:.05}],100);expect(player.x).toBe(600);expect(player.inputAck).toBe(1)})
})
