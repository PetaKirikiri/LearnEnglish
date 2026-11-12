import {useEffect,useRef,type ReactNode,type SyntheticEvent} from 'react'
import {controllerExpanded,enterControllerFullscreen} from '../city/fullscreen'
import './landscapePractice.css'

/** Same game fullscreen/lock request as City. The canvas itself is ALWAYS
 * landscape, even inside LINE when native locking/fullscreen is unavailable.
 * CSS rotates the viewport, not the children: rotating never remounts a question. */
export default function LandscapePractice({children,enabled=true}:{children:ReactNode;enabled?:boolean}){
 const requested=useRef(false),owned=useRef(false),active=useRef(true)
 const leave=()=>{
  const doc=document as Document&{webkitExitFullscreen?:()=>void}
  try{if(doc.fullscreenElement)void doc.exitFullscreen?.().catch(()=>{});else doc.webkitExitFullscreen?.()}catch{/* Leaving the page must remain possible. */}
 }
 const enter=(event:SyntheticEvent)=>{
  if(!enabled||requested.current||(event.target as HTMLElement).closest('a,.practice-header-exit'))return
  requested.current=true
  const expanded=controllerExpanded()
  void enterControllerFullscreen().then(result=>{if(result==='entered'&&!expanded){owned.current=true;if(!active.current)leave()}})
 }
 useEffect(()=>{active.current=true;return()=>{active.current=false;if(owned.current)leave()}},[])
 if(!enabled)return <>{children}</>
 return <div className="practice-landscape-viewport" onClickCapture={enter} onKeyDownCapture={enter}>
  <div className="practice-landscape-frame">{children}</div>
 </div>
}
