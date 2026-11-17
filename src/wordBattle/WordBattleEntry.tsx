import {useEffect,useRef,useState} from 'react'
import QRCode from 'qrcode'
import {supabase} from '../lib/supabase'
import {recogniseHomeworkAccount} from '../auth/homeworkLine'
import WordBattle from './WordBattle'
import type {Game} from './WordBattle'
import type {Board,Tile} from './tableEngine'
import './wordBattle.css'
type View={code:string;revision:number;me:number;token?:string;players:{name:string;online:boolean}[];start:number;serverNow:number;time:number;self:{board:Board;shop:(Tile|null)[];gold:number;tier:number};rival:null|{gold:number;board:boolean[];shop:boolean[];income:number}}
type Credentials={code:string;token:string}
export function roomFromQuery(search:string){const q=new URLSearchParams(search);const raw=q.get('liff.state')??'';const nested=new URLSearchParams(raw.includes('?')?raw.slice(raw.indexOf('?')+1):raw);return q.get('room')??nested.get('room')??''}
export default function WordBattleEntry(){
 const [room,setRoom]=useState<View|null>(null),[credentials,setCredentials]=useState<Credentials|null>(null)
 const [name,setName]=useState(''),[code,setCode]=useState(()=>roomFromQuery(location.search)),[error,setError]=useState(''),[busy,setBusy]=useState(false),[qr,setQr]=useState('')
 const revision=useRef(-1),credentialsRef=useRef<Credentials|null>(null),busyRef=useRef(false),polling=useRef(false)
 useEffect(()=>{document.title='Word Table · EnglishSuccess';document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href','/brand/word-table.png');try{const saved=JSON.parse(sessionStorage.getItem('word-table:room')??'null') as Credentials|null;const requested=roomFromQuery(location.search);if(saved?.token&&saved.code&&(!requested||requested===saved.code)){credentialsRef.current=saved;setCredentials(saved)}}catch{}},[])
 function accept(view:View){if(view.revision<revision.current)return;revision.current=view.revision;setRoom(view);setError('')}
 async function request(action:string,body:Record<string,unknown>={},auth=credentialsRef.current){
  const response=await fetch('/api/word-battle',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${auth.token}`}:{})},body:JSON.stringify({action,code:auth?.code??code,id:crypto.randomUUID(),...body}),signal:AbortSignal.timeout(12000)})
  const result=await response.json();if(!response.ok||result.error)throw new Error(result.error??'Connection failed.')
  return result as View
 }
 async function enter(action:'create'|'join'){
  if(busyRef.current)return;busyRef.current=true;setBusy(true);setError('')
  try{const view=await request(action,{name:name.trim()||'Player',code},null);const auth={code:view.code,token:view.token!};credentialsRef.current=auth;setCredentials(auth);try{sessionStorage.setItem('word-table:room',JSON.stringify(auth))}catch{}accept(view)}catch(e){setError(e instanceof Error?e.message:'Could not connect.')}finally{busyRef.current=false;setBusy(false)}
 }
 async function send(action:string,body:Record<string,unknown>={}){
  if(busyRef.current)return;busyRef.current=true;setBusy(true)
  try{accept(await request(action,body))}catch(e){setError(e instanceof Error?e.message:'Connection lost. Try again.')}finally{busyRef.current=false;setBusy(false)}
 }
 useEffect(()=>{
  if(!credentials)return
  let active=true
  async function poll(){if(polling.current||busyRef.current)return;polling.current=true;try{const view=await request('state',{},credentials);if(active)accept(view)}catch(e){if(active)setError(e instanceof Error?e.message:'Reconnecting…')}finally{polling.current=false}}
  void poll();const timer=window.setInterval(()=>void poll(),1000)
  return()=>{active=false;window.clearInterval(timer)}
 },[credentials])
 useEffect(()=>{let active=true;async function identify(){try{if(/Line\//i.test(navigator.userAgent)||new URLSearchParams(location.search).has('liff.state'))await recogniseHomeworkAccount();const {data}=await supabase.auth.getSession();const m=data.session?.user.user_metadata;const known=String(m?.display_name??m?.name??'').slice(0,18);if(active&&known)setName(old=>old||known)}catch{/* Naming the player manually keeps the room available if LINE auth is slow. */}}void identify();return()=>{active=false}},[])
 const joinUrl=room?`https://liff.line.me/2010311582-ziuNvGjb?view=word-battle&room=${room.code}`:''
 useEffect(()=>{if(joinUrl)void QRCode.toDataURL(joinUrl,{width:240,margin:2}).then(setQr)},[joinUrl])
 function leave(){credentialsRef.current=null;setCredentials(null);setRoom(null);revision.current=-1;try{sessionStorage.removeItem('word-table:room')}catch{}setError('')}
 if(new URLSearchParams(location.search).has('solo'))return <WordBattle/>
 if(room?.start){
  const rival=room.rival!
  const game:Game={board:room.self.board,shop:room.self.shop,gold:room.self.gold,tier:room.self.tier,time:room.time,rival:rival.board.map((full,i)=>full?{id:10000+i,word:'',rank:0}:null),rivalGold:rival.gold,rivalShop:rival.shop,active:room.serverNow>=room.start}
  return <><WordBattle online={{game,code:room.code,host:room.me===0,opponent:room.players[1-room.me]?.name??'Opponent',income:rival.income,busy,starting:Math.max(0,Math.ceil((room.start-room.serverNow)/1000)),send}}/>{error&&<div className="wt-network" role="alert">{error} <button onClick={()=>void send('state')}>Retry</button></div>}{!room.players[1-room.me]?.online&&<span className="wt-offline">Opponent reconnecting…</span>}</>
 }
 return <main className="wt-lobby"><section><img className="wt-app-icon" src="/brand/word-table.png" alt="Word Table"/><h1>Word Table</h1>
  {!room?<><input aria-label="Your name" placeholder="Your name" value={name} maxLength={18} onChange={e=>setName(e.target.value)}/><button className="wt-main-button" disabled={busy||!!credentials} onClick={()=>void enter('create')}>{credentials?'Reconnecting…':'Create game'}</button><div className="wt-join"><input aria-label="Game code" placeholder="6-digit code" inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/><button disabled={busy||code.length!==6||!!credentials} onClick={()=>void enter('join')}>Join</button></div>{credentials&&<button onClick={leave}>Back</button>}</>:
  <><div className="wt-room-code">{room.code}</div><div className="wt-members">{room.players.map((p,i)=><span key={i}>● {p.name}{i===room.me?' (you)':''}</span>)}{room.players.length<2&&<span>Waiting for opponent…</span>}</div>{room.me===0&&room.players.length<2&&<>{qr&&<img className="wt-join-qr" src={qr} alt="Scan to join this game in LINE"/>}<a href={joinUrl}>Join link</a></>}{room.me===0?<button className="wt-main-button" disabled={busy||room.players.length<2} onClick={()=>void send('start')}>Start game</button>:<p>Waiting for host to start…</p>}<button onClick={leave}>Leave room</button></>}
  {error&&<p role="alert">{error}</p>}
 </section></main>
}
