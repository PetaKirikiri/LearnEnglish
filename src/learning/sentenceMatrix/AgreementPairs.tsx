import type {ReactNode} from 'react'
import Icon from '../../ui/Icon'
import './agreementPairs.css'

type Pair = {person:string;verb:string;icon:ReactNode;selected?:boolean}
/** Agreement examples follow the same role colours and reading order as the sentence. */
export default function AgreementPairs({pairs,question=false}:{pairs:readonly Pair[];question?:boolean}) {
 return <div className="cw-person-pairs cw-agreement-pairs" aria-label="Person and verb pairs">
  {pairs.map(pair=>{
   const person=<span className="cw-agreement-person">{pair.icon}<strong>{pair.person}</strong></span>
   const verb=<b className="cw-agreement-verb">{pair.verb}</b>
   return <div key={pair.person} data-selected={!!pair.selected}>
    {question?verb:person}<Icon name="arrow" className="cw-education-arrow"/>{question?person:verb}
   </div>
  })}
 </div>
}
