import type {Part,Frame} from '../sentenceRules/blueprintCatalogue'
import {blueprintWordConnections} from '../sentenceRules/blueprintWordConnections'
import './blueprintSlots.css'

export default function BlueprintSlots({parts,frame,showWords=false}:{parts:readonly Part[];frame?:Frame;showWords?:boolean}){
 return <div className="blueprint-slots vocab-blueprint-frame">{parts.map((part,index)=><span className={`vocab-blueprint-slot vocab-blueprint-slot-${part.kind}`} key={index}>{part.role&&<small>{part.role}</small>}<strong>{part.label}</strong>{part.accepts&&<small>accepts: {part.accepts}</small>}{showWords&&frame&&<details className="blueprint-word-connections"><summary>Words</summary><div>{blueprintWordConnections(frame,part).map(word=><span key={word.form+word.word}>{word.word}<small>{word.form}</small></span>)}</div></details>}</span>)}</div>
}
