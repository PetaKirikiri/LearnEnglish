import {actionVocabulary} from '../learning/sentenceRules/actionDialogue'
export type StructureScore={attempts:number;correct:number;listeningCorrect:number}
export type SentenceResult={sentence:string;correct:boolean;modality:string}
export type StructureScores=Record<string,StructureScore>
/** Only complete, recognised frames contribute. Noun phrases and unknown forms do not. */
export function structureForSentence(sentence:string):string|null{
 const text=sentence.toLowerCase().replace(/[?.!]/g,'').replace(/\s+/g,' ').trim()
 if(/^where (am|is|are) .+$/.test(text)&&actionVocabulary.some(action=>action.destination&&text.endsWith(' '+(action.spoken??action.word))))return 'destination-question'
 if(/^where (am|is|are) .+$/.test(text))return 'where'
 if(/^what (am|is|are) .+ doing$/.test(text))return 'activity'
 if(/^what (is|are) (this|that|these|those|that over there)$/.test(text))return 'identify-question'
 if(/^(this|that|these|those|that over there) (is|are) .+$/.test(text))return 'identify-answer'
 if(/^.+ (am|is|are) at .+$/.test(text))return 'location'
 if(/^.+ (am|is|are) \w+ing to .+$/.test(text))return 'intransitive-to-object'
 if(/^.+ (am|is|are) \w+ing .+$/.test(text)&&!/^.+ (am|is|are) \w+ing (in|on|at|off|from|with)\b/.test(text))return 'transitive-object'
 return null
}
export function addStructureResult(scores:StructureScores,result:SentenceResult){
 const id=structureForSentence(result.sentence)
 if(!id)return
 const score=scores[id]??(scores[id]={attempts:0,correct:0,listeningCorrect:0})
 score.attempts++;if(result.correct){score.correct++;if(result.modality==='audio')score.listeningCorrect++}
}
