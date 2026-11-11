import {generatedDeck,evidenceScores,type ListeningEvidence,type DeckOptions} from './generatedPracticeProgress'
import {wordOpacity,wordTokens,type WordProgress,type FadeSettings} from '../learning/wordProgress/model'
import type {PracticeLevel} from './PracticeLevelPicker'
import type {GeneratedQuestion} from './generatedPracticeContent'
export function nextPersonalQuestion(level:PracticeLevel,rows:WordProgress[],events:ListeningEvidence[],seed:string,index:number,options:DeckOptions={}){
 return generatedDeck(level,rows,events,`${seed}:${index}`,{...options,limit:index%30+1})[index%30]
}
/** Pure simulation: no localStorage writes, account writes, XP awards or audio calls. */
export function forecastPractice(level:PracticeLevel,rows:WordProgress[],events:ListeningEvidence[],seed:string,index:number,current:GeneratedQuestion,options:DeckOptions={},settings:FadeSettings={}){
 const simulated=[...events],questions=[current]
 let q=current
 for(let step=0;step<10;step++){
  const scores=evidenceScores(rows,simulated,settings),targets=q.credit===null?[]:q.targetWords
  simulated.push({id:`forecast:${seed}:${index+step}`,questionId:q.id,level,sentence:q.document.english,targets,vocabulary:q.vocabulary,correct:true,hidden:q.listeningWords.length>0&&q.listeningWords.flatMap(wordTokens).every(w=>wordOpacity(w,scores,{...settings,fadeMode:settings.fadeMode??true})===0),heard:true,assisted:false,plays:1,at:new Date(step).toISOString()})
  q=nextPersonalQuestion(level,rows,simulated,seed,index+step+1,options);questions.push(q)
 }
 return questions
}
