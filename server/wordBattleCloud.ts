import {createHash,randomBytes,randomInt} from 'node:crypto'
import type {IncomingMessage,ServerResponse} from 'node:http'
import {emptyBoard,merge,move,offers,production} from '../src/wordBattle/tableEngine'
import type {Board,Tile} from '../src/wordBattle/tableEngine'
export type Player={name:string;hash:string;board:Board;shop:(Tile|null)[];gold:number;tier:number;seen:number;receipts:string[]}
export type Room={kind:'word-battle';created:number;start:number;ticks:number;players:Player[];nextId:number}
export type Row={code:string;revision:number;data:Room}
export type Store={insert(row:Row):Promise<boolean>;read(code:string):Promise<Row|null>;save(row:Row):Promise<boolean>}
class GameError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status}}
function fail(message:string,status=400):never{throw new GameError(message,status)}
const hash=(s:string)=>createHash('sha256').update(s).digest('hex')
function player(name:string,token:string,now:number,base:number):Player{return{name,hash:hash(token),board:emptyBoard(),shop:[{id:base,word:'the',rank:0},{id:base+1,word:'doctor',rank:0},{id:base+2,word:'is',rank:0},{id:base+3,word:'reading',rank:0}],gold:8,tier:1,seen:now,receipts:[]}}
function settle(room:Room,now:number){if(!room.start)return;const ticks=Math.min(30,Math.max(0,Math.floor((now-room.start)/10000)));if(ticks>room.ticks){for(const p of room.players)p.gold+=(ticks-room.ticks)*(1+production(p.board).net);room.ticks=ticks}}
function view(row:Row,me:number,now:number,token?:string){const d=row.data;const other=d.players[1-me];return{code:row.code,revision:row.revision+1,me,token,players:d.players.map(p=>({name:p.name,online:now-p.seen<12000})),start:d.start,serverNow:now,time:d.start?Math.min(300,Math.max(0,Math.floor((now-d.start)/1000))):0,self:{board:d.players[me].board,shop:d.players[me].shop,gold:d.players[me].gold,tier:d.players[me].tier},rival:other?{gold:other.gold,board:other.board.map(Boolean),shop:other.shop.map(Boolean),income:1+production(other.board).net}:null}}
export async function roomAction(store:Store,action:string,body:Record<string,unknown>,token:string,now=Date.now()){
 const name=String(body.name??'Player').trim().slice(0,18)||'Player'
 if(action==='create'){
  const key=randomBytes(32).toString('base64url')
  for(let tries=0;tries<8;tries++){const row:Row={code:String(randomInt(100000,1000000)),revision:0,data:{kind:'word-battle',created:now,start:0,ticks:0,players:[player(name,key,now,1)],nextId:100}};if(await store.insert(row))return view(row,0,now,key)}
  fail('Could not open a game. Try again.',503)
 }
 const code=String(body.code??'');if(!/^\d{6}$/.test(code))fail('Enter the six-digit game code.')
 for(let tries=0;tries<10;tries++){
  const row=await store.read(code);if(!row||row.data.kind!=='word-battle'||now-row.data.created>8*3600000)fail('Game not found. Check the code.',404)
  const d=row.data
  if(action==='join'){
   if(d.players.length>=2)fail('This game already has two players.',409)
   const key=randomBytes(32).toString('base64url');d.players.push(player(name,key,now,20))
   if(await store.save(row))return view(row,1,now,key);continue
  }
  const me=d.players.findIndex(p=>p.hash===hash(token));if(me<0)fail('Rejoin using the game code.',403)
  const p=d.players[me];p.seen=now;settle(d,now)
  const receipt=String(body.id??'')
  if(action!=='state'&&(!/^[a-zA-Z0-9-]{8,80}$/.test(receipt)))fail('Invalid action ID.')
  if(action!=='state'&&p.receipts.includes(receipt))return view(row,me,now)
  const finished=!!d.start&&now-d.start>=300000
  if(action==='start'){
   if(me!==0)fail('The host starts the game.',403)
   if(d.players.length!==2)fail('Wait for your opponent.')
   if(!d.start)d.start=now+3000
  }else if(action==='rematch'){
   if(me!==0||!finished)fail('The host can restart after the result.')
   d.start=now+3000;d.ticks=0
   d.players=d.players.map((old,i)=>({...player(old.name,'',now,i?20:1),hash:old.hash,receipts:old.receipts}))
  }else if(action!=='state'){
   if(!d.start||now<d.start)fail('Wait for the start.')
   if(finished)fail('The round has finished.')
   const to=Number(body.to),from=Number(body.from)
   const slot=(n:number)=>Number.isInteger(n)&&n>=0&&n<14
   if(action==='buy'){
    if(!slot(to)||!Number.isInteger(from)||from<0||from>=4||!p.shop[from]||p.board[to])fail('Choose an empty slot.')
    if(p.gold<1)fail('Not enough gold.')
    p.board[to]=p.shop[from];p.shop[from]=null;p.gold--;p.board=merge(p.board)
   }else if(action==='move'){
    if(!slot(to)||!slot(from)||!p.board[from])fail('Choose a card and slot.')
    p.board=move(p.board,from,to)
   }else if(action==='sell'){
    if(!slot(from)||!p.board[from])fail('Card not found.')
    p.board[from]=null;p.gold--
   }else if(action==='refresh'){
    if(p.gold<1)fail('Not enough gold.');p.gold--;p.shop=offers(p.tier,()=>d.nextId++,p.board)
   }else if(action==='tier'){
    const cost=p.tier*5;if(p.tier>=3||p.gold<cost)fail('Not enough gold to upgrade.')
    p.gold-=cost;p.tier++
   }else fail('Unknown action.',404)
  }
  if(action!=='state')d.players[me].receipts=[...d.players[me].receipts,receipt].slice(-40)
  if(await store.save(row))return view(row,me,now)
 }
 fail('Game is busy. Try again.',409)
}
export function cloudStore():Store{
 const url=process.env.CITY_SUPABASE_URL||process.env.VITE_SUPABASE_URL,key=process.env.CITY_SUPABASE_SERVICE_KEY
 if(!url||!key)fail('Game connection unavailable.',503)
 async function request(path:string,method:string,data?:unknown){const r=await fetch(`${url}/rest/v1/english_city_rooms${path}`,{method,headers:{apikey:key!,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'},body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(8000)});if(r.status===409&&method==='POST')return null;if(!r.ok)throw new Error(`Room storage ${r.status}`);return r.json()}
 return{insert:async row=>!!await request('','POST',row),read:async code=>(await request(`?code=eq.${code}&select=code,revision,data`,'GET'))[0]??null,save:async row=>(await request(`?code=eq.${row.code}&revision=eq.${row.revision}`,'PATCH',{data:row.data,revision:row.revision+1})).length===1}
}
export function memoryStore():Store{const rows=new Map<string,Row>();return{insert:async row=>{if(rows.has(row.code))return false;rows.set(row.code,structuredClone(row));return true},read:async code=>structuredClone(rows.get(code)??null),save:async row=>{if(rows.get(row.code)?.revision!==row.revision)return false;rows.set(row.code,{...structuredClone(row),revision:row.revision+1});return true}}}
export function handlerWith(store?:Store){return async(req:IncomingMessage&{body?:unknown},res:ServerResponse)=>{
 res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store')
 try{
  if(req.method!=='POST')fail('Use POST.',405)
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)fail('Use the game link.',403)
  if(!req.headers['content-type']?.startsWith('application/json'))fail('Use JSON.',415)
  let raw=req.body===undefined?'':typeof req.body==='string'?req.body:JSON.stringify(req.body)
  if(req.body===undefined)for await(const part of req){raw+=part;if(raw.length>4096)fail('Request too large.',413)}
  if(raw.length>4096)fail('Request too large.',413)
  let body:Record<string,unknown>;try{body=JSON.parse(raw)}catch{fail('Invalid request.')}
  if(!body||typeof body!=='object'||Array.isArray(body))fail('Invalid request.')
  const action=String(body.action??'')
  res.end(JSON.stringify(await roomAction(store??cloudStore(),action,body,String(req.headers.authorization??'').replace(/^Bearer /,''))))
 }catch(error){res.statusCode=error instanceof GameError?error.status:503;if(!(error instanceof GameError))console.error('Word game:',error instanceof Error?error.message:'Unknown');res.end(JSON.stringify({error:error instanceof GameError?error.message:'Connection failed. Try again.'}))}
}}
export default handlerWith()
