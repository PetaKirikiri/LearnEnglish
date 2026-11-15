import {useCallback,useLayoutEffect,useId,useRef,type ReactNode} from 'react'
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
  const distanceRef=useRef<number|undefined>(waveDistance)
  useLayoutEffect(()=>{distanceRef.current=waveDistance},[waveDistance])
  useLayoutEffect(()=>{
    const card=cardRef.current
    if(!card||!audioWave||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return
    const surface=card
    let maximumDisplacement=0
    const measure=()=>{maximumDisplacement=16/Math.max(1,card.getBoundingClientRect().height)}
    measure()
    const observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(measure)
    observer?.observe(surface)
    let frame=0,energy=0,previous=performance.now()
    const displacementNode=displacement.current,mapNode=map.current
    function ripple(now=performance.now()){
      const delta=Math.min(.05,Math.max(0,(now-previous)/1000));previous=now
      let sweep=distanceRef.current===0?1:0
      const timing=audioWave!.recording?.timing
      if(timing&&sweep){
        const word=timing.words.find(word=>word.startTime<=audioWave!.time&&audioWave!.time<word.endTime)
        if(word){
          const position=(audioWave!.time-word.startTime)/Math.max(.001,word.endTime-word.startTime)
          sweep=Math.sin(Math.PI*position)**2
        }else sweep=0
      }
      const target=Math.min(1,audioWave!.level*1.4)*sweep
      energy=sweep===0?0:audioWave!.progress===undefined?target:energy+(target-energy)*(1-Math.exp(-delta/.035))
      if(sweep>0)surface.style.setProperty('--tile-wave-filter',`url(#${filterId})`);else surface.style.removeProperty('--tile-wave-filter')
      // Real syllable energy drives how far the tile bends. Silence settles it.
      displacementNode?.setAttribute('scale',String(maximumDisplacement*energy))
      mapNode?.setAttribute('x',String(-1-(audioWave!.time*1.4)%1))
      frame=requestAnimationFrame(ripple)
    }
    ripple()
    return()=>{
      cancelAnimationFrame(frame);observer?.disconnect()
      surface.style.removeProperty('--tile-wave-filter')
      displacementNode?.setAttribute('scale','0')
    }
  },[filterId,audioWave])
  const distortion=<svg aria-hidden="true" focusable="false" style={{position:'absolute',width:0,height:0,pointerEvents:'none'}}>
    <defs><filter id={filterId} x="-.25" y="-.3" width="1.5" height="1.7" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
      <feImage ref={map} href={waveMap} x="-1" y="-.25" width="4" height="1.5" preserveAspectRatio="none" result="wave"/>
      <feDisplacementMap ref={displacement} in="SourceGraphic" in2="wave" scale="0" xChannelSelector="R" yChannelSelector="G"/>
    </filter></defs>
  </svg>
  const content=<SentenceSlot slot={slot}>{children}</SentenceSlot>
  const surfaceStyle={background:'transparent',borderColor:'transparent',boxShadow:'none',position:'relative',isolation:'isolate'} as const
  const card=action ? <button ref={setCard} style={surfaceStyle} data-wave-distance={waveDistance} data-speaking={spokenWord!==undefined||undefined} data-spoken-word={spokenWord} type="button" data-word-type={wordType} title={typeLabel} data-unit-index={unitIndex} className={`tonight-slot slot-${slot}${className ? ` ${className}`:''}`} disabled={disabled} aria-label={action.label} aria-expanded={action.expanded} aria-controls={action.controls} onClick={action.onClick}>{distortion}{content}{affordance}</button> : <span ref={setCard} style={surfaceStyle} data-wave-distance={waveDistance} data-speaking={spokenWord!==undefined||undefined} data-spoken-word={spokenWord} data-unit-index={unitIndex} data-word-type={wordType} title={typeLabel} className={`tonight-slot slot-${slot}`}>{distortion}{content}</span>
  return <>{control ? <span className={`cw-slot-shell cw-slot-shell-${slot}`}>{card}{control}</span> : card}</>
}
