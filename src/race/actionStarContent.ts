import {requestLesson} from '../learning/lessonRegistry'
import {actionCapabilities,composeLessonAction} from '../learning/sentenceRules/actionCapabilities'
import {actionPracticeQuestions,type ActionPracticeQuestion} from './actionPracticeContent'
import type {Determiner} from '../learning/sentenceMatrix/model'
export type ActionStar=1|2|3
export type ActionStarQuestion=ActionPracticeQuestion & {provenance:{blueprint:'present-action-dialogue';lesson:'lesson-4';subject:string;action:string;object:string;noun:string;determiner:Determiner;recordingQuestionId:string}}
export const actionStarLesson=requestLesson(4)
const quota:Record<ActionStar,Record<string,number>>={
 1:{eating:38,reading:8,drinking:4},
 2:{holding:21,opening:12,washing:12,eating:2,reading:2,drinking:1},
 3:{eating:4,reading:2,drinking:1,holding:20,opening:10,washing:13},
}
/** Enumerate valid blueprint requests, then join exact reviewed recordings. No invented paths. */
export function generatedActionCandidates():ActionStarQuestion[]{
 const capability=actionCapabilities(actionStarLesson)
 const recordings=new Map(actionPracticeQuestions.filter(q=>q.level===6).map(q=>[q.english,q]))
 const candidates:ActionStarQuestion[]=[]
 for(const subject of capability.subjects)for(const action of capability.actions)for(const object of capability.objects(action.word))for(const owner of capability.determiners(object)){
  const request={subject:subject.word,action:action.word,object:object.word,determiner:owner.word}
  const answer=composeLessonAction(actionStarLesson,request).answer,recording=recordings.get(answer.english)
  if(!recording)continue
  if(recording.thai!==answer.thai||JSON.stringify(recording.units)!==JSON.stringify(answer.units))throw new Error(`Recording differs from blueprint: ${recording.id}`)
  if(recording.correct!==0||recording.choices[0]!==answer.thai||recording.choices[0]===recording.choices[1])throw new Error(`Ambiguous recording choices: ${recording.id}`)
  candidates.push({...recording,provenance:{blueprint:'present-action-dialogue',lesson:'lesson-4',...request,noun:object.noun,recordingQuestionId:recording.id}})
 }
 return candidates
}
/** Stable, disjoint curriculum sets. Order introduces new verbs separately, with familiar review. */
const allCandidates=generatedActionCandidates()
function buildTiers(){
 const candidates=allCandidates,used=new Set<string>()
 return ([1,2,3] as const).map(stars=>{
  const questions:ActionStarQuestion[]=[]
  for(const [action,count] of Object.entries(quota[stars])){
   const eligible=candidates.filter(q=>q.provenance.action===action&&!used.has(q.id))
   // Alternate people before revisiting one person's object combinations.
   const subjects=[...new Set(eligible.map(q=>q.provenance.subject))]
   const ordered:ActionStarQuestion[]=[]
   for(let index=0;ordered.length<eligible.length;index++)for(const subject of subjects){
    const item=eligible.filter(q=>q.provenance.subject===subject)[index]
    if(item)ordered.push(item)
   }
   if(ordered.length<count)throw new Error(`Star ${stars}: ${action} needs ${count} recorded questions; found ${ordered.length}`)
   for(const item of ordered.slice(0,count)){questions.push(item);used.add(item.id)}
  }
  if(questions.length!==50)throw new Error(`Star ${stars} must contain 50 questions`)
  return {stars,questions}
 })
}
export const actionStarTiers=buildTiers()
export function actionStarTier(stars:ActionStar){return actionStarTiers.find(t=>t.stars===stars)!}
let signature=2166136261
for(const char of JSON.stringify(actionStarTiers.map(t=>t.questions.map(q=>[q.id,q.english,q.thai,q.choices,q.audioUrl]))))signature=Math.imul(signature^char.charCodeAt(0),16777619)
export const actionStarsVersion=`action-stars-v1:${(signature>>>0).toString(36)}`

export type StarResult={passes:number;best:number}
export type StarProgress=Partial<Record<ActionStar,StarResult>>
export const starAvailable=(stars:ActionStar,progress:StarProgress)=>stars===1||(progress[(stars-1) as ActionStar]?.passes??0)>=2
export function completeStar(progress:StarProgress,stars:ActionStar,score:number,total:number,unassisted:boolean):StarProgress{
 if(!starAvailable(stars,progress)||total!==50||!Number.isInteger(score)||score<0||score>total)return progress
 const old=progress[stars]??{passes:0,best:0}
 return {...progress,[stars]:{best:Math.max(old.best,score),passes:old.passes+(unassisted&&score>=45?1:0)}}
}
/** Seeded order survives reload; answer positions are balanced without changing stored answers. */
export function actionStarDeck(stars:ActionStar,seed:string){
 let state=2166136261
 for(const char of seed)state=Math.imul(state^char.charCodeAt(0),16777619)
 const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296}
 const shuffle=<T,>(items:T[])=>{for(let i=items.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[items[i],items[j]]=[items[j],items[i]]}return items}
 const questions=[...actionStarTier(stars).questions]
 if(stars===3)shuffle(questions)
 const sides=shuffle(Array.from({length:50},(_,index)=>index<25))
 return questions.map((q,index)=>sides[index]?{...q,choices:[q.choices[1],q.choices[0]] as [string,string],correct:1}:q)
}
/** Teaching uses separate recorded examples, so it never reveals the next assessed sentence. */
export function actionStarTeachingExample(action:string){
 const assessed=new Set(actionStarTiers.flatMap(t=>t.questions.map(q=>q.id)))
 const example=allCandidates.find(q=>q.provenance.action===action&&!assessed.has(q.id))
 if(!example)throw new Error(`No separate recorded teaching example: ${action}`)
 return example
}
