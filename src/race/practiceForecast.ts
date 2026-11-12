import {serveBlueprintDeck,NoCompatibleBlueprintChoice} from './blueprintWordServer'
import {generatedDeck,evidenceScores,masteredWords,type ListeningEvidence,type DeckOptions} from './generatedPracticeProgress'
import {wordOpacity,wordTokens,type WordProgress,type FadeSettings} from '../learning/wordProgress/model'
import type {PracticeLevel} from './PracticeLevelPicker'
import {type GeneratedQuestion} from './generatedPracticeContent'
import {hierarchyState,hierarchyTypes,hierarchyCompatible,targetsHierarchy} from './wordHierarchy'
import {learningStates} from '../learning/wordProgress/learningLifecycle'
import {verbGroupFor} from '../learning/sentenceRules/verbGroups'
import {nounGroupFor} from './nounGroups'
import {vocabularyLearning} from './vocabularyProgress'
export function nextPersonalQuestion(level:PracticeLevel,rows:WordProgress[],events:ListeningEvidence[],seed:string,index:number,options:DeckOptions={}){
 return generatedDeck(level,rows,events,`${seed}:${index}`,{...options,selectionIndex:index,limit:1})[0]
}
/** Pure simulation: no localStorage writes, account writes, XP awards or audio calls. */
export function forecastPractice(level:PracticeLevel,rows:WordProgress[],events:ListeningEvidence[],seed:string,index:number,current:GeneratedQuestion,options:DeckOptions={},settings:FadeSettings={}){
 const now=options.now??Date.now()
 const simulated=[...events],questions=[current]
 let q=current
 for(let step=0;step<10;step++){
  const scores=evidenceScores(rows,simulated,settings),targets=q.credit===null?[]:q.targetWords
  const pending=simulated.findIndex(event=>event.phase==='presented'&&event.questionId===q.id)
  const shown=pending>=0?simulated[pending]:undefined
  const event:ListeningEvidence={id:shown?.id??`forecast:${seed}:${index+step}`,phase:shown?'answered':undefined,presentedAt:shown?.presentedAt??shown?.at,questionId:q.id,level,sentence:q.document.english,targets,vocabulary:q.vocabulary,correct:true,hidden:q.listeningWords.length>0&&q.listeningWords.flatMap(wordTokens).every(w=>wordOpacity(w,scores,{...settings,fadeMode:settings.fadeMode??true})===0),heard:true,assisted:false,plays:1,at:new Date(now+step+1).toISOString()}
  if(pending>=0)simulated[pending]=event;else simulated.push(event)
  q=nextPersonalQuestion(level,rows,simulated,seed,index+step+1,{...options,now});questions.push(q)
 }
 return questions
}

/** Prepare one bounded replacement scenario per type before its Current slot opens.
 * This is hypothetical audio preparation only; it never credits or serves the queued word. */
export function queuedAudioCandidates(level:PracticeLevel,rows:WordProgress[],events:ListeningEvidence[],options:DeckOptions={}){
 const mastered=masteredWords(rows,events),state=hierarchyState(mastered),learning=learningStates(rows,events),result:GeneratedQuestion[]=[]
 for(const type of hierarchyTypes){
  for(const queued of state[type].queued){
  const current=state[type].current.filter(word=>type==='noun'?nounGroupFor(word)===nounGroupFor(queued):type==='verb'?verbGroupFor(word)===verbGroupFor(queued):true)
  if(!current.length)continue
  const closest=[...current].sort((a,b)=>{
   const score=(word:string)=>{const s=vocabularyLearning(type,word,learning);return s.fadePercent}
   return score(b)-score(a)||state[type].current.indexOf(a)-state[type].current.indexOf(b)
  })[0]
  const hypothetical=new Set(mastered);for(const token of wordTokens(closest))hypothetical.add('en:'+token)
  const future=hierarchyState(hypothetical)
  const fits=(q:GeneratedQuestion)=>targetsHierarchy(q,type,queued)&&hierarchyCompatible(q,future)
  try{const q=serveBlueprintDeck(level,future,learning,events,'queued-audio',{...options,limit:1,focus:{type,word:queued}})[0];if(q&&fits(q))result.push(q)}catch(error){if(!(error instanceof NoCompatibleBlueprintChoice))throw error}
  }
 }
 return result
}
export function audioPreparationPlan(level:PracticeLevel,rows:WordProgress[],events:ListeningEvidence[],seed:string,index:number,current:GeneratedQuestion,options:DeckOptions={},settings:FadeSettings={}){
 const forecast=forecastPractice(level,rows,events,seed,index,current,options,settings)
 const queued=queuedAudioCandidates(level,rows,events,options)
 return [...new Map([...forecast,...queued].map(q=>[q.document.english.normalize('NFC').trim().replace(/\s+/g,' '),q])).values()].slice(0,16)
}
