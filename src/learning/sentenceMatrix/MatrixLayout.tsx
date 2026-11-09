import NounGroup from './NounGroup'
import NounModeToggle, { type NounSwapperRequest } from './NounModeToggle'
import type { CSSProperties, ReactNode } from 'react'
import type { MatrixSettings } from './model'
import './matrixLayout.css'

/** Callers describe the construction; this component owns every layout coordinate. */
export type MatrixLayoutRequest = {
  leadingCount?:number
  actionComplement?:boolean
  nounGroups?:readonly {start:number;end:number}[]
  construction: 'question' | 'location-answer' | 'noun-phrase' | 'action-question' | 'action-answer'
  noun: 'phrase' | 'single'
  nounSwapper?: NounSwapperRequest
  subjectSwapper?: NounSwapperRequest
  subjectVerbConnection?: 'warm'
}
export default function MatrixLayout({request,settings={},cards:sourceCards,label,translation,tray}:{
  request:MatrixLayoutRequest;settings?:MatrixSettings;cards:ReactNode[];label:string;translation:ReactNode;tray?:ReactNode
}) {
  const cards:ReactNode[]=[]
  for(let index=0;index<sourceCards.length;index++){
    const group=request.nounGroups?.find(group=>group.start===index)
    if(group){
      if(group.end!==group.start+2||group.end>sourceCards.length)throw new Error('A determiner and noun must occupy separate cards.')
      cards.push(<NounGroup key={index} size={2} label="Determiner and noun">{sourceCards.slice(group.start,group.end)}</NounGroup>)
      index=group.end-1
    }else cards.push(sourceCards[index])
  }
  const actionRoles=request.construction.startsWith('action-')&&!request.actionComplement
  const groupSize=actionRoles?cards.length-2:request.noun==='phrase'?2:1
  const leading=request.leadingCount??(request.construction==='noun-phrase'?0:request.construction==='location-answer'?3:2)
  if(cards.length!==leading+groupSize)throw new Error('Sentence cards do not match the requested matrix construction')
  const style={'--matrix-max-width':`${settings.layout?.maxWidth??1100}px`,...(request.leadingCount?{'--matrix-leading':request.actionComplement&&leading===3?'0.85fr 0.75fr 1.4fr':request.actionComplement&&leading===4?'0.85fr 0.7fr 1.5fr 0.55fr':`repeat(${leading},minmax(0,1fr))`}:{})} as CSSProperties
  return <div className="example-language example-matrix matrix-layout" data-matrix-layout={request.construction} data-card-count={cards.length} data-action-complement={request.actionComplement||undefined} data-noun-swapper={!!request.nounSwapper&&!settings.fadeMode} data-density={settings.layout?.density??'comfortable'} style={style}>
    <div className="matrix-layout-toolbar" aria-hidden={settings.fadeMode||undefined}>
      <div className="matrix-layout-leading-controls"><div>{!settings.fadeMode&&settings.english!==false&&request.subjectSwapper&&<NounModeToggle {...request.subjectSwapper}/>}</div></div>
      <div className="matrix-layout-noun-control">{!settings.fadeMode&&settings.english!==false&&request.nounSwapper&&<NounModeToggle {...request.nounSwapper}/>}</div>
    </div>
    <div className="tonight-slots" lang={settings.english===false?"th":"en"} aria-label={label}>
      <div className="matrix-layout-leading">{request.subjectVerbConnection==='warm'&&request.construction==='location-answer'?<><div className="matrix-agreement-group" role="group" aria-label="Person and matching verb">{cards.slice(0,2)}</div>{cards.slice(2,leading)}</>:cards.slice(0,leading)}</div>
      {actionRoles?<div className="matrix-role-group" role="group" aria-label="Action phrase" data-group-size={groupSize}>
        {!settings.fadeMode&&settings.english!==false&&request.nounSwapper&&<div className="matrix-layout-inline-control"><NounModeToggle {...request.nounSwapper}/></div>}
        {cards.slice(leading)}
      </div>:<NounGroup size={groupSize} label={request.construction==='question'?'Subject':request.construction==='location-answer'?'Location noun phrase':'Object noun phrase'} swapper={settings.fadeMode||settings.english===false?undefined:request.nounSwapper}>{cards.slice(leading)}</NounGroup>}

    </div>
    <div className="matrix-layout-translation">{translation}</div>
    <div className="matrix-layout-dock">{!settings.fadeMode&&tray}</div>
  </div>
}
