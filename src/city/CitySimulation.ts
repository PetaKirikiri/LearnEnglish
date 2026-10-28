import { atDestination, movePlayer, places, type CityState, type CityPlayer, type CityCredentials, type PlaceId } from './world'
import type { MoveCommand } from './prediction'
const token=()=>crypto.randomUUID()+crypto.randomUUID()
export class CityRoom {
 code=String(100000+crypto.getRandomValues(new Uint32Array(1))[0]%900000);hostToken=token();target:PlaceId='hotel';paused=false
 players=new Map<string,CityPlayer>();tokens=new Map<string,string>();lastInput=new Map<string,number>();lastAction=new Map<string,number>()
 movementBudget=new Map<string,{at:number;seconds:number}>()
 createdAt=Date.now()
 hostCredentials():CityCredentials{return {code:this.code,token:this.hostToken,role:'host'}}
 join(name:unknown,avatar:unknown,now:number){
  if(typeof name!=='string'||!name.trim()||name.trim().length>18)throw new Error('Enter a name with 1–18 characters.')
  if(this.players.size>=16)throw new Error('This city is full (16 players).')
  const id=crypto.randomUUID(),secret=token(),i=this.players.size
  const player:CityPlayer={id,name:name.trim(),avatar:typeof avatar==='number'&&Number.isInteger(avatar)?Math.max(0,Math.min(3,avatar)):i%4,x:555+(i%4)*26,y:596+Math.floor(i/4)*22,dx:0,dy:0,facing:'down',online:true,speech:'',speechUntil:0,found:false}
  this.players.set(id,player);this.tokens.set(secret,id);this.lastInput.set(id,now)
  return {code:this.code,token:secret,role:'player' as const,playerId:id}
 }
 authenticate(secret:unknown){if(typeof secret!=='string')throw new Error('Reconnect using your controller.');if(secret===this.hostToken)return 'host';const id=this.tokens.get(secret);if(!id)throw new Error('This controller is not recognised.');return id}
 input(id:string,x:unknown,y:unknown,now:number){const p=this.players.get(id);if(!p)throw new Error('Join the city first.');if(typeof x!=='number'||typeof y!=='number'||!Number.isFinite(x)||!Number.isFinite(y))throw new Error('Invalid movement.');p.dx=this.paused?0:Math.max(-1,Math.min(1,x));p.dy=this.paused?0:Math.max(-1,Math.min(1,y));this.lastInput.set(id,now)}
 commands(id:string,value:unknown,now:number){
  const player=this.players.get(id);if(!player)throw new Error('Join the city first.')
  if(!Array.isArray(value)||value.length<1||value.length>12)throw new Error('Invalid movement packet.')
  const commands=value as MoveCommand[]
  if(commands.some(c=>!c||!Number.isSafeInteger(c.seq)||c.seq<1||c.seq>1e12||!Number.isFinite(c.x)||Math.abs(c.x)>1||!Number.isFinite(c.y)||Math.abs(c.y)>1||!Number.isFinite(c.seconds)||c.seconds<0||c.seconds>.05))throw new Error('Invalid movement command.')
  const budget=this.movementBudget.get(id)??{at:now,seconds:.1}
  budget.seconds=Math.min(.15,budget.seconds+Math.max(0,now-budget.at)/1000);budget.at=now
  for(const c of commands){
   if(c.seq<=(player.inputAck??0))continue
   const seconds=Math.min(c.seconds,budget.seconds);budget.seconds-=seconds
   player.dx=this.paused?0:c.x;player.dy=this.paused?0:c.y
   movePlayer(player,seconds);player.inputAck=c.seq
  }
  this.movementBudget.set(id,budget);this.lastInput.set(id,now)
 }
 action(id:string,kind:unknown,now:number){
  const p=this.players.get(id);if(!p)throw new Error('Join the city first.')
  if(kind==='stop'){p.dx=0;p.dy=0}
  if(now-(this.lastAction.get(id)??0)<350)return
  this.lastAction.set(id,now)
  if(kind==='ask')p.speech=`Where is the ${places.find(place=>place.id===this.target)!.name}?`
  else if(kind==='stop')p.speech='Stop!'
  else if(kind==='here'){if(atDestination(p,this.target)){p.found=true;p.speech='Here! ✓'}else p.speech='Here?'}
  else throw new Error('Unknown action.')
  p.speechUntil=now+4000
 }
 control(secret:string,kind:unknown,value:unknown){
  if(this.authenticate(secret)!=='host')throw new Error('Only the teacher can change the city.')
  if(kind==='target'){if(!places.some(p=>p.id===value))throw new Error('Choose a place.');this.target=value as PlaceId;for(const p of this.players.values()){p.found=false;p.speech=''}}
  else if(kind==='pause'){this.paused=!this.paused;for(const p of this.players.values()){p.dx=0;p.dy=0}}
  else if(kind==='remove'){const id=String(value);this.players.delete(id);this.lastInput.delete(id);this.movementBudget.delete(id);for(const [key,pid] of this.tokens)if(pid===id)this.tokens.delete(key)}
  else throw new Error('Unknown teacher action.')
 }
 tick(seconds:number,now:number){for(const p of this.players.values()){if(now-(this.lastInput.get(p.id)??0)>450||!p.online||this.paused){p.dx=0;p.dy=0}if(p.inputAck===undefined)movePlayer(p,Math.min(.1,Math.max(0,seconds)));if(now>p.speechUntil)p.speech=''}}
 disconnect(id:string){const p=this.players.get(id);if(p){p.online=false;p.dx=0;p.dy=0}}
 state(now:number):CityState{return {code:this.code,target:this.target,paused:this.paused,players:[...this.players.values()].map(p=>({...p})),now}}
}
