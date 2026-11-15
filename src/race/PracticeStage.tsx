import {createPortal} from 'react-dom'
import PlaybackButtons from '../audio/PlaybackButtons'
import {useLayoutEffect,useRef,useState,type ReactNode,type ComponentProps} from 'react'
import {AssessmentSentence,AssessmentSentenceContext} from './AssessmentSentenceLayout'
import BinaryAnswerZone from './BinaryAnswerZone'
import './practiceStage.css'

type StageProps={
 question:ReactNode
 prompt?:string
 playbackError?:boolean
 playbackLoading?:boolean
 playbackStatus?:string
 answers:ComponentProps<typeof BinaryAnswerZone>
 correct:boolean|null
 onNext:()=>void
 explanation:(close:()=>void)=>ReactNode
 onHelp?:()=>void
 onReplay?:()=>void
 teacherControlled?:boolean
}
export default function PracticeStage({question,answers,correct,onNext,explanation,onHelp,onReplay,playbackError=false,playbackLoading=false,playbackStatus='Loading audio…',teacherControlled=false}:StageProps){
 const [helpOpen,setHelpOpen]=useState(false)
 const stage=useRef<HTMLDivElement>(null)
 const [toolbarHost,setToolbarHost]=useState<HTMLElement|null>(null)
 useLayoutEffect(()=>{
  const root=stage.current
  setToolbarHost(root?.closest('.practice-shell')?.querySelector<HTMLElement>('[data-practice-toolbar-host]')??root?.closest('.su-class-panel')?.querySelector<HTMLElement>('[data-practice-toolbar-host]')??null)
 },[])
 useLayoutEffect(()=>{
  const root=stage.current
  if(!root)return
  const viewports=Array.from(root.querySelectorAll<HTMLElement>('.assessment-sentence-viewport'))
  const fit=()=>{
   const lines=viewports.map(viewport=>viewport.firstElementChild as HTMLElement)
   const width=Math.max(360,...lines.map(line=>{
    const slots=line.querySelectorAll('.tonight-slot,.picture-sentence-part').length
    return slots?slots*100:Math.min(1000,Math.max(360,(line.textContent?.length??0)*18))
   }))
   root.style.setProperty('--assessment-line-width',`${width}px`)
   // Give the question its own wide canvas before fitting its height. Uniformly
   // shrinking a narrow canvas left most of a landscape screen unused.
   const question=viewports[0],questionLine=lines[0]
   if(question&&questionLine){
    questionLine.style.width=`${width}px`
    if(question.clientHeight&&questionLine.offsetHeight){
     const heightScale=question.clientHeight/questionLine.offsetHeight
     questionLine.style.width=`${Math.max(width,question.clientWidth/heightScale)}px`
    }
   }
   const scales=viewports.map(viewport=>{
    const line=viewport.firstElementChild as HTMLElement
    return viewport.clientWidth&&viewport.clientHeight&&line.offsetHeight
     ?Math.min(viewport.clientWidth/Math.max(line.offsetWidth,line.scrollWidth),viewport.clientHeight/line.offsetHeight):1
   })
   // Work in layout coordinates: a forced landscape frame can be rotated
   // while the browser still reports a portrait viewport (e.g. LINE/iPhone).
   const layoutBounds=(element:HTMLElement)=>{
    let left=0,top=0,node:HTMLElement|null=element
    while(node&&node!==root){left+=node.offsetLeft;top+=node.offsetTop;node=node.offsetParent as HTMLElement|null}
    return {left,right:left+element.offsetWidth,top,bottom:top+element.offsetHeight}
   }
   const questionViewport=viewports[0]
   if(questionViewport&&lines[0].offsetHeight>0){
    const bounds=layoutBounds(questionViewport),line=lines[0]
    const cx=(bounds.left+bounds.right)/2,cy=(bounds.top+bounds.bottom)/2
    // Keep the centre fixed. Only reduce the fit when a visible control would
    // overlap it; controls on either side must never push the sentence sideways.
    for(const control of root.querySelectorAll<HTMLElement>('.foundation-controls button')){
     if(!control.getClientRects().length)continue
     const box=layoutBounds(control),gap=8
     const horizontal=box.left>=cx?2*(box.left-cx-gap):box.right<=cx?2*(cx-box.right-gap):0
     const vertical=box.top>=cy?2*(box.top-cy-gap):box.bottom<=cy?2*(cy-box.bottom-gap):0
     const clearance=Math.max(horizontal/Math.max(line.offsetWidth,line.scrollWidth),vertical/line.offsetHeight,0)
     scales[0]=Math.min(scales[0],clearance)
    }
   }
   // The taller, captioned question must not shrink the picture-only answers.
   const answerScale=Math.min(...scales.slice(1))
   viewports.forEach((viewport,index)=>viewport.style.setProperty('--assessment-scale',String(index===0?scales[0]:answerScale)))
  }
  fit()
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(fit)
  for(const viewport of viewports){observer?.observe(viewport);if(viewport.firstElementChild)observer?.observe(viewport.firstElementChild)}
  const controls=root.querySelector('.foundation-controls')
  if(controls)observer?.observe(controls)
  window.addEventListener('resize',fit)
  let active=true
  void document.fonts?.ready.then(()=>{if(active)fit()})
  return ()=>{active=false;observer?.disconnect();window.removeEventListener('resize',fit)}
 },[question,answers.choices,toolbarHost])
 const fitChoice=(choice:typeof answers.choices[number])=>({...choice,icon:undefined,content:<AssessmentSentence>{choice.icon?<span className="assessment-choice-with-icon"><span className="binary-answer-icon" aria-hidden="true">{choice.icon}</span><span>{choice.content}</span></span>:choice.content}</AssessmentSentence>})
 const fittedAnswers={...answers,choices:[fitChoice(answers.choices[0]),fitChoice(answers.choices[1])] as const}
 const controls=(<div className="practice-feedback foundation-controls" role="group" aria-label="Playback and help" data-audio-error={playbackError||undefined}>
   {onReplay&&<PlaybackButtons busy={playbackLoading} onPlay={onReplay}/>}
   <button type="button" className="foundation-help" aria-label="อธิบายรูปแบบประโยค" aria-haspopup="dialog" onClick={()=>{onHelp?.();setHelpOpen(true)}}>?</button>
   <span className="foundation-result-announcement" role="status">{correct===null?'':correct?'ถูกต้อง':'ยังไม่ถูก'}</span>
   {playbackLoading&&<span className="practice-audio-status" role="status">{playbackStatus}</span>}
   {!playbackLoading&&playbackError&&<span className="practice-audio-status" role="alert">Audio couldn’t load. Tap to retry.</span>}
  </div>)
 return <div ref={stage} className="practice-stage adaptive-practice-stage" data-toolbar-in-header={!!toolbarHost||undefined}><AssessmentSentenceContext.Provider value={true}>
  {toolbarHost?createPortal(controls,toolbarHost):controls}
  <section className="practice-question" aria-label="Question"><AssessmentSentence>{question}</AssessmentSentence></section>
  <section className="practice-answer-area" aria-label="Answers">
   <BinaryAnswerZone {...fittedAnswers}/>
  </section>
  {!teacherControlled&&correct!==null&&!helpOpen&&<button type="button" className="practice-continue-surface" aria-label="Continue to next question" onClick={event=>{event.preventDefault();event.stopPropagation();onNext()}}/>}
  </AssessmentSentenceContext.Provider>
  {helpOpen&&explanation(()=>setHelpOpen(false))}
 </div>
}
