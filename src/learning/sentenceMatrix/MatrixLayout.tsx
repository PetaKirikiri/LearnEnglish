import NounGroup from './NounGroup'
import NounModeToggle, { type NounSwapperRequest } from './NounModeToggle'
import {useContext,useRef,type CSSProperties,type ReactNode} from 'react'
import useMatrixSizing from './useMatrixSizing'
import {AssessmentSentenceContext} from '../../race/AssessmentSentenceLayout'
import type { MatrixSettings } from './model'
import './matrixLayout.css'

/** Callers describe the construction; this component owns every layout coordinate. */
export type MatrixLayoutRequest = {
  nounSize?:number
  leadingCount?:number
  actionComplement?:boolean
  nounGroups?:readonly {start:number;end:number}[]
  construction: 'identification-answer' | 'identification-question' | 'question' | 'location-answer' | 'noun-phrase' | 'action-question' | 'action-answer'
  noun: 'phrase' | 'single'
  nounSwapper?: NounSwapperRequest
  subjectSwapper?: NounSwapperRequest
  agreementLinks?:readonly {start:number;end:number}[]
}
export default function MatrixLayout({request,settings={},cards:sourceCards,label,translation,tray}:{
  request:MatrixLayoutRequest;settings?:MatrixSettings;cards:ReactNode[];label:string;translation:ReactNode;tray?:ReactNode
}) {
  const root=useRef<HTMLDivElement>(null)
  const assessment=useContext(AssessmentSentenceContext)
  const adaptive=!['briefing','thumbnail'].includes(settings.layout?.density??'comfortable')
  useMatrixSizing(root,adaptive,JSON.stringify([label,request,settings]),assessment)
  const cards:ReactNode[]=[],ranges:{start:number;end:number}[]=[]
  for(let index=0;index<sourceCards.length;index++){
    const group=request.nounGroups?.find(group=>group.start===index)
    if(group){
      if(![2,3].includes(group.end-group.start)||group.end>sourceCards.length)throw new Error('A determiner and noun must occupy separate cards.')
      cards.push(<NounGroup key={index} size={group.end-group.start} label="Subject noun phrase">{sourceCards.slice(group.start,group.end)}</NounGroup>)
      ranges.push(group);index=group.end-1
    }else {cards.push(sourceCards[index]);ranges.push({start:index,end:index+1})}
  }
  const actionRoles=request.construction.startsWith('action-')&&!request.actionComplement
  const originalGroupSize=actionRoles?cards.length-2:request.noun==='phrase'?(request.nounSize??2):1
  let leading=request.leadingCount??(request.construction==='noun-phrase'?0:request.construction==='location-answer'?3:2)
  if(cards.length!==leading+originalGroupSize)throw new Error('Sentence cards do not match the requested matrix construction')
  const agreements=(request.agreementLinks??[]).map(link=>({start:ranges.findIndex(r=>r.start===link.start),end:ranges.findIndex(r=>r.end===link.end)+1})).filter(link=>link.start>=0&&link.end>link.start)
  const crossing=agreements.find(link=>link.start<leading&&link.end>leading)
  if(crossing)leading=crossing.start
  const groupSize=cards.length-leading
  const linked=(start:number,end:number)=>{
   const items:{node:ReactNode;weight:number}[]=[]
   for(let i=start;i<end;i++){
    const link=agreements.find(link=>link.start===i&&link.end<=end)
    if(link){items.push({node:<span key={i} className="matrix-agreement-group" role="group" aria-label="Subject and matching verb" data-link="agreement">{cards.slice(i,link.end)}</span>,weight:link.end-i});i=link.end-1}
    else items.push({node:cards[i],weight:ranges[i].end-ranges[i].start})
   }
   return items
  }
  const head=linked(0,leading),tail=linked(leading,cards.length)
  const agreementTail=agreements.some(link=>link.start===leading&&link.end===cards.length)
  const style={'--matrix-max-width':`${settings.layout?.maxWidth??1100}px`,'--matrix-leading':head.map(item=>`${item.weight}fr`).join(' '),'--matrix-role-columns':tail.map(item=>`${item.weight}fr`).join(' ')} as CSSProperties
  return <div ref={root} data-adaptive={adaptive||undefined} className="example-language example-matrix matrix-layout" data-matrix-layout={request.construction} data-card-count={cards.length} data-action-complement={request.actionComplement||undefined} data-noun-swapper={!!request.nounSwapper&&!settings.fadeMode} data-density={settings.layout?.density??'comfortable'} style={style}>
    <div className="matrix-layout-toolbar" aria-hidden={settings.fadeMode||undefined}>
      <div className="matrix-layout-leading-controls"><div>{!settings.fadeMode&&settings.english!==false&&request.subjectSwapper&&<NounModeToggle {...request.subjectSwapper}/>}</div></div>
      <div className="matrix-layout-noun-control">{!settings.fadeMode&&settings.english!==false&&request.nounSwapper&&<NounModeToggle {...request.nounSwapper}/>}</div>
    </div>
    <div className="tonight-slots" lang={settings.english===false?"th":"en"} aria-label={label}>
      <div className="matrix-layout-leading">{head.map(item=>item.node)}</div>
      {actionRoles||agreementTail?<div className="matrix-role-group" role="group" aria-label={agreementTail?"Subject and matching verb":"Main verb phrase"} data-group-size={groupSize}>
        {!settings.fadeMode&&settings.english!==false&&request.nounSwapper&&<div className="matrix-layout-inline-control"><NounModeToggle {...request.nounSwapper}/></div>}
        {tail.map(item=>item.node)}
      </div>:<NounGroup size={groupSize} label={request.construction==='question'?'Subject':request.construction==='location-answer'?'Location noun phrase':'Object noun phrase'} swapper={settings.fadeMode||settings.english===false?undefined:request.nounSwapper}>{cards.slice(leading)}</NounGroup>}

    </div>
    <div className="matrix-layout-translation">{translation}</div>
    <div className="matrix-layout-dock">{!settings.fadeMode&&tray}</div>
  </div>
}
