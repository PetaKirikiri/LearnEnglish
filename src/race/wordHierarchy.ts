import {activeActionBlueprints,type ActionBlueprint} from '../learning/sentenceRules/actionBlueprints'
import {everydayNounOrder,everydayActionOrder,descriptionStages} from '../learning/everydayVocabulary'
import {verbAvailableForBlueprints,verbGroupFor,actionWordForSurface,type VerbGroup} from '../learning/sentenceRules/verbGroups'
import {nounGroupFor} from './nounGroups'
import {numberItem} from './numberCatalogue'
import {wordId,wordTokens} from '../learning/wordProgress/model'
import type {GeneratedQuestion} from './generatedPracticeContent'
/** One ordered curriculum per word type, shared by every round and structure. */
export const wordHierarchies={
 noun:[...everydayNounOrder],
 verb:[...everydayActionOrder],
 adjective:descriptionStages.flat(),
 pronoun:['I','you','he','she','we','they'],
 determiner:['the','my','your','his','her','our','their','a','an','this','that','that over there','these','those','some'],
} as const
export const CURRENT_WORD_LIMIT=4
export const PRONOUN_NOUN_THRESHOLD=2
export type HierarchyType=keyof typeof wordHierarchies
export const hierarchyTypes=Object.keys(wordHierarchies) as HierarchyType[]
export const nounFamily=(word:string)=>numberItem(word)?.singular??word
export function hierarchyState(mastered:ReadonlySet<string>,blueprints:readonly ActionBlueprint[]=activeActionBlueprints){
 const state=Object.fromEntries(hierarchyTypes.map(type=>{
  const words=wordHierarchies[type]
  const completed=(word:string)=>type==='noun'?[word,numberItem(word)?.plural].filter((w):w is string=>!!w).some(w=>wordTokens(w).every(t=>mastered.has(wordId(t)))):wordTokens(word).every(t=>mastered.has(wordId(t)))
  const compatible=(word:string)=>type!=='verb'||verbAvailableForBlueprints(word,blueprints)
  const waiting=words.filter(word=>!completed(word)&&!compatible(word))
  const first=words.findIndex(word=>!completed(word)&&compatible(word)),index=first<0?words.length:first
  const unfinished=words.filter(word=>!completed(word)&&compatible(word))
  const nounGroups=type==='noun'?Object.fromEntries((['subjects','objects'] as const).map(group=>{
   const pending=unfinished.filter(word=>nounGroupFor(word)===group)
   return [group,{current:pending.slice(0,2),next:pending[2]??null}]
  })) as Record<'subjects'|'objects',{current:string[];next:string|null}>:undefined
  const verbGroups=type==='verb'?Object.fromEntries((['transitive','intransitive'] as const).map(group=>{
   const pending=unfinished.filter(word=>verbGroupFor(word)===group)
   return [group,{current:pending.slice(0,3),next:pending[3]??null}]
  })) as Record<VerbGroup,{current:string[];next:string|null}>:undefined
  const current=verbGroups?[...verbGroups.transitive.current,...verbGroups.intransitive.current]:nounGroups?[...nounGroups.subjects.current,...nounGroups.objects.current]:unfinished.slice(0,CURRENT_WORD_LIMIT)
  const queued=verbGroups?[verbGroups.transitive.next,verbGroups.intransitive.next].filter((word):word is string=>!!word):nounGroups?[nounGroups.subjects.next,nounGroups.objects.next].filter((word):word is string=>!!word):unfinished.slice(CURRENT_WORD_LIMIT,CURRENT_WORD_LIMIT+1)
  const next=queued[0]??null
  return [type,{waiting,index,current,next,queued,nounGroups,verbGroups,completed:words.filter(completed),allowed:words.filter(word=>compatible(word)&&(current.includes(word)||completed(word))),foil:next}]
 })) as unknown as Record<HierarchyType,{waiting:readonly string[];index:number;current:readonly string[];next:string|null;queued:readonly string[];verbGroups?:Record<VerbGroup,{current:readonly string[];next:string|null}>;nounGroups?:Record<'subjects'|'objects',{current:readonly string[];next:string|null}>;completed:readonly string[];allowed:readonly string[];foil:string|null}>

 return state
}
export const pronounsReady=(state:ReturnType<typeof hierarchyState>)=>state.noun.completed.length>=PRONOUN_NOUN_THRESHOLD||state.pronoun.completed.length>0
const trackedVerbs=new Set<string>(wordHierarchies.verb)
const clean=(s:string)=>s.toLowerCase().replace(/[.!?]/g,'').trim()
function typedWords(q:GeneratedQuestion,alternative=false):[HierarchyType,string][]{
 const documents=alternative?q.alternatives??[]:[q.document]
 return documents.flatMap(d=>d.units.flatMap(u=>{
  const word=u.role==='action'?actionWordForSurface(clean(u.english)):clean(u.english)
  const bare=word.replace(/^(the|my|your|his|her|our|their) /,'')
  if((u.role==='object'||u.role==='person')&&numberItem(bare))return [['noun',nounFamily(bare)] as [HierarchyType,string],...(bare!==word?[['determiner',word.split(' ')[0]] as [HierarchyType,string]]:[])]
  const type=u.role==='action'?'verb':u.role==='description'?'adjective':(u.role==='determiner'||u.role==='person-determiner')?'determiner':u.role==='person'?'pronoun':null
  return type&&(wordHierarchies[type] as readonly string[]).some(w=>clean(w)===word)?[[type,word] as [HierarchyType,string]]:[]
 }))
}
/** Later historical exposure cannot open a hole in an ordered hierarchy.
 * The immediate next item may appear as a foil, but never become the credited target. */
export function hierarchyCompatible(q:GeneratedQuestion,state:ReturnType<typeof hierarchyState>){
 if(q.credit!==null&&q.targetWords.some(target=>hierarchyTypes.some(type=>{
  const family=type==='noun'?nounFamily(clean(target)):clean(target)
  return (wordHierarchies[type] as readonly string[]).some(word=>clean(word)===family)&&!state[type].allowed.some(word=>clean(word)===family)
 })))return false
 if(trackedVerbs.has(q.action)&&!state.verb.allowed.includes(q.action))return false
 const pronouns=new Set(wordHierarchies.pronoun.map(word=>word.toLowerCase()))
 if(!pronounsReady(state)&&[q.document,...(q.alternatives??[])].some(doc=>doc.units.some(unit=>unit.role==='person'&&pronouns.has(clean(unit.english)))))return false
 const allowed=(type:HierarchyType,word:string,foil=false)=>[...state[type].allowed,...(foil?state[type].queued:[])].some(w=>clean(w)===clean(word))
 // New adjectives need an already-completed noun, rather than introducing two words together.
 const words=typedWords(q)
 if(words.some(([type,word])=>type==='adjective'&&state.adjective.current.some(current=>clean(current)===word))&&words.some(([type,word])=>type==='noun'&&!state.noun.completed.some(w=>clean(w)===word)))return false
 if(!q.vocabulary.every(w=>allowed('noun',nounFamily(w),true)))return false
 if(!typedWords(q).every(([type,word])=>allowed(type,word)))return false
 if(!typedWords(q,true).every(([type,word])=>allowed(type,word,true)))return false
 // Identification scenes have nouns outside the spoken document.
 if(q.sceneChoices&&!q.vocabulary.every(w=>allowed('noun',nounFamily(w))))return false
 return true
}
export function targetsHierarchy(q:Pick<GeneratedQuestion,'credit'|'targetWords'>,type:HierarchyType,word:string){
 if(q.credit===null)return false
 return q.targetWords.some(target=>type==='noun'?nounFamily(clean(target))===word:clean(target)===clean(word))
}

/** Teacher selectors expose the full compatible catalogue in curriculum order.
 * This orders choices only; it never applies a learner frontier or removes words. */
export function rankWordChoices<T extends {word:string}>(choices:readonly T[]):T[]{
 const rank=(surface:string)=>{
  const word=surface.toLowerCase().replace(/[.!?]/g,'').replace(/^(to|in|on|at|off) /,'').replace(/^(the|my|your|his|her|our|their|a|an) /,'')
  const family=nounFamily(word)
  for(const type of hierarchyTypes){const index=(wordHierarchies[type] as readonly string[]).findIndex(entry=>entry.toLowerCase()===(type==='noun'?family:word));if(index>=0)return index}
  return Number.MAX_SAFE_INTEGER
 }
 return choices.map((choice,index)=>({choice,index,rank:rank(choice.word)})).sort((a,b)=>a.rank-b.rank||a.index-b.index).map(item=>item.choice)
}
