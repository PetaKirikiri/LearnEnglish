import {useEffect,useRef,useState,type ReactNode,type SyntheticEvent} from 'react'
import {controllerExpanded,enterControllerFullscreen} from '../city/fullscreen'
import './landscapePractice.css'

/** Same game fullscreen/lock request as City. The canvas itself is ALWAYS
 * landscape, even inside LINE when native locking/fullscreen is unavailable.
 * CSS rotates the viewport, not the children: rotating never remounts a question. */
export default function LandscapePractice({children,enabled=true}:{children:ReactNode;enabled?:boolean}){
 const requested=useRef(false),owned=useRef(false),active=useRef(true),gesture=useRef<{x:number;y:number;moved:boolean}|null>(null)
 const [showSwipeHint,setShowSwipeHint]=useState(true)
 const leave=()=>{
  const doc=document as Document&{webkitExitFullscreen?:()=>void}
  try{if(doc.fullscreenElement)void doc.exitFullscreen?.().catch(()=>{});else doc.webkitExitFullscreen?.()}catch{/* Leaving the page must remain possible. */}
 }
 const enter=(event:SyntheticEvent)=>{
  if(!enabled||requested.current||(event.target as HTMLElement).closest('a,.practice-header-exit'))return
  requested.current=true
  const expanded=controllerExpanded()
  void enterControllerFullscreen().then(result=>{if(result==='entered'&&!expanded){owned.current=true;if(active.current)setShowSwipeHint(false);else leave()}})
 }
 useEffect(()=>{
  if(!enabled)return
  const meta=document.querySelector<HTMLMetaElement>('meta[name=viewport]'),previous=meta?.content
  if(meta)meta.content='width=device-width, initial-scale=1.0, viewport-fit=cover'
  return()=>{if(meta&&previous!==undefined)meta.content=previous}
 },[enabled])
 useEffect(()=>{
  if(!enabled)return
  const update=()=>{if(window.scrollY>24||controllerExpanded())setShowSwipeHint(false)}
  window.addEventListener('scroll',update,{passive:true})
  document.addEventListener('fullscreenchange',update)
  update()
  return()=>{window.removeEventListener('scroll',update);document.removeEventListener('fullscreenchange',update)}
 },[enabled])
 useEffect(()=>{active.current=true;return()=>{active.current=false;if(owned.current)leave()}},[])
 if(!enabled)return <>{children}</>
 return <div className="practice-landscape-viewport"
  onPointerDownCapture={event=>{gesture.current={x:event.clientX,y:event.clientY,moved:false}}}
  onPointerMoveCapture={event=>{
   const start=gesture.current
   if(start&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>12)start.moved=true
  }}
  onPointerCancelCapture={()=>{if(gesture.current)gesture.current.moved=true}}
  onClickCapture={event=>{
   if(gesture.current?.moved){event.preventDefault();event.stopPropagation();return}
   enter(event)
  }} onKeyDownCapture={event=>{gesture.current=null;enter(event)}}>
  <div className="practice-landscape-frame">{children}</div>
  {showSwipeHint&&<p className="practice-swipe-hint" role="status">↑ Swipe up for more screen</p>}
 </div>
}
