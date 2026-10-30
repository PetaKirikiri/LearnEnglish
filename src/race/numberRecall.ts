import {numberCatalogue,numberAudio,type NumberItem} from './numberCatalogue'
import {withJudgement,type NumberPrompt} from './numberFoundation'
export type NumberRound=1|2|3
export type RecallAttempt={id:string;word:string;module:NumberRound;answer:number;correct:boolean;at:number;assisted:boolean;heard:boolean;replays:number;support:number;verb?:'is'|'are'}
export type RecallState={correct:number;wrong:number;independent:number;streak:number;support:number;due:number;last:number;interval:number}
const DAY=86400000
const intervals=[0,0,DAY,3*DAY,7*DAY,21*DAY,60*DAY]
export const recallKey=(module:NumberRound,word:string)=>`${module}:${word}`
export function recallStates(events:readonly RecallAttempt[]):Record<string,RecallState>{
 const result:Record<string,RecallState>={}
 const unique=[...new Map(events.map(event=>[event.id,event])).values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))
 for(const event of unique){
  if(event.module===3&&!event.verb)continue // Earlier blank-verb answers are a different task.
  const key=recallKey(event.module,event.word)
  const state=result[key]??{correct:0,wrong:0,independent:0,streak:0,support:0,due:0,last:0,interval:0}
  if(event.correct)state.correct++;else state.wrong++
  state.last=event.at
  if(!event.correct){state.streak=0;state.support=Math.max(0,state.support-1);state.interval=0;state.due=event.at}
  else if(event.assisted||!event.heard||event.replays>1||event.support<state.support){state.streak=0;state.interval=0;state.due=event.at}
  else{
   state.independent++;state.streak++
   // Advance only at the current support level, never from an easier saved prompt.
   if(event.support>=state.support&&state.streak%2===0)state.support=Math.min(3,state.support+1)
   state.interval=Math.min(intervals.length-1,state.interval+1)
   state.due=event.at+intervals[state.interval]
  }
  result[key]=state
 }
 return result
}
export function selectRecallItem({module,events,recent=[],plural,now=Date.now()}:{module:NumberRound;events:readonly RecallAttempt[];recent?:readonly string[];plural?:boolean;now?:number}):NumberItem|undefined{
 const states=recallStates(events)
 const candidates=numberCatalogue.filter(item=>module===3||!item.pairOnly).filter(item=>plural===undefined||item.pluralForm===plural).filter(item=>{
  const state=states[recallKey(module,item.word)]
  return (!state||state.due<=now)&&!recent.slice(-3).includes(item.word)
 })
 const due=candidates.filter(item=>states[recallKey(module,item.word)])
 const unseen=candidates.filter(item=>!states[recallKey(module,item.word)]&&!recent.includes(item.word))
 // Three review opportunities, then one new word, so neither queue starves.
 const introduce=recent.length%4===3||due.length===0
 const orderedNew=unseen.sort((a,b)=>a.lesson-b.lesson||numberCatalogue.indexOf(a)-numberCatalogue.indexOf(b))
 const orderedDue=due.sort((a,b)=>{
  const sa=states[recallKey(module,a.word)],sb=states[recallKey(module,b.word)]
  return sa.support-sb.support||sa.due-sb.due||a.lesson-b.lesson
 })
 return (introduce?orderedNew[0]??orderedDue[0]:orderedDue[0]??orderedNew[0])
}
export const recallPrompt=(item:NumberItem):NumberPrompt=>({id:crypto.randomUUID(),word:item.word,thai:item.thai,plural:item.pluralForm,audioUrl:numberAudio(item.word)})
export function scheduledNumberDeck(module:NumberRound,events:readonly RecallAttempt[],now=Date.now()):NumberPrompt[]{
 const deck:NumberPrompt[]=[]
 for(let index=0;index<30;index++){
  const item=nextRecallItem(module,events,deck,now)
  if(!item)break
  deck.push(withJudgement(recallPrompt(item),module,deck))
 }
 return deck
}

/** Balance the two forms without teaching an alternating answer sequence. */
export function nextRecallItem(module:NumberRound,events:readonly RecallAttempt[],answered:readonly NumberPrompt[],now=Date.now()){
 const plurals=answered.filter(q=>q.plural).length,singulars=answered.length-plurals
 const plural=answered.length===0?false:Math.random()<(15-plurals)/(30-answered.length)
 const query={module,events,recent:answered.map(q=>q.word),now}
 return selectRecallItem({...query,plural})??(plurals<15&&singulars<15?selectRecallItem({...query,plural:!plural}):undefined)
}
