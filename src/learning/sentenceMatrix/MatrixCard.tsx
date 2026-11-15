import {useCallback,useEffect,useId,useRef,type ReactNode} from 'react'
import './matrixPlayback.css'
import type {AudioWaveState} from '../../audio/audioWaveform'
import SentenceSlot from '../SentenceSlot'
const waveStops=Array.from({length:65},(_,index)=>{
  const position=index/64
  const green=Math.round(127.5+127.5*Math.sin(position*Math.PI*8))
  return `<stop offset="${position}" stop-color="rgb(128,${green},128)"/>`
}).join('')
const waveMap='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="2"><defs><linearGradient id="wave">${waveStops}</linearGradient></defs><path fill="url(#wave)" d="M0 0h400v2H0z"/></svg>`)

export default function MatrixCard({slot,children,action,control,affordance,className='',disabled=false,unitIndex,wordType,typeLabel,spokenWord,waveDistance,audioWave}: {
  audioWave?:AudioWaveState;waveDistance?:number;spokenWord?:number;wordType?:string;typeLabel?:string;unitIndex?:number;slot:number;children:ReactNode;control?:ReactNode;affordance?:ReactNode;className?:string;disabled?:boolean;
  action?:{label:string;expanded?:boolean;controls?:string;onClick:()=>void}
}) {
  const cardRef=useRef<HTMLElement|null>(null)
  const setCard=useCallback((element:HTMLElement|null)=>{cardRef.current=element},[])
  const filterId='speech-wave-'+useId().replace(/[^a-zA-Z0-9-]/g,'')
  const displacement=useRef<SVGFEDisplacementMapElement|null>(null)
  const map=useRef<SVGFEImageElement|null>(null)
  useEffect(()=>{
    const card=cardRef.current
    const distance=waveDistance===undefined?Infinity:Math.abs(waveDistance)
    if(!card||!audioWave||distance!==0||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return
    const surface=card
    const height=Math.max(1,card.getBoundingClientRect().height)
    const maximumDisplacement=16/height
    let frame=0,energy=0
    surface.style.filter=`url(#${filterId})`
    function ripple(){
      const target=Math.min(1,audioWave!.level*1.4)
      energy+=(target-energy)*.25
      // Real syllable energy drives how far the tile bends. Silence settles it.
      displacement.current?.setAttribute('scale',String(maximumDisplacement*energy))
      map.current?.setAttribute('x',String(-1-(audioWave!.time*1.4)%1))
      frame=requestAnimationFrame(ripple)
    }
    frame=requestAnimationFrame(ripple)
    return()=>{
      cancelAnimationFrame(frame)
      surface.style.removeProperty('filter')
      displacement.current?.setAttribute('scale','0')
    }
  },[waveDistance,spokenWord,filterId,audioWave])
  const distortion=<svg aria-hidden="true" focusable="false" style={{position:'absolute',width:0,height:0,pointerEvents:'none'}}>
    <defs><filter id={filterId} x="-.25" y="-.3" width="1.5" height="1.7" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
      <feImage ref={map} href={waveMap} x="-1" y="-.25" width="4" height="1.5" preserveAspectRatio="none" result="wave"/>
      <feDisplacementMap ref={displacement} in="SourceGraphic" in2="wave" scale="0" xChannelSelector="R" yChannelSelector="G"/>
    </filter></defs>
  </svg>
  const content=<SentenceSlot slot={slot}>{children}</SentenceSlot>
  const card=action ? <button ref={setCard} data-wave-distance={waveDistance} data-speaking={spokenWord!==undefined||undefined} data-spoken-word={spokenWord} type="button" data-word-type={wordType} title={typeLabel} data-unit-index={unitIndex} className={`tonight-slot slot-${slot}${className ? ` ${className}`:''}`} disabled={disabled} aria-label={action.label} aria-expanded={action.expanded} aria-controls={action.controls} onClick={action.onClick}>{content}{affordance}</button> : <span ref={setCard} data-wave-distance={waveDistance} data-speaking={spokenWord!==undefined||undefined} data-spoken-word={spokenWord} data-unit-index={unitIndex} data-word-type={wordType} title={typeLabel} className={`tonight-slot slot-${slot}`}>{content}</span>
  return <>{distortion}{control ? <span className={`cw-slot-shell cw-slot-shell-${slot}`}>{card}{control}</span> : card}</>
}
