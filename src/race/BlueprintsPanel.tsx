import type {StructureScores} from './blueprintScores'
import {useState} from 'react'
import '../learning/sentencePalette.css'
import {blueprintFrames,type Part,type Frame} from '../learning/sentenceRules/blueprintCatalogue'
import {blueprintWordConnections} from './blueprintWordConnections'

const tabs=[{id:'noun-phrase',title:'Noun phrase'},{id:'pronoun',title:'Pronoun'},{id:'proper-noun',title:'Proper noun'},{id:'noun-block',title:'Noun block'},{id:'sentences',title:'Sentence structures'}] as const
type Tab=typeof tabs[number]['id']
function Slots({parts,frame}:{parts:readonly Part[];frame?:Frame}){
 return <div className="vocab-blueprint-frame">{parts.map((part,index)=><span className={`vocab-blueprint-slot vocab-blueprint-slot-${part.kind}`} key={index}>{part.role&&<small>{part.role}</small>}<strong>{part.label}</strong>{part.accepts&&<small>accepts: {part.accepts}</small>}{frame&&<details className="blueprint-word-connections"><summary>Words</summary><div>{blueprintWordConnections(frame,part).map(word=><span key={word.form+word.word}>{word.word}<small>{word.form}</small></span>)}</div></details>}</span>)}</div>
}
function DefinitionRow({title,parts}:{title:string;parts:readonly Part[]}){
 return <div className="blueprint-simple-row"><h3>{title}</h3><Slots parts={parts}/></div>
}
const nounPart=(label:string):Part=>({label,kind:'noun',binding:{type:'literal',word:label}})
export default function BlueprintsPanel({scores}:{scores?:StructureScores}){
 const [selected,setSelected]=useState<Tab>('sentences')
 return <section role="tabpanel" id="vocab-panel-blueprints" aria-labelledby="vocab-tab-blueprints"><h2>Blueprints</h2>
  <div className="vocab-subgroups vocab-blueprint-tabs" role="tablist" aria-label="Blueprint definitions">{tabs.map((tab,index)=><button type="button" role="tab" id={`blueprint-tab-${tab.id}`} aria-controls={`blueprint-panel-${tab.id}`} aria-selected={selected===tab.id} tabIndex={selected===tab.id?0:-1} key={tab.id} onClick={()=>setSelected(tab.id)} onKeyDown={event=>{
   const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:null
   if(next!==null){event.preventDefault();setSelected(tabs[next].id);document.getElementById(`blueprint-tab-${tabs[next].id}`)?.focus()}
  }}>{tab.title}</button>)}</div>
  <div role="tabpanel" id={`blueprint-panel-${selected}`} aria-labelledby={`blueprint-tab-${selected}`}>
   {selected==='noun-phrase'&&<DefinitionRow title="Noun phrase" parts={[{label:'det',kind:'determiner',binding:{type:'literal',word:'det'}},nounPart('adjective (optional)'),nounPart('noun')]}/>}
   {selected==='pronoun'&&<><DefinitionRow title="Subject" parts={['I','you','he','she','it','we','they'].map(nounPart)}/><DefinitionRow title="Object" parts={['me','you','him','her','it','us','them'].map(nounPart)}/></>}
   {selected==='proper-noun'&&<><DefinitionRow title="Person" parts={[nounPart('Bia')]}/><DefinitionRow title="Place" parts={[nounPart('Bangkok')]}/></>}
   {selected==='noun-block'&&<DefinitionRow title="Noun block — any one of" parts={['noun phrase','pronoun','proper noun'].map(nounPart)}/>}
   {selected==='sentences'&&<ol className="vocab-blueprints">{blueprintFrames.map(frame=><li key={frame.id}><h3>{frame.title}</h3><Slots parts={frame.parts} frame={frame}/><div className="blueprint-score">{scores===undefined?'Scores unavailable':scores[frame.id]?.attempts?<><strong>{Math.round(scores[frame.id].correct/scores[frame.id].attempts*100)}%</strong><span>{scores[frame.id].correct} / {scores[frame.id].attempts} correct</span><span>{scores[frame.id].listeningCorrect} listening correct</span></>:'No attempts yet'}</div></li>)}</ol>}
  </div>
 </section>
}
