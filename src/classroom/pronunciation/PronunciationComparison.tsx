import { useId, useRef, useState } from 'react'
import { readGuide, saveGuide, splitSketch, type PronunciationSketch } from './guides'
import './pronunciationComparison.css'
import EducationSectionHeading from '../../learning/sentenceMatrix/EducationSectionHeading'
import { getLanguage } from '../language'

type Side='thai'|'english'
export default function PronunciationComparison({word,allowEdit=true,language=getLanguage()}:{word:string;allowEdit?:boolean;language?:'th'|'en'}) {
 // Keying by word also resets unsaved editing when a vocabulary selection changes.
 return <Comparison key={word.toLowerCase()} word={word} allowEdit={allowEdit} language={language}/>
}
function Comparison({word,allowEdit,language}:{word:string;allowEdit:boolean;language:'th'|'en'}) {
 const [guide,setGuide]=useState(()=>readGuide(word))
 const [draft,setDraft]=useState(guide)
 const [editing,setEditing]=useState(false)
 const [error,setError]=useState('')
 const titleId=useId()
 const editButton=useRef<HTMLButtonElement>(null)
 function update(side:Side,sketch:PronunciationSketch){setDraft(previous=>({...previous,[side]:sketch}))}
 function save(){try{saveGuide(word,draft);setGuide(draft);setEditing(false);setError('');editButton.current?.focus()}catch{setError('Could not save this sketch. Please try again.')}}
 const shown=editing?draft:guide
 return <section className="pronunciation-comparison" aria-labelledby={titleId}>
  <EducationSectionHeading id={titleId} icon="sound" actions={allowEdit&&<button className="cw-education-edit" ref={editButton} type="button" onClick={()=>{setDraft(guide);setEditing(!editing);setError('')}}>{editing?'Cancel':'Edit'}</button>}>{language==='th'?'การออกเสียง':'Pronunciation'}</EducationSectionHeading>
  <div className="pronunciation-content">
  <div className="pronunciation-columns">
   {(['thai','english'] as const).map(side=><article className={`pronunciation-side pronunciation-${side}`} key={side}>
    <h3><span aria-hidden="true">{side==='thai'?'🇹🇭':'🇬🇧'}</span>{language==='th'?(side==='thai'?'เสียงแบบไทย':'เน้นเสียงอังกฤษ'):(side==='thai'?'Thai sounds':'English stress')}</h3>
    <PitchGraph sketch={shown[side]} word={word} side={side} editing={editing} onChange={sketch=>update(side,sketch)}/>
    {editing && <div className="pronunciation-editor">
     <label>Syllables<input aria-label={`${side} syllables`} defaultValue={draft[side].syllables.join('-')} onBlur={event=>update(side,splitSketch(draft[side],event.target.value))} placeholder="com-pu-ter"/></label>
     <label>Emphasis<select aria-label={`${side} emphasis`} value={draft[side].emphasis??''} onChange={event=>update(side,{...draft[side],emphasis:event.target.value===''?null:Number(event.target.value)})}><option value="">None</option>{draft[side].syllables.map((label,index)=><option value={index} key={index}>{label}</option>)}</select></label>
    </div>}
   </article>)}
  </div>
  {editing ? <footer className="pronunciation-edit-actions"><span>Drag a dot up or down. Use hyphens to split syllables.</span><button type="button" onClick={save}>Save</button></footer> : <p className="pronunciation-caption">{language==='th'?'คำไทยช่วยอ่านเสียง · เส้นอังกฤษแสดงการเน้นเสียง':'Thai spelling ≈ sound · English curve = stress guide'}</p>}
  {error&&<p role="alert" className="pronunciation-error">{error}</p>}
  </div>
 </section>
}
function PitchGraph({sketch,word,side,editing,onChange}:{sketch:PronunciationSketch;word:string;side:Side;editing:boolean;onChange:(sketch:PronunciationSketch)=>void}) {
 const svg=useRef<SVGSVGElement>(null)
 const moving=useRef<number|null>(null)
 const count=sketch.syllables.length
 const x=(index:number)=>360*(index+.5)/count
 const y=(pitch:number)=>112-pitch*84
 const anchors=sketch.pitch.map((p,i)=>`${x(i)},${y(p)}`)
 // Show the approach to the stressed syllable, not just its falling tail.
 const points=side==='english' && sketch.drawn
  ? [`20,${y(.15)}`,...anchors,`340,${y(.15)}`].join(' ')
  : count===1?`60,${y(sketch.pitch[0])} 300,${y(sketch.pitch[0])}`:anchors.join(' ')
 function change(index:number,pitch:number){onChange({...sketch,drawn:true,pitch:sketch.pitch.map((p,i)=>i===index?Math.max(0,Math.min(1,pitch)):p)})}
 function pointer(clientY:number,index:number){const bounds=svg.current?.getBoundingClientRect();if(bounds)change(index,(112-(clientY-bounds.top)*125/bounds.height)/84)}
 return <div className="pronunciation-plot"><svg ref={svg} className="pronunciation-graph" viewBox="0 0 360 125" preserveAspectRatio="none" role="group" aria-label={`${side} pitch sketch for ${word}`}>
  <title>{`${side} example: ${sketch.syllables.join(' · ')}`}</title>
  {[28,70,112].map(height=><line className="pronunciation-grid" key={height} x1="20" x2="340" y1={height} y2={height}/>)}
  <text className="pronunciation-axis" x="5" y="25">↑</text><text className="pronunciation-axis" x="5" y="117">↓</text>
  <polyline className={`pronunciation-path${sketch.drawn?'':' is-unset'}`} points={points} fill="none"/>
  {sketch.syllables.map((label,index)=><g key={index}>
   <line className="pronunciation-stem" x1={x(index)} x2={x(index)} y1={y(sketch.pitch[index])+8} y2="125"/>
   <circle className={`pronunciation-dot${sketch.drawn?'':' is-unset'}`} cx={x(index)} cy={y(sketch.pitch[index])} r={editing?10:7} tabIndex={editing?0:undefined} role={editing?'slider':undefined} aria-label={`${side}: ${label} pitch`} aria-valuemin={editing?0:undefined} aria-valuemax={editing?100:undefined} aria-valuenow={editing?Math.round(sketch.pitch[index]*100):undefined} onPointerDown={event=>{if(!editing)return;moving.current=index;event.currentTarget.setPointerCapture(event.pointerId);pointer(event.clientY,index)}} onPointerMove={event=>{if(editing&&moving.current===index)pointer(event.clientY,index)}} onPointerUp={()=>{moving.current=null}} onPointerCancel={()=>{moving.current=null}} onKeyDown={event=>{if(!editing)return;const step=event.key==='ArrowUp'?.05:event.key==='ArrowDown'?-.05:0;if(step){event.preventDefault();change(index,sketch.pitch[index]+step)}else if(event.key==='Home'||event.key==='End'){event.preventDefault();change(index,event.key==='Home'?0:1)}}}/>

  </g>)}
 </svg><div className="pronunciation-labels" lang={side==='thai'?'th':'en'}>{sketch.syllables.map((label,index)=><span key={index} className={`pronunciation-syllable${sketch.emphasis===index?' is-stressed':''}`} style={{left:`${x(index)/3.6}%`,width:`${count===1?95:100/count}%`}}>{label}</span>)}</div></div>
}
