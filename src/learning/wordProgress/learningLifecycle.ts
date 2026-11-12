import {wordTokens,type WordProgress} from './model'
export const FADE_START=5,FADE_END=25
export const REVIEW_DAYS=[1,3,7,14,30] as const
export type WordLearning={fadeScore:number;confirmations:number;provenAt:string|null;reviewDueAt:string|null;reviewStep:number;reviewedAt:string|null;lapsedAt:string|null;updatedAt:string|null}
export const emptyLearning=():WordLearning=>({fadeScore:0,confirmations:0,provenAt:null,reviewDueAt:null,reviewStep:0,reviewedAt:null,lapsedAt:null,updatedAt:null})
export const fadingPercent=(score:number)=>Math.round(Math.max(0,Math.min(1,(score-FADE_START)/(FADE_END-FADE_START)))*100)
const due=(at:string,step:number)=>new Date(Date.parse(at)+REVIEW_DAYS[step]*86400000).toISOString()
export function advanceLearning(previous:WordLearning,event:{correct:boolean;independent:boolean;at:string;weight?:number}):WordLearning{
 const state={...previous,updatedAt:event.at}
 if(!event.correct){
  state.fadeScore=state.provenAt?Math.min(FADE_START,state.fadeScore):Math.max(0,state.fadeScore-2)
  if(state.provenAt)state.lapsedAt=event.at
  state.confirmations=0;state.provenAt=null;state.reviewDueAt=null;state.reviewStep=0;state.reviewedAt=null
  return state
 }
 state.fadeScore=Math.min(FADE_END,state.fadeScore+(event.weight??1))
 if(state.fadeScore<FADE_END)return state
 if(!state.provenAt){
  state.provenAt=event.at;state.reviewedAt=event.at;state.lapsedAt=null;state.reviewStep=0;state.confirmations=0;state.reviewDueAt=due(event.at,0)
 }else if(event.independent&&state.reviewDueAt&&Date.parse(event.at)>=Date.parse(state.reviewDueAt)){
  state.reviewStep=Math.min(REVIEW_DAYS.length-1,state.reviewStep+1);state.reviewedAt=event.at;state.reviewDueAt=due(event.at,state.reviewStep)
 }
 return state
}
export type LearningEvidence={phase?:'presented'|'answered';presentedAt?:string;id:string;targets:string[];sentence?:string;correct:boolean;hidden:boolean;heard:boolean;assisted:boolean;plays:number;at:string}
/** Canonical server history plus only the answers not yet represented there. */
export function learningStates(rows:WordProgress[],events:LearningEvidence[]=[]){
 const states=new Map<string,WordLearning>()
 for(const row of rows){
  const fadeScore=row.fade_score??Math.min(FADE_END,row.correct)
  const learned=fadeScore>=FADE_END?((row.proven_at??row.learning_updated_at??row.last_practised)||'1970-01-01T00:00:00.000Z'):null
  states.set(row.word_id,{fadeScore,confirmations:0,provenAt:learned,reviewDueAt:learned?(row.review_due_at??(Date.parse(learned)?due(learned,0):null)):null,reviewStep:row.review_step??0,reviewedAt:row.reviewed_at??learned,lapsedAt:row.lapsed_at??null,updatedAt:row.learning_updated_at??row.last_practised??null})
 }
 const cutoff=new Map([...states].map(([id,s])=>[id,Date.parse(s.updatedAt??'')||0]))
 const timeline=[...new Map(events.map(e=>[e.id,e])).values()].flatMap<LearningEvidence&{kind:'exposure'|'answer'|'legacy'}>(event=>{
  if(event.phase==='presented')return [{...event,kind:'exposure' as const,at:event.presentedAt??event.at}]
  if(event.presentedAt)return [{...event,kind:'exposure' as const,at:event.presentedAt},{...event,kind:'answer' as const}]
  return [{...event,kind:'legacy' as const}]
 }).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)||(a.kind==='exposure'?-1:b.kind==='exposure'?1:0))
 for(const event of timeline){
  const tokens=event.targets.flatMap(wordTokens),lexical=tokens.filter(word=>!['am','is','are'].includes(word))
  const targets=new Set(lexical.length?lexical:tokens)
  const words=event.kind==='exposure'?new Set(wordTokens(event.sentence??'')):event.kind==='answer'?targets:new Set([...targets,...(event.correct&&targets.size?wordTokens(event.sentence??''):[])])
  for(const word of words){
   const id='en:'+word;if(Date.parse(event.at)<=(cutoff.get(id)??0))continue
   states.set(id,advanceLearning(states.get(id)??emptyLearning(),{correct:event.kind==='exposure'||event.correct,weight:event.kind==='exposure'?1:event.kind==='answer'?2:targets.has(word)?3:1,independent:event.kind!=='exposure'&&targets.has(word)&&event.hidden&&event.heard&&!event.assisted&&event.plays===1,at:event.at}))
  }
 }
 return states
}
