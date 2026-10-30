import MatrixLayout, { type MatrixLayoutRequest } from './MatrixLayout'
import VocabularyPicture from '../VocabularyPicture'
import FadingWords from './FadingWords'
import type { MatrixSettings } from './model'
import type { WordScores } from '../wordProgress/model'
import MatrixCard from './MatrixCard'
import type { ReactNode } from 'react'
import '../../race/tonightSlots.css'
import '../exampleLanguage.css'

export type ExampleUnit = {english:string;thai:string}
type UnitAction = { index: number; onClick: () => void; expanded: boolean; controls: string; label: string; affordance?: ReactNode }

/** Shared example-text layout: source / aligned meaning / natural translation.
 * Units are authored in context; never zip a Thai sentence to English words.
 * ** emphasis may cross unit boundaries (or begin inside an inflected word).
 */
export default function ExampleLanguage({layout,english,thai,units,matrix=false,unitAction,translationControl,unitActions,slotDetails,afterUnits,groupLastTwo=false,groupLabel='Noun phrase',groupSize=2,groupControl,semanticSlots,settings={},scores={}}:{layout?:MatrixLayoutRequest;settings?:MatrixSettings;scores?:WordScores;english:string;thai:string;units:readonly ExampleUnit[];matrix?:boolean;unitAction?:UnitAction;translationControl?:ReactNode;unitActions?:UnitAction[];slotDetails?:readonly {label:string;count:number;icon?:ReactNode;control?:ReactNode}[];afterUnits?:ReactNode;groupLastTwo?:boolean;groupLabel?:string;groupSize?:number;groupControl?:ReactNode;semanticSlots?:readonly number[]}) {
  const spans=english.split('**').map((text,index,parts)=>{
    const start=parts.slice(0,index).join('').length
    return {text,start,end:start+text.length,marked:index%2===1}
  })
  const plain=spans.map(span=>span.text).join('')
  if(units.map(unit=>unit.english).join(' ')!==plain) throw new Error(`Example alignment does not match: ${plain}`)
  const showIcons = !settings.fadeMode || settings.keepIconsWhenFading === true
  const cards = units.map((unit,index)=>{
      const start=units.slice(0,index).reduce((sum,previous)=>sum+previous.english.length+1,0),end=start+unit.english.length
      const word = unit.english.toLowerCase().replace(/[?.,!]/g, '')
      const slot = semanticSlots?.[index] ?? (word === 'where' ? 0 : ['is','are','was','were'].includes(word) ? 1 : ['the','my','your','his','her'].includes(word) ? 2 : 3)
      const action = settings.fadeMode ? undefined : unitActions?.find(action => action.index === index) ?? (unitAction?.index === index ? unitAction : undefined)
      const detail = slotDetails?.[index]
      const content = <>
        {detail && (!settings.fadeMode || showIcons && detail.icon !== undefined) && <span className="cw-slot-role">{detail.icon === undefined ? detail.label : detail.icon}</span>}
        {showIcons && matrix && slot === 3 && !detail?.icon && <VocabularyPicture word={unit.english}/>}
        <span className="example-source" aria-hidden={settings.fadeMode||undefined}>{settings.fadeMode ? <FadingWords text={unit.english} scores={scores} settings={settings}/> : spans.filter(span=>span.start<end&&span.end>start).map((span,i)=>{
          const text=span.text.slice(Math.max(start,span.start)-span.start,Math.min(end,span.end)-span.start)
          return span.marked?<strong key={i}><FadingWords text={text} scores={scores} settings={settings}/></strong>:<span key={i}><FadingWords text={text} scores={scores} settings={settings}/></span>
        })}</span>
        {!settings.fadeMode && <span className="example-gloss" lang="th" title={unit.thai==='—'?'ภาษาไทยไม่มีคำแปลแยกตรงนี้':undefined}>{unit.thai}</span>}
        {detail && <small className="cw-slot-count" aria-label={`${detail.count} available words`}>▤ {detail.count}</small>}
      </>
      return matrix ? <MatrixCard key={index} slot={slot} action={action} control={settings.fadeMode?undefined:detail?.control} affordance={action?.affordance} className={action ? 'example-unit-trigger' : ''}>{content}</MatrixCard> : <span className="example-unit" key={index}>{content}</span>
    })
  const translation=settings.fadeMode ? translationControl : translationControl ? <div className="example-meaning-row">{translationControl}<p className="bird-thai example-translation" lang="th" aria-live={unitAction || unitActions ? 'polite' : undefined}>{thai}</p></div> : <p className="bird-thai example-translation" lang="th" aria-live={unitAction || unitActions ? 'polite' : undefined}>{thai}</p>
  if(matrix&&layout)return <MatrixLayout request={layout} settings={settings} cards={cards} label={settings.fadeMode?'Listen to the sentence':plain} translation={translation} tray={afterUnits}/>
  return <div className={`example-language${matrix ? ' example-matrix' : ''}`}>
    <p className={matrix ? "tonight-slots" : "bird-english example-alignment"} lang="en" aria-label={settings.fadeMode?"Listen to the sentence":plain}>{groupLastTwo ? <>{cards.slice(0,-groupSize)}<span className="cw-noun-group" role="group" aria-label={groupLabel} data-group-size={groupSize}>{!settings.fadeMode&&groupControl}{cards.slice(-groupSize)}</span></> : cards}</p>
    {!settings.fadeMode && afterUnits}
    {translation}
  </div>
}
