import {references} from '../learning/sentenceRules/identification'
import {structureCandidates,type GeneratedQuestion,type DistanceChoice} from './generatedPracticeContent'
import {generatedDeck,type ListeningEvidence,type DeckOptions} from './generatedPracticeProgress'
import type {WordProgress} from '../learning/wordProgress/model'
export type {DistanceChoice} from './generatedPracticeContent'
/** Compatibility resolver for classroom turns already stored with v1 IDs.
 * The shared lexicon supplies objects; this module never assigns a learner deck. */
const legacyObjects=['phone','bag','cup','key','bottle','plate','book','shoe','hat','apple']
export const identificationQuestions=structureCandidates('identify').filter(q=>q.document.construction==='identification-question'&&q.sceneChoices&&legacyObjects.includes(q.sceneChoices[0].word)).map(q=>{
 const reference=references.find(r=>r.id===q.sceneChoices![0].reference)!,index=legacyObjects.indexOf(q.sceneChoices![0].word)
 const singular=references.filter(r=>!r.plural),ri=singular.findIndex(r=>r.id===reference.id)
 const other=reference.plural?references.find(r=>r.id===(reference.id==='these'?(index%2?'this':'those'):(index%2?'that':'these')))!:singular[(ri+1+index%2)%singular.length]
 return {...q,id:`identify-v1-${reference.id}-${q.sceneChoices![0].word}`,choices:[reference.word,other.word],sceneChoices:[q.sceneChoices![0],{reference:other.id,word:q.sceneChoices![0].word}]}
}) as (GeneratedQuestion&{audioUrl:string;sceneChoices:[DistanceChoice,DistanceChoice]})[]

export function identificationDeck(seed:string,rows:WordProgress[]=[],events:ListeningEvidence[]=[],options:DeckOptions={}){
 return generatedDeck(6,rows,events,seed,{...options,structure:'identify'})
}
