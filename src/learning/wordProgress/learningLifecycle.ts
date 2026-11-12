import {wordTokens,type WordProgress} from './model'
export const FADE_START=5,FADE_END=25,CONFIRMATIONS_REQUIRED=3
export const REVIEW_DAYS=[1,3,7,14,30] as const
export type WordLearning={fadeScore:number;confirmations:number;provenAt:string|null;reviewDueAt:string|null;reviewStep:number;reviewedAt:string|null;lapsedAt:string|null;updatedAt:string|null}
export const emptyLearning=():WordLearning=>({fadeScore:0,confirmations:0,provenAt:null,reviewDueAt:null,reviewStep:0,reviewedAt:null,lapsedAt:null,updatedAt:null})
export const fadingPercent=(score:number)=>Math.round(Math.max(0,Math.min(1,(score-FADE_START)/(FADE_END-FADE_START)))*100)
const due=(at:string,step:number)=>new Date(Date.parse(at)+REVIEW_DAYS[step]*86400000).toISOString()
export function advanceLearning(previous:WordLearning,event:{correct:boolean;independent:boolean;at:string}):WordLearning{
 const state={...previous,updatedAt:event.at},hiddenBefore=state.fadeScore>=FADE_END
 if(!event.correct){
  state.fadeScore=state.provenAt?Math.min(FADE_START,state.fadeScore):Math.max(0,state.fadeScore-2)
  if(state.provenAt)state.lapsedAt=event.at
  state.confirmations=0;state.provenAt=null;state.reviewDueAt=null;state.reviewStep=0;state.reviewedAt=null
  return state
 }
 state.fadeScore=Math.min(FADE_END,state.fadeScore+1)
 if(!event.independent||!hiddenBefore)return state
 if(state.provenAt){
  if(state.reviewDueAt&&Date.parse(event.at)>=Date.parse(state.reviewDueAt)){
   state.reviewStep=Math.min(REVIEW_DAYS.length-1,state.reviewStep+1);state.reviewedAt=event.at;state.reviewDueAt=due(event.at,state.reviewStep)
  }
 }else{
  state.confirmations=Math.min(CONFIRMATIONS_REQUIRED,state.confirmations+1)
  if(state.confirmations===CONFIRMATIONS_REQUIRED){state.provenAt=event.at;state.reviewedAt=event.at;state.lapsedAt=null;state.reviewStep=0;state.reviewDueAt=due(event.at,0)}
 }
 return state
}
export type LearningEvidence={id:string;targets:string[];correct:boolean;hidden:boolean;heard:boolean;assisted:boolean;plays:number;at:string}
/** Canonical server history plus only the answers not yet represented there. */
export function learningStates(rows:WordProgress[],events:LearningEvidence[]=[]){
 const states=new Map<string,WordLearning>()
 for(const row of rows)states.set(row.word_id,{fadeScore:row.fade_score??Math.min(FADE_END,row.correct),confirmations:row.confirmation_count??0,provenAt:row.proven_at??null,reviewDueAt:row.review_due_at??null,reviewStep:row.review_step??0,reviewedAt:row.reviewed_at??null,lapsedAt:row.lapsed_at??null,updatedAt:row.learning_updated_at??row.last_practised??null})
 const cutoff=new Map([...states].map(([id,s])=>[id,Date.parse(s.updatedAt??'')||0]))
 for(const event of [...new Map(events.map(e=>[e.id,e])).values()].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))){
  for(const word of new Set(event.targets.flatMap(wordTokens))){
   const id='en:'+word;if(Date.parse(event.at)<=(cutoff.get(id)??0))continue
   states.set(id,advanceLearning(states.get(id)??emptyLearning(),{correct:event.correct,independent:event.hidden&&event.heard&&!event.assisted&&event.plays===1,at:event.at}))
  }
 }
 return states
}
