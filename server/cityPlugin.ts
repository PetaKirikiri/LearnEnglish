import type { Plugin } from 'vite'
import { networkInterfaces } from 'node:os'
import { WebSocketServer, WebSocket } from 'ws'
import { CityRoom } from './cityRoom'

export function cityPlugin():Plugin{return {name:'classroom-city',configureServer(server){
 const rooms=new Map<string,CityRoom>(),clients=new Map<WebSocket,{room:CityRoom;id:string;token:string}>()
 const wss=new WebSocketServer({noServer:true,maxPayload:2048})
 const send=(ws:WebSocket,data:unknown)=>{if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<65536)ws.send(JSON.stringify(data))}
 server.middlewares.use('/api/city/config',(req,res)=>{
  const lan=Object.values(networkInterfaces()).flat().find(n=>n?.family==='IPv4'&&!n.internal&&/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address))?.address
  const port=(server.httpServer?.address() as {port?:number}|null)?.port??5186
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store')
  const loopback=/^(127\.0\.0\.1|localhost)(:|$)/.test(req.headers.host??'')
  res.end(JSON.stringify({joinOrigin:loopback&&lan?`http://${lan}:${port}`:`http://${req.headers.host}`}))
 })
 server.httpServer?.on('upgrade',(req,socket,head)=>{
  if(req.url?.split('?')[0]!=='/api/city/socket')return
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host){socket.destroy();return}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req))
 })
 wss.on('connection',ws=>{
  let messages=0;const rate=setInterval(()=>{messages=0},1000)
  ws.on('message',raw=>{try{
   if(++messages>65)throw new Error('Too many controller messages.')
   const m=JSON.parse(raw.toString()),now=Date.now()
   if(!m||typeof m!=='object')throw new Error('Invalid city request.')
   if(m.type==='create'){
    if(clients.has(ws))throw new Error('Already connected.')
    if(rooms.size>=20)throw new Error('Close an older city before opening another.')
    const room=new CityRoom();while(rooms.has(room.code))room.code=String(100000+Math.floor(Math.random()*900000));rooms.set(room.code,room);clients.set(ws,{room,id:'host',token:room.hostToken});send(ws,{type:'joined',credentials:room.hostCredentials()})
   }else if(m.type==='join'||m.type==='resume'){
    if(clients.has(ws))throw new Error('Already connected.')
    const room=rooms.get(String(m.code));if(!room)throw new Error('City not found. Check the code with your teacher.')
    const credentials=m.type==='join'?room.join(m.name,m.avatar,now):{code:room.code,token:m.token,role:room.authenticate(m.token)==='host'?'host':'player',playerId:room.authenticate(m.token)}
    const id=room.authenticate(credentials.token)
    // A resumed controller takes over from its previous connection.
    for(const [old,client] of clients)if(client.room===room&&client.token===credentials.token){clients.delete(old);old.close(4001,'Connected on another screen')}
    const player=room.players.get(id);if(player)player.online=true
    clients.set(ws,{room,id,token:credentials.token});send(ws,{type:'joined',credentials})
   }else{
    const client=clients.get(ws);if(!client)throw new Error('Join the city first.')
    if(m.type==='move')client.room.commands(client.id,m.commands,now)
    else if(m.type==='input')client.room.input(client.id,m.x,m.y,now)
    else if(m.type==='action')client.room.action(client.id,m.action,now)
    else if(m.type==='control'){client.room.control(client.token,m.action,m.value);if(m.action==='remove')for(const [peer,other] of clients)if(other.room===client.room&&other.id===m.value)peer.close(4002,'Your teacher removed you from this city. You can join again.')}
    else throw new Error('Unknown request.')
   }
  }catch(error){send(ws,{type:'error',message:error instanceof Error?error.message:'Could not connect.'})}})
  ws.on('close',()=>{clearInterval(rate);const c=clients.get(ws);if(c)c.room.disconnect(c.id);clients.delete(ws)})
 })
 let previous=Date.now(),frame=0
 const timer=setInterval(()=>{const now=Date.now(),dt=(now-previous)/1000;previous=now
  for(const [code,room] of rooms){room.tick(dt,now);if(now-room.createdAt>8*60*60*1000){rooms.delete(code);for(const [ws,c] of clients)if(c.room===room)ws.close(4002,'City closed')}}
  if(++frame%2===0)for(const [ws,c] of clients)send(ws,{type:'state',state:c.room.state(now)})
 },1000/30)
 server.httpServer?.once('close',()=>{clearInterval(timer);for(const ws of wss.clients)ws.terminate();wss.close()})
}}}
