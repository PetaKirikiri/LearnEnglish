import VocabularyPicture from './VocabularyPicture'
import SentenceSlot from './SentenceSlot'
import type { ReactNode } from 'react'
import '../race/tonightSlots.css'
import './exampleLanguage.css'

export type ExampleUnit = {english:string;thai:string}
type UnitAction = { index: number; onClick: () => void; expanded: boolean; controls: string; label: string; affordance?: ReactNode }

/** Shared example-text layout: source / aligned meaning / natural translation.
 * Units are authored in context; never zip a Thai sentence to English words.
 * ** emphasis may cross unit boundaries (or begin inside an inflected word).
 */
export default function ExampleLanguage({english,thai,units,matrix=false,unitAction,translationControl,unitActions,slotDetails,afterUnits,groupLastTwo=false}:{english:string;thai:string;units:readonly ExampleUnit[];matrix?:boolean;unitAction?:UnitAction;translationControl?:ReactNode;unitActions?:UnitAction[];slotDetails?:readonly {label:string;count:number;icon?:ReactNode;control?:ReactNode}[];afterUnits?:ReactNode;groupLastTwo?:boolean}) {
  const spans=english.split('**').map((text,index,parts)=>{
    const start=parts.slice(0,index).join('').length
    return {text,start,end:start+text.length,marked:index%2===1}
  })
  const plain=spans.map(span=>span.text).join('')
  if(units.map(unit=>unit.english).join(' ')!==plain) throw new Error(`Example alignment does not match: ${plain}`)
  const cards = units.map((unit,index)=>{
      const start=units.slice(0,index).reduce((sum,previous)=>sum+previous.english.length+1,0),end=start+unit.english.length
      const word = unit.english.toLowerCase().replace(/[?.,!]/g, '')
      const slot = word === 'where' ? 0 : ['is','are'].includes(word) ? 1 : ['the','my','your'].includes(word) ? 2 : 3
      const action = unitActions?.find(action => action.index === index) ?? (unitAction?.index === index ? unitAction : undefined)
      const detail = slotDetails?.[index]
      const content = <>
        {detail && <span className="cw-slot-role">{detail.icon === undefined ? detail.label : detail.icon}</span>}
        {matrix && slot === 3 && !detail?.icon && <VocabularyPicture word={unit.english}/>}
        <span className="example-source">{spans.filter(span=>span.start<end&&span.end>start).map((span,i)=>{
          const text=span.text.slice(Math.max(start,span.start)-span.start,Math.min(end,span.end)-span.start)
          return span.marked?<strong key={i}>{text}</strong>:<span key={i}>{text}</span>
        })}</span>
        <span className="example-gloss" lang="th" title={unit.thai==='—'?'ภาษาไทยไม่มีคำแปลแยกตรงนี้':undefined}>{unit.thai}</span>
        {detail && <small className="cw-slot-count" aria-label={`${detail.count} available words`}>▤ {detail.count}</small>}
      </>
      if (matrix && action) {
        const card = <button type="button" className={`tonight-slot slot-${slot} example-unit-trigger`} key={index} aria-label={action.label} aria-expanded={action.expanded} aria-controls={action.controls} onClick={action.onClick}><SentenceSlot slot={slot}>{content}</SentenceSlot>{action.affordance}</button>
        return detail?.control ? <span className={`cw-slot-shell cw-slot-shell-${slot}`} key={index}>{card}{detail.control}</span> : card
      }
      return matrix ? <span className={`tonight-slot slot-${slot}`} key={index}><SentenceSlot slot={slot}>{content}</SentenceSlot></span> : <span className="example-unit" key={index}>{content}</span>
    })
  return <div className={`example-language${matrix ? ' example-matrix' : ''}`}>
    <p className={matrix ? "tonight-slots" : "bird-english example-alignment"} lang="en" aria-label={plain}>{groupLastTwo ? <>{cards.slice(0,2)}<span className="cw-noun-group" role="group" aria-label="Noun phrase">{cards.slice(2)}</span></> : cards}</p>
    {afterUnits}
    {translationControl ? <div className="example-meaning-row">{translationControl}<p className="bird-thai example-translation" lang="th" aria-live={unitAction || unitActions ? 'polite' : undefined}>{thai}</p></div> : <p className="bird-thai example-translation" lang="th" aria-live={unitAction || unitActions ? 'polite' : undefined}>{thai}</p>}
  </div>
}
