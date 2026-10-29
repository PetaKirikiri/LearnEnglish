import { useEffect, useState, useSyncExternalStore } from 'react'
import QRCode from 'qrcode'
import CityCanvas from './CityCanvas'
import Joystick from './Joystick'
import { useCityPrediction } from './useCityPrediction'
import { places, questionLead, type PlaceId } from './world'
import { useCityConnection } from './useCityConnection'
import { controllerExpanded, enterControllerFullscreen, subscribeControllerExpanded } from './fullscreen'
import FullscreenHelp from './FullscreenHelp'
import './city.css'
import { supabase } from '../lib/supabase'
import { finishHotelReturn } from '../hotel/accountHandoff'
import { homeworkLiffId, recogniseHomeworkAccount } from '../auth/homeworkLine'
import { cityInvitation } from './invitation'

function ActionIcon({kind}:{kind:'ask'|'stop'|'here'}){return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind==='ask'?<path d="M26 15c0 6-5 10-11 10H7l-5 4 1-9A11 11 0 0 1 2 15C2 8 7 4 14 4S26 8 26 15Z"/>:kind==='here'?<><path d="M16 29s10-10 10-17a10 10 0 0 0-20 0c0 7 10 17 10 17Z"/><circle cx="16" cy="12" r="3"/></>:<path d="M10 17V7c0-3 4-3 4 0V4c0-3 4-3 4 0v3c0-3 4-3 4 0v4c0-3 4-3 4 0v8c0 7-4 11-10 11-4 0-7-3-9-6L3 17c-2-4 2-6 4-2l3 3m4-11v9m4-9v9m4-5v6"/>}</svg>}
function Avatar({index=0}:{index?:number}){return <span className="city-avatar" style={{backgroundPosition:`${index*100/3}% 0%`}} aria-hidden="true"/>}
function CityHost(){
 const connection=useCityConnection('english-city:host'),{state,credentials,status,error,connect,send}=connection
 const keyboard=useCityConnection('english-city:keyboard')
 const [invite,setInvite]=useState(false),[origin,setOrigin]=useState(location.origin),[qr,setQr]=useState('')
 const {joinUrl,shareUrl}=cityInvitation(origin,state?.code??credentials?.code??'',import.meta.env.VITE_LIFF_ID)
 useEffect(()=>{fetch('/api/city/config').then(r=>r.json()).then(data=>setOrigin(data.joinOrigin)).catch(()=>{})},[])
 useEffect(()=>{let active=true;QRCode.toDataURL(joinUrl,{width:240,margin:1}).then(url=>{if(active)setQr(url)});return()=>{active=false}},[joinUrl])
 useKeyboard(keyboard.send,keyboard.status==='connected'&&!state?.paused)
 const target=places.find(p=>p.id===state?.target)??places[0]
 return <main className="city-host">
  <header className="city-toolbar"><a href="/classroom/index.html?lesson=3" className="city-brand"><img src="/brand/englishsuccess-logo.png" alt=""/><span>English<span>Success</span></span></a>
   <label className="city-question"><span>{questionLead(target.id)}</span><select aria-label="Choose destination" value={target.id} disabled={!state} onChange={e=>send({type:'control',action:'target',value:e.target.value})}>{places.map(place=><option key={place.id} value={place.id}>{place.name}?</option>)}</select></label>
   <div className="city-host-actions">{state&&<><button onClick={()=>send({type:'control',action:'pause'})} aria-label={state.paused?'Resume city':'Pause city'}>{state.paused?'▶':'Ⅱ'}</button><button onClick={()=>setInvite(!invite)}>Join · {state.code}</button></>}</div>
  </header>
  <div className="city-stage"><CityCanvas state={state}/>
   {!credentials&&<section className="city-welcome"><h1>A whole city.<br/>One conversation.</h1><p>Find your way together.</p><button className="city-primary" disabled={status==='connecting'} onClick={()=>{connect({type:'create'});setInvite(true)}}>{status==='connecting'?'Connecting…':'Open the city'}</button>{error&&<p role="alert">{error}</p>}</section>}
   {state?.paused&&<div className="city-pause-banner">City paused</div>}
   {credentials&&status!=='connected'&&<div className="city-connection" role="status">Reconnecting to the city… {error}</div>}
   {invite&&state&&<aside className="city-invite"><button className="city-close" aria-label="Close join panel" onClick={()=>setInvite(false)}>×</button><h2>Come explore</h2><p>Scan on your phone</p>{qr&&<img src={qr} alt="Scan to join this city"/>}<strong className="city-room-code">{state.code}</strong><a href={joinUrl} target="_blank" rel="noreferrer">Open controller ↗</a><a className="city-line-invite" href={shareUrl} target="_blank" rel="noreferrer">Invite in LINE ↗</a><p className="city-joined-count">{state.players.filter(p=>p.online).length} players connected</p><div className="city-roster">{state.players.map(p=><span key={p.id}><span>{p.name}{!p.online?' · disconnected':''}</span><button aria-label={`Remove ${p.name}`} onClick={()=>send({type:'control',action:'remove',value:p.id})}>×</button></span>)}</div><button className="city-secondary" onClick={()=>{keyboard.connect({type:'join',code:state.code,name:'Teacher',avatar:0});setInvite(false)}}>Play with keyboard</button></aside>}
  </div>
  {state&&<footer className="city-host-footer"><span>{state.players.filter(p=>p.online).length} exploring · {state.players.filter(p=>p.found).length} arrived</span>{keyboard.status==='connected'&&<span>Arrow keys / WASD · Space: ask · E: here · Esc: stop</span>}<button onClick={()=>document.documentElement.requestFullscreen?.()}>Full screen ↗</button></footer>}
 </main>
}
function useKeyboard(send:(data:Record<string,unknown>)=>void,enabled:boolean,onMove?:(x:number,y:number)=>void){
 useEffect(()=>{if(!enabled)return;const keys=new Set<string>();const movement=()=>{const x=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a')),y=Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w'));if(onMove)onMove(x,y);else send({type:'input',x,y})}
 const down=(e:KeyboardEvent)=>{if((e.target as HTMLElement).closest('input,select,textarea,button'))return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){e.preventDefault();keys.add(k);movement()}else if(!e.repeat&&[' ','e','escape'].includes(k)){e.preventDefault();if(k==='escape'){keys.clear();movement()}send({type:'action',action:k===' '?'ask':k==='e'?'here':'stop'})}}
 const up=(e:KeyboardEvent)=>{keys.delete(e.key.toLowerCase());movement()},stop=()=>{keys.clear();movement()};const timer=setInterval(()=>{if(keys.size)movement()},100)
 window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop)
 return()=>{clearInterval(timer);stop();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',stop)}
 },[enabled,send,onMove])
}
const portraitQuery = '(orientation: portrait)'
function subscribeOrientation(update: () => void) {
 const query = window.matchMedia(portraitQuery)
 query.addEventListener('change', update)
 return () => query.removeEventListener('change', update)
}
function RotatePhone() {
 return <section className="city-rotate" role="status">
  <svg viewBox="0 0 160 120" fill="none" aria-hidden="true"><rect x="34" y="38" width="94" height="54" rx="12" fill="#fff" stroke="currentColor" strokeWidth="6"/><path d="M47 58v15m-7-7h14" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/><circle cx="110" cy="58" r="4" fill="#f14451"/><circle cx="101" cy="72" r="4" fill="#187bef"/><path d="M41 25a53 53 0 0 1 84 3m-1-18 4 21-21-1" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  <h1>Turn your phone sideways</h1><p>หมุนโทรศัพท์เป็นแนวนอน</p><small>If it won’t turn, switch off Portrait Orientation Lock.</small>
 </section>
}
function CityController(){
 const {state,credentials,status,error,connect,send}=useCityConnection('english-city:phone')
 const [name,setName]=useState(''),[code,setCode]=useState(new URLSearchParams(location.search).get('room')??''),[avatar,setAvatar]=useState(0)
 const portrait=useSyncExternalStore(subscribeOrientation,()=>window.matchMedia(portraitQuery).matches)
 useEffect(()=>{
  const meta=document.querySelector<HTMLMetaElement>('meta[name=viewport]'),previous=meta?.content
  if(meta)meta.content='width=device-width, initial-scale=1.0, viewport-fit=cover'
  return()=>{if(meta&&previous!==undefined)meta.content=previous}
 },[])
 const autoEntry=!new URLSearchParams(location.search).has('room')
 const [entryMessage,setEntryMessage]=useState('Opening your city…')
 const [entryNeedsSignIn,setEntryNeedsSignIn]=useState(false)
 const inLine=/Line\//i.test(navigator.userAgent)
 const iphone=/iPhone|iPod/.test(navigator.userAgent)
 useEffect(()=>{
  if(!autoEntry||credentials)return
  let cancelled=false,timer:ReturnType<typeof setTimeout>|undefined
  const ticket=new URLSearchParams(location.hash.slice(1)).get('ticket')
  if(ticket)history.replaceState(null,'',location.pathname+location.search)
  async function enter(){
   try{
   await finishHotelReturn(ticket)
   if(!(await supabase.auth.getSession()).data.session){
    try{await recogniseHomeworkAccount()}catch{if(!cancelled)setEntryNeedsSignIn(true);throw new Error(inLine?'Could not connect your LINE account. Reopen City from the menu.':'Open City from the EnglishSuccess LINE menu to sign in.')}
   }
   if(!cancelled)setEntryNeedsSignIn(false)
   const session=(await supabase.auth.getSession()).data.session
   if(!session)throw new Error('Sign in to EnglishSuccess first, then open the game again.')
   const response=await fetch('/api/city/active',{headers:{Authorization:`Bearer ${session.access_token}`},signal:AbortSignal.timeout(10000)})
   const result=await response.json()
   if(!response.ok){
    if(!cancelled){setEntryMessage(result.error||'Could not open the city.');if(response.status===409||response.status>=500)timer=setTimeout(enter,3000)}
    return
   }
   if(!cancelled){setCode(result.code);connect({type:'join',code:result.code,name:result.name,accountToken:session.access_token})}
   }catch(error){if(!cancelled){setEntryMessage(error instanceof Error?error.message:'Could not connect to the city.')}}
  }
  void enter()
  return()=>{cancelled=true;clearTimeout(timer)}
 },[autoEntry,credentials,connect,inLine])
 const [fullscreenHelp,setFullscreenHelp]=useState(false)
 const expanded=useSyncExternalStore(subscribeControllerExpanded,controllerExpanded)
 const expand=()=>{void enterControllerFullscreen().then(result=>{if(result!=='entered')setFullscreenHelp(true)})}
 const expandButton=!expanded&&!(inLine&&iphone)&&<button className="city-expand" aria-label="Expand controller" title="Expand controller" onClick={expand}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg></button>
 const help=fullscreenHelp&&<FullscreenHelp onClose={()=>setFullscreenHelp(false)}/>
 const [stopVersion,setStopVersion]=useState(0)
 const connected=status==='connected',enabled=connected&&!state?.paused&&!portrait&&!fullscreenHelp
 const {prediction,move,stale}=useCityPrediction(state,credentials?.playerId,enabled,send)
 useKeyboard(send,enabled,move)
 const player=state?.players.find(p=>p.id===credentials?.playerId),target=places.find(p=>p.id===state?.target)
 if(!credentials&&autoEntry)return <main className="city-phone"><section className="city-join-form"><h1>Your city awaits.</h1><p role="status">{error||entryMessage}</p>{entryNeedsSignIn&&!inLine&&<a href={`https://liff.line.me/${homeworkLiffId}?view=city`}>Open in LINE</a>}</section></main>
 if(!credentials)return <main className="city-phone"><form className="city-join-form" onSubmit={e=>{e.preventDefault();(document.activeElement as HTMLElement)?.blur();expand();connect({type:'join',code,name,avatar})}}><img className="city-join-logo" src="/brand/englishsuccess-logo.png" alt="EnglishSuccess"/><h1>Your city awaits.</h1><div className="city-avatar-options">{[0,1,2,3].map(i=><button key={i} type="button" aria-label={`Character ${i+1}`} aria-pressed={avatar===i} onClick={()=>setAvatar(i)}><Avatar index={i}/></button>)}</div><label>Your name<input value={name} onChange={e=>setName(e.target.value)} maxLength={18} autoComplete="given-name" required/></label><label>City code<input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" pattern="[0-9]{6}" required/></label>{error&&<p role="alert">{error}</p>}<button className="city-primary" disabled={status==='connecting'}>{status==='connecting'?'Connecting…':'Let’s explore'}</button></form>{help}</main>
 if(portrait)return <main className="city-phone city-controller city-controller-portrait"><RotatePhone/>{expandButton}{help}</main>
 return <main className="city-phone city-controller city-controller-map">
  <div className="city-phone-world"><CityCanvas state={state} focus={{playerId:credentials.playerId??'',prediction}}/></div>
  <header className="city-player-bar"><span><Avatar index={player?.avatar??avatar}/><strong>{player?.name??name}</strong></span><div className="city-controller-status">{expandButton}<span className={`city-link-state${connected&&!stale?' is-online':''}`} role="status">{state?.paused?'Paused':stale?'Reconnecting…':connected?'Connected':'Reconnecting…'}</span></div></header>
  <section className="city-phone-question"><span>{questionLead(target?.id)}</span><strong>{target?.name??'…'}?</strong>{player?.found&&<small>✓ You found it!</small>}</section>
  <div className="city-controls"><Joystick key={stopVersion} onMove={move} disabled={!enabled||stale}/><div className="city-action-buttons"><button className="city-ask" disabled={!enabled||stale} onClick={()=>send({type:'action',action:'ask'})}><ActionIcon kind="ask"/><span>Ask</span></button><button className="city-stop" disabled={!enabled||stale} onClick={()=>{move(0,0);setStopVersion(v=>v+1);send({type:'action',action:'stop'})}}><ActionIcon kind="stop"/><span>Stop</span></button><button className="city-here" disabled={!enabled||stale} onClick={()=>{move(0,0);setStopVersion(v=>v+1);send({type:'action',action:'here'})}}><ActionIcon kind="here"/><span>Here!</span></button></div></div>
  {help}
  <p className="city-controller-feedback" aria-live="polite">{error||(stale?'Reconnecting…':state?.paused?'City paused':'')}</p>
 </main>
}
export default function CityPage(){useEffect(()=>{const previous=document.title;document.title='EnglishSuccess · City';return()=>{document.title=previous}},[]);return location.pathname.includes('/controller')?<CityController/>:<CityHost/>}
export type {PlaceId}
