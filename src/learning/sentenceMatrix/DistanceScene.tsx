import VocabularyPicture from '../VocabularyPicture'
import {referenceFor,type ReferenceId} from '../sentenceRules/identification'
import './identification.css'

const positions={
 this:{left:'20.5%',bottom:'2.5%',width:'13%',height:'23%'},
 that:{left:'66.5%',bottom:'4.5%',width:'13%',height:'23%'},
 'over-there':{left:'47.5%',bottom:'61%',width:'10%',height:'16%'},
} satisfies Record<'this'|'that'|'over-there',object>
const relationships={this:'near the speaker',that:'near the listener','over-there':'away from both people'}

/** Purpose-drawn speaker/listener scenes keep the same current noun in both choices. */
export default function DistanceScene({reference,word='phone',compact=false}:{reference:ReferenceId;word?:string;compact?:boolean}){
 const item=referenceFor(reference),scene=item.scene
 return <span className={`distance-scene${compact?' distance-scene-compact':''}`} data-distance={reference} data-count={item.plural?2:1} role="img" aria-label={`${item.word}: ${item.plural?'two objects':'one object'}, ${relationships[scene]} (${word})`} style={{backgroundImage:`url("/classroom/icons/deictic/v2/${scene}-scene.jpg")`}}>
  <span className="distance-scene-object" style={positions[scene]}><VocabularyPicture word={word} count={item.plural?2:1}/></span>
 </span>
}
