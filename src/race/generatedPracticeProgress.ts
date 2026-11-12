import {learningStates,fadingPercent} from '../learning/wordProgress/learningLifecycle'
import {vocabularyLearning} from './vocabularyProgress'
import {hierarchyState,hierarchyTypes,pronounsReady,hierarchyCompatible,targetsHierarchy} from './wordHierarchy'
import {starterNouns,everydayNounOrder} from '../learning/everydayVocabulary'
import {wordId,wordTokens,type WordProgress,type WordScores,type FadeSettings} from '../learning/wordProgress/model'
import {generatedCandidates,structureCandidates,practiceCandidates,type PracticeStructure,GENERATED_ROUND_SIZE,sentenceHash,sentenceKey,type GeneratedQuestion} from './generatedPracticeContent'
import {numberItem} from './numberCatalogue'
import {readRecall} from './numberRecallStore'
import type {PracticeLevel} from './PracticeLevelPicker'

export type ListeningEvidence={phase?:'presented'|'answered';presentedAt?:string;id:string;questionId:string;level:PracticeLevel;sentence:string;targets:string[];vocabulary:string[];correct:boolean;hidden:boolean;heard:boolean;assisted:boolean;plays:number;at:string}
export const evidenceKey=(user?:string)=>`englishsuccess:composed-evidence:v1:${user??'guest'}`
export function loadEvidence(user?:string):ListeningEvidence[]{
 let events:ListeningEvidence[]=[]
 try{const value=JSON.parse(localStorage.getItem(evidenceKey(user))??'[]');events=Array.isArray(value)?value.filter(e=>typeof e.id==='string'&&typeof e.sentence==='string'&&Array.isArray(e.targets)&&e.targets.every((t:unknown)=>typeof t==='string')&&Array.isArray(e.vocabulary)&&e.vocabulary.every((t:unknown)=>typeof t==='string')&&typeof e.correct==='boolean'&&typeof e.hidden==='boolean'&&typeof e.heard==='boolean'&&typeof e.assisted==='boolean'&&Number.isInteger(e.plays)):[]}catch{/* Retain legacy evidence even if the new store is unavailable. */}
 const legacy:ListeningEvidence[]=readRecall(user).map(e=>({id:e.id,questionId:`legacy-number:${e.word}`,level:e.module,sentence:e.word,targets:[e.word],vocabulary:[e.word],correct:e.correct,hidden:e.support===3,heard:e.heard,assisted:e.assisted,plays:e.replays,at:new Date(e.at).toISOString()}))
 return [...new Map([...legacy,...events].map(e=>[e.id,e])).values()].sort((a,b)=>a.at.localeCompare(b.at))
}
export function saveEvidence(event:ListeningEvidence,user?:string){
 const old=loadEvidence(user),previous=old.find(e=>e.id===event.id)
 if(previous&&!(previous.phase==='presented'&&event.phase!=='presented'))return old
 const saved=previous?{...event,presentedAt:previous.presentedAt??previous.at}:event
 const next=previous?old.map(e=>e.id===event.id?saved:e):[...old,saved]
 localStorage.setItem(evidenceKey(user),JSON.stringify(next));return next
}
export function evidenceScores(rows:WordProgress[],events:ListeningEvidence[],settings:FadeSettings={}):WordScores{
 const start=Math.max(0,settings.fadeStart??5),end=Math.max(start+1,settings.fadeEnd??25)
 return Object.fromEntries([...learningStates(rows,events)].map(([id,state])=>[id,state.fadeScore<=5?Math.min(start,state.fadeScore):start+(end-start)*fadingPercent(state.fadeScore)/100]))
}
export function masteredWords(rows:WordProgress[],events:ListeningEvidence[]):Set<string>{
 return new Set([...learningStates(rows,events)].filter(([,state])=>state.provenAt!==null).map(([id])=>id))
}
export const vocabularyFamily=(word:string)=>numberItem(word)?.singular??word
// One practical noun sequence across every sentence level. Historic evidence
// is retained; catalogue order never silently becomes curriculum priority.
export const sharedStarterVocabulary=starterNouns
export const sharedVocabularyOrder:string[]=[...everydayNounOrder]
export const vocabularyProfileKey=(user?:string)=>`englishsuccess:composed-vocabulary:v4:${user??'guest'}`
export function availableVocabulary(rows:WordProgress[],events:ListeningEvidence[],_familiar?:readonly string[]){
 void _familiar
 return new Set(hierarchyState(masteredWords(rows,events)).noun.allowed)
}
export function eligiblePracticeActions(rows:WordProgress[],events:ListeningEvidence[]){const verbs=hierarchyState(masteredWords(rows,events)).verb;return new Set([...verbs.allowed,...verbs.queued])}
export function availableActions(rows:WordProgress[],events:ListeningEvidence[]){return new Set(hierarchyState(masteredWords(rows,events)).verb.allowed)}
export function availableDescriptions(rows:WordProgress[],events:ListeningEvidence[]){return new Set(hierarchyState(masteredWords(rows,events)).adjective.allowed)}
export type DeckOptions={selectionIndex?:number;structure?:PracticeStructure;limit?:number;now?:number;actions?:string[];familiar?:string[];progressiveActions?:boolean;reviewActions?:string[]}
export function curriculumBaseline(rows:WordProgress[],events:ListeningEvidence[],_user?:string){void _user;return [...availableVocabulary(rows,events)]}
type TargetPool={word:string;questions:GeneratedQuestion[]}
const targetPoolCache=new WeakMap<GeneratedQuestion[],Map<string,Map<typeof hierarchyTypes[number],TargetPool[]>>>()
const sentenceKeyCache=new WeakMap<GeneratedQuestion,string>()
const primaryCache=new WeakMap<GeneratedQuestion[],ReadonlySet<string>>()
const eligibilityCache=new WeakMap<GeneratedQuestion[],Map<string,GeneratedQuestion[]>>()
/** Compose a fresh, balanced round from the engine's taught combinations.
 * Sampling is reproducible for refreshes, but a new round has a new seed. */
export function generatedDeck(level:PracticeLevel,rows:WordProgress[],events:ListeningEvidence[],seed:string,options:DeckOptions={}):GeneratedQuestion[]{
 const learning=learningStates(rows,events),mastered=masteredWords(rows,events),hierarchy=hierarchyState(mastered),now=options.now??Date.now()
 const bank=practiceCandidates(level,options.structure,new Set([...hierarchy.verb.allowed,...hierarchy.verb.queued]))
 const eligibilityKey=hierarchyTypes.map(type=>[...hierarchy[type].allowed,'>',...hierarchy[type].queued].join(',')).join('|')+'|'+pronounsReady(hierarchy)
 const bankCache=eligibilityCache.get(bank)??new Map<string,GeneratedQuestion[]>()
 let pool=bankCache.get(eligibilityKey)
 if(!pool){
  pool=bank.filter(q=>hierarchyCompatible(q,hierarchy))
 if(bankCache.size>=16)bankCache.delete(bankCache.keys().next().value!);bankCache.set(eligibilityKey,pool);eligibilityCache.set(bank,bankCache)}
 // Prefer the original construction separately for each target. A compatible
 // question for a different word must not suppress existing prerequisite recall.
 let primaryIds=primaryCache.get(bank)
 if(!primaryIds){primaryIds=new Set((options.structure?structureCandidates(options.structure):generatedCandidates(level,new Set([...hierarchy.verb.allowed,...hierarchy.verb.queued]))).map(q=>q.id));primaryCache.set(bank,primaryIds)}
 const preferPrimary=(questions:GeneratedQuestion[])=>{const primary=questions.filter(q=>primaryIds!.has(q.id)&&(options.structure||level<4||q.document.construction!=='noun-phrase'));return primary.length?primary:questions}
 const reviewable=(q:GeneratedQuestion)=>q.listeningWords.length>0&&q.listeningWords.flatMap(wordTokens).every(word=>(learning.get('en:'+word)?.fadeScore??0)>=25)
 const due=hierarchyTypes.flatMap(type=>hierarchy[type].completed.map(word=>({type,word,state:vocabularyLearning(type,word,learning,now)}))).filter(item=>item.state.due&&pool.some(q=>targetsHierarchy(q,item.type,item.word)&&reviewable(q))).sort((a,b)=>Date.parse(a.state.reviewDueAt!)-Date.parse(b.state.reviewDueAt!))[0]
 const targetKey=hierarchyTypes.map(type=>hierarchy[type].current.join(',')).join('|')
 const targetCache=targetPoolCache.get(pool)??new Map<string,Map<typeof hierarchyTypes[number],TargetPool[]>>()
 let currentPools=targetCache.get(targetKey)
 if(!currentPools){currentPools=new Map(hierarchyTypes.map(type=>[type,hierarchy[type].current.map(word=>({word,questions:preferPrimary(pool.filter(q=>targetsHierarchy(q,type,word)))})).filter(item=>item.questions.length)]));if(targetCache.size>=8)targetCache.delete(targetCache.keys().next().value!);targetCache.set(targetKey,currentPools);targetPoolCache.set(pool,targetCache)}
 const recent=new Map<string,number>();for(const [i,e] of events.slice(-180).entries())recent.set(sentenceKey(e.sentence),i)
 const used=new Set<string>(),counts=new Map<string,number>(),deck:GeneratedQuestion[]=[]
 let randomState=parseInt(sentenceHash(seed),36)||1
 const random=()=>{randomState^=randomState<<13;randomState^=randomState>>>17;randomState^=randomState<<5;return (randomState>>>0)/4294967296}
 const shuffle=<T,>(list:T[])=>{for(let i=list.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}return list}
 const sides=shuffle(Array.from({length:30},(_,i)=>i<15))
 // Single-step selection balances the live Current words using actual answer
 // history. It need not rebuild a throwaway prefix of the thirty-question round.
 if(options.selectionIndex!==undefined)for(const type of hierarchyTypes)for(const word of hierarchy[type].current){
  counts.set('focus:'+type+':'+word,events.slice(-180).filter(event=>targetsHierarchy({credit:event.targets.length?'answer':null,targetWords:event.targets},type,word)).length)
 }
 const count=(key:string)=>counts.get(key)??0
 for(let index=0;index<Math.min(GENERATED_ROUND_SIZE,options.limit??GENERATED_ROUND_SIZE);index++){
  const identity=(q:GeneratedQuestion)=>q.id
  // Choose the next unfinished item before recency, variety or random ordering.
  const turn=options.selectionIndex??index
  const focusOrder=[...hierarchyTypes.slice(turn%hierarchyTypes.length),...hierarchyTypes.slice(0,turn%hierarchyTypes.length)]
  const focus=pronounsReady(hierarchy)&&turn%3===2&&currentPools.get('pronoun')!.length?'pronoun':focusOrder.find(type=>currentPools.get(type)!.length)
  const choices=focus?currentPools.get(focus)!:[]
  const rotation=options.selectionIndex===undefined?0:Math.floor(turn/hierarchyTypes.length)%Math.max(1,choices.length)
  const position=(word:string)=>(choices.findIndex(item=>item.word===word)-rotation+choices.length)%choices.length
  const option=focus?[...choices].sort((a,b)=>count('focus:'+focus+':'+a.word)-count('focus:'+focus+':'+b.word)||position(a.word)-position(b.word))[0]:undefined
  if(focus&&option&&!due)counts.set('focus:'+focus+':'+option.word,count('focus:'+focus+':'+option.word)+1)
  let focused=due?preferPrimary(pool.filter(q=>targetsHierarchy(q,due.type,due.word)&&reviewable(q))):option?.questions??preferPrimary(pool)
  if(!due){const confirming=focused.filter(reviewable);if(confirming.length)focused=confirming}
  let candidates=focused.filter(q=>!used.has(identity(q)))
  if(!candidates.length){used.clear();candidates=[...focused]}
  if(!candidates.length)throw new Error(`Not enough taught, distinct questions for Level ${level}`)
  const rank=(q:GeneratedQuestion)=>{
   const key=sentenceKeyCache.get(q)??sentenceKey(q.document.english);sentenceKeyCache.set(q,key)
   const proved=q.targetWords.flatMap(wordTokens).every(w=>mastered.has(wordId(w)))
   const hash=parseInt(sentenceHash(seed+'|'+index+'|'+q.id),36)/0xffffffff
   return (recent.has(key)?1000+(recent.get(key)??0):0)+count('f:'+q.family)*12+count('a:'+q.action)*4+count('o:'+q.owner)*3+count('s:'+q.subject)*2+count('t:'+q.targetWords.join(' '))*3+(proved&&index%5!==0?8:0)+hash*6
  }
  let q=candidates[0],best=rank(q)
  for(let candidate=1;candidate<candidates.length;candidate++){const value=rank(candidates[candidate]);if(value<best){q=candidates[candidate];best=value}}
  used.add(identity(q));for(const key of ['f:'+q.family,'a:'+q.action,'o:'+q.owner,'s:'+q.subject,'t:'+q.targetWords.join(' ')])counts.set(key,count(key)+1)
  // Number and correctness choices retain their familiar order. Meaning
  // choices are evenly distributed, never tied to the correct side.
  const flip=q.kind==='meaning'&&sides[index]
  deck.push(flip?{...q,choices:[q.choices[1],q.choices[0]],alternatives:q.alternatives?[q.alternatives[1],q.alternatives[0]]:undefined,sceneChoices:q.sceneChoices?[q.sceneChoices[1],q.sceneChoices[0]]:undefined,correct:q.correct===0?1:0}:q)
 }
 return deck
}
