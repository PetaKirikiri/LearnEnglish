import {starterNouns,everydayNounOrder,starterActions,everydayActionOrder,descriptionStages} from '../learning/everydayVocabulary'
import {wordId,wordTokens,type WordProgress,type WordScores,type FadeSettings} from '../learning/wordProgress/model'
import {generatedCandidates,structureCandidates,type PracticeStructure,GENERATED_ROUND_SIZE,sentenceHash,sentenceKey,type GeneratedQuestion} from './generatedPracticeContent'
import {numberItem} from './numberCatalogue'
import {readRecall} from './numberRecallStore'
import type {PracticeLevel} from './PracticeLevelPicker'

export type ListeningEvidence={id:string;questionId:string;level:PracticeLevel;sentence:string;targets:string[];vocabulary:string[];correct:boolean;hidden:boolean;heard:boolean;assisted:boolean;plays:number;at:string}
export const evidenceKey=(user?:string)=>`englishsuccess:composed-evidence:v1:${user??'guest'}`
export function loadEvidence(user?:string):ListeningEvidence[]{
 let events:ListeningEvidence[]=[]
 try{const value=JSON.parse(localStorage.getItem(evidenceKey(user))??'[]');events=Array.isArray(value)?value.filter(e=>typeof e.id==='string'&&typeof e.sentence==='string'&&Array.isArray(e.targets)&&e.targets.every((t:unknown)=>typeof t==='string')&&Array.isArray(e.vocabulary)&&e.vocabulary.every((t:unknown)=>typeof t==='string')&&typeof e.correct==='boolean'&&typeof e.hidden==='boolean'&&typeof e.heard==='boolean'&&typeof e.assisted==='boolean'&&Number.isInteger(e.plays)):[]}catch{/* Retain legacy evidence even if the new store is unavailable. */}
 const legacy:ListeningEvidence[]=readRecall(user).map(e=>({id:e.id,questionId:`legacy-number:${e.word}`,level:e.module,sentence:e.word,targets:[e.word],vocabulary:[e.word],correct:e.correct,hidden:e.support===3,heard:e.heard,assisted:e.assisted,plays:e.replays,at:new Date(e.at).toISOString()}))
 return [...new Map([...legacy,...events].map(e=>[e.id,e])).values()].sort((a,b)=>a.at.localeCompare(b.at))
}
export function saveEvidence(event:ListeningEvidence,user?:string){const old=loadEvidence(user);if(old.some(e=>e.id===event.id))return old;const next=[...old,event];localStorage.setItem(evidenceKey(user),JSON.stringify(next));return next}
export function evidenceScores(rows:WordProgress[],events:ListeningEvidence[],settings:FadeSettings={}):WordScores{
 const local:Record<string,number>={}
 for(const event of events)if(event.correct&&!event.assisted&&event.heard)for(const word of new Set(wordTokens(event.sentence))){const id=wordId(word);local[id]=Math.max((local[id]??0)+1,event.questionId.startsWith('legacy-number:')&&event.hidden?25:0)}
 // Successful exposure fades the sentence scaffold. Only tested, hidden
 // contrasts establish mastery below; exposure alone never unlocks vocabulary.
 // Server totals include uploaded local attempts. Taking the maximum avoids
 // counting the same success twice while retaining offline/guest evidence.
 for(const row of rows)local[row.word_id]=Math.max(local[row.word_id]??0,row.correct)
 const recovery=new Map<string,number>()
 for(const e of events)for(const token of new Set(e.targets.flatMap(wordTokens))){const id=wordId(token);if(!e.correct)recovery.set(id,0);else if(e.heard&&!e.assisted&&recovery.has(id))recovery.set(id,(recovery.get(id)??0)+1)}
 const start=Math.max(0,settings.fadeStart??5),end=Math.max(start+1,settings.fadeEnd??25)
 for(const [id,successes] of recovery)if(successes<3)local[id]=Math.min(local[id]??0,start+(end-start)*successes/3)
 return local
}
export function masteredWords(rows:WordProgress[],events:ListeningEvidence[]):Set<string>{
 const mastered=new Set<string>()
 // Historic server audio evidence is conservative: all credited words had to
 // be invisible. Visible success totals alone never establish listening skill.
 for(const row of rows)if(row.listening_correct>=3&&row.recent_results.slice(-3).length===3&&row.recent_results.slice(-3).every(Boolean))mastered.add(row.word_id)
 const streak=new Map<string,number>()
 for(const event of events)for(const token of new Set(event.targets.flatMap(wordTokens))){const id=wordId(token)
  if(!event.correct){streak.set(id,0);mastered.delete(id)}
  else if(event.hidden&&event.heard&&!event.assisted&&event.plays===1){const count=(streak.get(id)??0)+1;streak.set(id,count);if(count>=3)mastered.add(id)}
 }
 return mastered
}
export const vocabularyFamily=(word:string)=>numberItem(word)?.singular??word
function familyMastered(family:string,mastered:Set<string>){const item=numberItem(family);return [family,item?.plural].filter((w):w is string=>!!w).some(word=>wordTokens(word).every(t=>mastered.has(wordId(t))))}
// One practical noun sequence across every sentence level. Historic evidence
// is retained; catalogue order never silently becomes curriculum priority.
export const sharedStarterVocabulary=starterNouns
export const sharedVocabularyOrder:string[]=[...everydayNounOrder]
export const vocabularyProfileKey=(user?:string)=>`englishsuccess:composed-vocabulary:v4:${user??'guest'}`
function encounteredVocabulary(rows:WordProgress[],events:ListeningEvidence[]){
 const seen=new Set(events.flatMap(e=>e.vocabulary).map(vocabularyFamily))
 const scores=Object.fromEntries(rows.map(r=>[r.word_id,r.correct]))
 for(const family of sharedVocabularyOrder){const item=numberItem(family);if([family,item?.plural].filter(Boolean).some(w=>wordTokens(w!).every(t=>(scores[wordId(t)]??0)>0)))seen.add(family)}
 return seen
}
export function availableVocabulary(rows:WordProgress[],events:ListeningEvidence[],familiar:readonly string[]=sharedStarterVocabulary){
 const mastered=masteredWords(rows,events),seen=encounteredVocabulary(rows,events)
 const baseline=new Set(familiar.filter(f=>sharedVocabularyOrder.includes(f)))
 const allowed=new Set([...baseline,...sharedVocabularyOrder.filter(f=>seen.has(f))])
 const introduced=[...allowed].filter(f=>!baseline.has(f))
 const credits=sharedVocabularyOrder.filter(f=>familyMastered(f,mastered)).length
 // The unlock decision is made globally, before a level applies its sentence
 // compatibility rules. Changing levels cannot create another vocabulary slot.
 if(credits>introduced.length&&introduced.every(f=>familyMastered(f,mastered))){const next=sharedVocabularyOrder.find(f=>!allowed.has(f));if(next)allowed.add(next)}
 return allowed
}
export function availableActions(rows:WordProgress[],events:ListeningEvidence[]){
 const mastered=masteredWords(rows,events)
 const encountered=new Set([...rows.filter(r=>r.correct>0).map(r=>r.word_id.replace(/^en:/,'')),...events.flatMap(e=>wordTokens(e.sentence))])
 const allowed=new Set<string>([...starterActions,...everydayActionOrder.filter(w=>encountered.has(w))])
 const added=[...allowed].filter(w=>!starterActions.some(s=>s===w))
 const credits=everydayActionOrder.filter(w=>mastered.has(wordId(w))).length
 if(credits>added.length&&added.every(w=>mastered.has(wordId(w)))){const next=everydayActionOrder.find(w=>!allowed.has(w));if(next)allowed.add(next)}
 return allowed
}
export function availableDescriptions(rows:WordProgress[],events:ListeningEvidence[]){
 const mastered=masteredWords(rows,events)
 // A new descriptor is only composed with a familiar noun in generatedDeck.
 if(!sharedVocabularyOrder.some(f=>familyMastered(f,mastered)))return new Set<string>()
 const encountered=new Set([...rows.filter(r=>r.correct>0).map(r=>r.word_id.replace(/^en:/,'')),...events.flatMap(e=>wordTokens(e.sentence))])
 const allowed=new Set<string>(descriptionStages.flat().filter(w=>encountered.has(w)))
 for(const stage of descriptionStages){
  for(const word of stage)allowed.add(word)
  if(!stage.every(word=>mastered.has(wordId(word))))break
 }
 return allowed
}
export type DeckOptions={structure?:PracticeStructure;limit?:number;actions?:string[];familiar?:string[];progressiveActions?:boolean;reviewActions?:string[]}
export function curriculumBaseline(rows:WordProgress[],events:ListeningEvidence[],user?:string){
 const key=vocabularyProfileKey(user)
 let saved:unknown
 try{saved=JSON.parse(localStorage.getItem(key)??'null')}catch{/* Rebuild from actual learning evidence. */}
 if(Array.isArray(saved)&&saved.length>=sharedStarterVocabulary.length&&saved.every(w=>typeof w==='string'&&sharedVocabularyOrder.includes(w))&&sharedStarterVocabulary.every(w=>saved.includes(w)))return saved as string[]
 // Old per-level starting lists are not evidence of learning. Preserve words
 // actually encountered/credited, without importing unplayed level defaults.
 const seen=encounteredVocabulary(rows,events)
 const baseline=sharedVocabularyOrder.filter(f=>sharedStarterVocabulary.some(w=>w===f)||seen.has(f))
 localStorage.setItem(key,JSON.stringify(baseline));return baseline
}
/** Compose a fresh, balanced round from the engine's taught combinations.
 * Sampling is reproducible for refreshes, but a new round has a new seed. */
export function generatedDeck(level:PracticeLevel,rows:WordProgress[],events:ListeningEvidence[],seed:string,options:DeckOptions={}):GeneratedQuestion[]{
 const mastered=masteredWords(rows,events)
 let actions=options.actions
 if(options.progressiveActions&&actions){const firstUnknown=actions.findIndex(a=>!mastered.has(wordId(a)));actions=[...actions.slice(0,firstUnknown<0?actions.length:firstUnknown+1),...(options.reviewActions??[])]}
 const bank=(options.structure?structureCandidates(options.structure):generatedCandidates(level)).filter(q=>q.action==='vocabulary'||!actions||actions.includes(q.action)).filter(q=>!actions||!q.alternatives||q.alternatives.every(d=>d.units.filter(u=>u.role==='action').every(u=>actions!.includes(u.english.replace(/[.!?]/g,'')))))
 const allowed=availableVocabulary(rows,events,options.familiar)
 // If this construction cannot express any currently encountered noun, introduce
 // its earliest compatible word from the same global progression order.
 if(options.structure&&!bank.some(q=>q.vocabulary.every(w=>allowed.has(vocabularyFamily(w))))){
  const next=sharedVocabularyOrder.find(f=>bank.some(q=>q.vocabulary.every(w=>allowed.has(vocabularyFamily(w))||vocabularyFamily(w)===f)))
  if(next)allowed.add(next)
 }
 const verbs=availableActions(rows,events),qualities=availableDescriptions(rows,events)
 // A starred action lesson explicitly introduces its first unmastered action;
 // all other levels draw from the same shared action evidence.
 if(options.progressiveActions&&actions)for(const action of actions)verbs.add(action)
 const pool=bank.filter(q=>q.vocabulary.every(w=>allowed.has(vocabularyFamily(w)))).filter(q=>{
  const documents=[q.document,...q.alternatives??[]]
  if(documents.some(d=>d.units.some(u=>u.role==='action'&&u.english.replace(/[.!?]/g,'')!=='doing'&&u.english.replace(/[.!?]/g,'')!=='going'&&!verbs.has(u.english.replace(/[.!?]/g,'')))))return false
  const descriptors=documents.flatMap(d=>d.units.filter(u=>u.role==='description').map(u=>u.english))
  return !descriptors.length||(descriptors.every(w=>qualities.has(w))&&documents.every(d=>d.units.filter(u=>u.role==='action').every(u=>mastered.has(wordId(u.english.replace(/[.!?]/g,'')))))&&q.vocabulary.every(w=>familyMastered(vocabularyFamily(w),mastered)))
 })
 const recent=new Map<string,number>();for(const [i,e] of events.slice(-180).entries())recent.set(sentenceKey(e.sentence),i)
 const used=new Set<string>(),counts=new Map<string,number>(),deck:GeneratedQuestion[]=[]
 let randomState=parseInt(sentenceHash(seed),36)||1
 const random=()=>{randomState^=randomState<<13;randomState^=randomState>>>17;randomState^=randomState<<5;return (randomState>>>0)/4294967296}
 const shuffle=<T,>(list:T[])=>{for(let i=list.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}return list}
 const sides=shuffle(Array.from({length:30},(_,i)=>i<15))
 const forms=shuffle(Array.from({length:30},(_,i)=>({plural:i>=15,wrong:i>=15?i>=22:i>=8})))
 const categories=shuffle(Array.from({length:30},(_,i)=>i<15?'doing':'where'))
 const count=(key:string)=>counts.get(key)??0
 for(let index=0;index<Math.min(GENERATED_ROUND_SIZE,options.limit??GENERATED_ROUND_SIZE);index++){
  const wantedPlural=forms[index].plural,wantedWrong=forms[index].wrong
  const identity=(q:GeneratedQuestion)=>options.structure?q.id:sentenceKey(q.document.english)
  let candidates=pool.filter(q=>!used.has(identity(q)))
  if(options.structure&&!candidates.length){used.clear();candidates=[...pool]}
  if(!options.structure&&level<=3)candidates=candidates.filter(q=>q.plural===wantedPlural&&(level!==3||(q.correct===1)===wantedWrong))
  if(!options.structure&&level>=5){const wantsRecall=index%5===3;const matching=candidates.filter(q=>(q.action==='vocabulary')===wantsRecall);if(matching.length)candidates=matching}
  if(!options.structure&&level!==3&&level!==4){const wantsDescription=index%5===4;const matching=candidates.filter(q=>q.document.units.some(u=>u.role==='description')===wantsDescription);if(matching.length)candidates=matching}
  if(!options.structure&&level>=5&&index%5===2){const focus=options.progressiveActions?options.actions?.find(a=>!mastered.has(wordId(a))):undefined;const matching=candidates.filter(q=>q.targetWords.some(w=>focus?w===focus:verbs.has(w)));if(matching.length)candidates=matching}
  if(!options.structure&&level===4){const matching=candidates.filter(q=>q.action===categories[index]);if(matching.length)candidates=matching}
  if(!candidates.length)throw new Error(`Not enough taught, distinct questions for Level ${level}`)
  const rank=(q:GeneratedQuestion)=>{
   const key=sentenceKey(q.document.english),proved=q.targetWords.flatMap(wordTokens).every(w=>mastered.has(wordId(w)))
   const hash=parseInt(sentenceHash(seed+'|'+index+'|'+q.id),36)/0xffffffff
   return (recent.has(key)?1000+(recent.get(key)??0):0)+count('f:'+q.family)*12+count('a:'+q.action)*4+count('o:'+q.owner)*3+count('s:'+q.subject)*2+count('t:'+q.targetWords.join(' '))*3+(proved&&index%5!==0?8:0)+hash*6
  }
  const q=candidates.map(q=>({q,rank:rank(q)})).sort((a,b)=>a.rank-b.rank)[0].q
  used.add(identity(q));for(const key of ['f:'+q.family,'a:'+q.action,'o:'+q.owner,'s:'+q.subject,'t:'+q.targetWords.join(' ')])counts.set(key,count(key)+1)
  // Number and correctness choices retain their familiar order. Meaning
  // choices are evenly distributed, never tied to the correct side.
  const flip=q.kind==='meaning'&&sides[index]
  deck.push(flip?{...q,choices:[q.choices[1],q.choices[0]],alternatives:q.alternatives?[q.alternatives[1],q.alternatives[0]]:undefined,sceneChoices:q.sceneChoices?[q.sceneChoices[1],q.sceneChoices[0]]:undefined,correct:q.correct===0?1:0}:q)
 }
 return deck
}
