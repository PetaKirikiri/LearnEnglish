import NounModeToggle, { type NounSwapperRequest } from './NounModeToggle'
import type { CSSProperties, ReactNode } from 'react'
import type { MatrixSettings } from './model'
import './matrixLayout.css'

/** Callers describe the construction; this component owns every layout coordinate. */
export type MatrixLayoutRequest = {
  construction: 'question' | 'location-answer' | 'noun-phrase'
  noun: 'phrase' | 'single'
  nounSwapper?: NounSwapperRequest
  subjectSwapper?: NounSwapperRequest
  subjectVerbConnection?: 'warm'
}
export default function MatrixLayout({request,settings={},cards,label,translation,tray}:{
  request:MatrixLayoutRequest;settings?:MatrixSettings;cards:ReactNode[];label:string;translation:ReactNode;tray?:ReactNode
}) {
  const groupSize=request.noun==='phrase'?2:1
  const leading=request.construction==='noun-phrase'?0:request.construction==='location-answer'?3:2
  if(cards.length!==leading+groupSize)throw new Error('Sentence cards do not match the requested matrix construction')
  const style={'--matrix-max-width':`${settings.layout?.maxWidth??1100}px`} as CSSProperties
  return <div className="example-language example-matrix matrix-layout" data-matrix-layout={request.construction} data-noun-swapper={!!request.nounSwapper&&!settings.fadeMode} data-density={settings.layout?.density??'comfortable'} style={style}>
    <div className="matrix-layout-toolbar" aria-hidden={settings.fadeMode||undefined}>
      <div className="matrix-layout-leading-controls"><div>{!settings.fadeMode&&request.subjectSwapper&&<NounModeToggle {...request.subjectSwapper}/>}</div></div>
      <div className="matrix-layout-noun-control">{!settings.fadeMode&&request.nounSwapper&&<NounModeToggle {...request.nounSwapper}/>}</div>
    </div>
    <div className="tonight-slots" lang="en" aria-label={label}>
      <div className="matrix-layout-leading">{request.subjectVerbConnection==='warm'&&request.construction==='location-answer'?<><div className="matrix-agreement-group" role="group" aria-label="Person and matching verb">{cards.slice(0,2)}</div>{cards.slice(2,leading)}</>:cards.slice(0,leading)}</div>
      <div className="cw-noun-group" role="group" aria-label={request.construction==='location-answer'?'Location noun phrase':'Subject'} data-group-size={groupSize}>
        {!settings.fadeMode&&request.nounSwapper&&<div className="matrix-layout-inline-control"><NounModeToggle {...request.nounSwapper}/></div>}
        {cards.slice(leading)}
      </div>
    </div>
    <div className="matrix-layout-translation">{translation}</div>
    <div className="matrix-layout-dock">{!settings.fadeMode&&tray}</div>
  </div>
}
