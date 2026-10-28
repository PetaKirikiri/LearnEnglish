// @vitest-environment node
import { createServer } from 'node:http'
import { WebSocket } from 'ws'
import { expect,it } from 'vitest'
import type { ViteDevServer } from 'vite'
import { cityPlugin } from './cityPlugin'
import type { CityCredentials, CityState } from '../src/city/world'
type Message={type:string;credentials:CityCredentials;state:CityState;message:string}
it('connects independent host and phone sockets, broadcasts movement, blocks phone controls, and resumes without a duplicate',async()=>{
 const http=createServer();const plugin=cityPlugin();const configure=plugin.configureServer as (server:ViteDevServer)=>void
 configure({httpServer:http,middlewares:{use:()=>{}}} as unknown as ViteDevServer)
 await new Promise<void>(r=>http.listen(0,'127.0.0.1',r));const port=(http.address() as {port:number}).port
 const sockets:WebSocket[]=[]
 async function connect(){const ws=new WebSocket(`ws://127.0.0.1:${port}/api/city/socket`);sockets.push(ws);await new Promise<void>(r=>ws.once('open',r));return ws}
 function wait(ws:WebSocket,predicate:(m:Message)=>boolean){return new Promise<Message>((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',onMessage);reject(new Error('Socket response timed out'))},2500);function onMessage(raw:Buffer){const m=JSON.parse(raw.toString());if(predicate(m)){clearTimeout(timer);ws.off('message',onMessage);resolve(m)}}ws.on('message',onMessage)})}
 try{
  const host=await connect(),joinedHost=wait(host,m=>m.type==='joined');host.send(JSON.stringify({type:'create'}));const hc=(await joinedHost).credentials
  const phone=await connect(),joinedPhone=wait(phone,m=>m.type==='joined');phone.send(JSON.stringify({type:'join',code:hc.code,name:'Alex',avatar:0}));const pc=(await joinedPhone).credentials
  const start=(await wait(host,m=>m.type==='state'&&m.state.players.length===1)).state.players[0]
  const moved=wait(host,m=>m.type==='state'&&m.state.players[0].y<start.y-5);phone.send(JSON.stringify({type:'input',x:0,y:-1}));await moved
  const denied=wait(phone,m=>m.type==='error');phone.send(JSON.stringify({type:'control',action:'target',value:'bank'}));expect((await denied).message).toContain('Only the teacher')
  const updated=wait(phone,m=>m.type==='state'&&m.state.target==='bank');host.send(JSON.stringify({type:'control',action:'target',value:'bank'}));await updated
  phone.close();await new Promise<void>(r=>phone.once('close',()=>r()))
  const stopped=(await wait(host,m=>m.type==='state'&&!m.state.players[0].online)).state.players[0];expect(stopped.dx).toBe(0);expect(stopped.dy).toBe(0)
  const resumed=await connect(),ready=wait(resumed,m=>m.type==='joined');resumed.send(JSON.stringify({type:'resume',...pc}));expect((await ready).credentials.playerId).toBe(pc.playerId)
  const state=(await wait(host,m=>m.type==='state'&&m.state.players[0].online)).state;expect(state.players).toHaveLength(1)
  const acknowledged=wait(host,m=>m.type==='state'&&m.state.players[0].inputAck===3)
  const packet={type:'move',commands:[{seq:1,x:0,y:-1,seconds:.025},{seq:2,x:0,y:-1,seconds:.025},{seq:3,x:0,y:0,seconds:0}]}
  resumed.send(JSON.stringify(packet));const authoritative=(await acknowledged).state.players[0]
  expect(authoritative.y).toBeCloseTo(state.players[0].y-6)
  const duplicate=wait(host,m=>m.type==='state'&&m.state.players[0].inputAck===3)
  resumed.send(JSON.stringify(packet));expect((await duplicate).state.players[0].y).toBe(authoritative.y)

 }finally{for(const ws of sockets)ws.terminate();await new Promise<void>(r=>http.close(()=>r()))}
})
