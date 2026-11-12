import {numberItem} from './numberCatalogue'
import {references,identificationQuestion,identificationAudio} from '../learning/sentenceRules/identification'
import {type GeneratedQuestion,type DistanceChoice} from './generatedPracticeContent'
import {generatedDeck,type ListeningEvidence,type DeckOptions} from './generatedPracticeProgress'
import type {WordProgress} from '../learning/wordProgress/model'
export type {DistanceChoice} from './generatedPracticeContent'
/** Compatibility resolver for classroom turns already stored with v1 IDs.
 * The shared lexicon supplies objects; this module never assigns a learner deck. */
const legacyObjects=['phone','bag','cup','key','bottle','plate','book','shoe','hat','apple']
export const identificationQuestions=legacyObjects.flatMap((word,index)=>references.filter(reference=>!reference.plural||!!numberItem(word)?.plural).map(reference=>{
 const singular=references.filter(r=>!r.plural),ri=singular.findIndex(r=>r.id===reference.id)
 const other=reference.plural?references.find(r=>r.id===(reference.id==='these'?(index%2?'this':'those'):(index%2?'that':'these')))!:singular[(ri+1+index%2)%singular.length]
 return {id:`identify-v1-${reference.id}-${word}`,version:1,level:6,document:identificationQuestion(reference.id),audioUrl:identificationAudio(reference.id),choices:[reference.word,other.word],correct:0,sceneChoices:[{reference:reference.id,word},{reference:other.id,word}],targetWords:[reference.word],listeningWords:[reference.word],family:word,vocabulary:[word],action:'identify',owner:'',subject:'',plural:reference.plural,kind:'meaning',credit:reference.word}
})) as (GeneratedQuestion&{audioUrl:string;sceneChoices:[DistanceChoice,DistanceChoice]})[]

export function identificationDeck(seed:string,rows:WordProgress[]=[],events:ListeningEvidence[]=[],options:DeckOptions={}){
 return generatedDeck(6,rows,events,seed,{...options,structure:'identify'})
}
