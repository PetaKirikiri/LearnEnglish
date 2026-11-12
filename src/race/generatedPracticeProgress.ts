import {serveBlueprintDeck} from './blueprintWordServer'
import {learningStates,fadingPercent} from '../learning/wordProgress/learningLifecycle'
import {hierarchyState,type HierarchyType} from './wordHierarchy'
import {starterNouns,everydayNounOrder} from '../learning/everydayVocabulary'
import {type WordProgress,type WordScores,type FadeSettings} from '../learning/wordProgress/model'
import {type PracticeStructure,type GeneratedQuestion} from './generatedPracticeContent'
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
export type DeckOptions={focus?:{type:HierarchyType;word:string};selectionIndex?:number;structure?:PracticeStructure;limit?:number;now?:number;actions?:string[];familiar?:string[];progressiveActions?:boolean;reviewActions?:string[]}
export function curriculumBaseline(rows:WordProgress[],events:ListeningEvidence[],_user?:string){void _user;return [...availableVocabulary(rows,events)]}
/** The blueprint server fills constrained slots from the account's word drawers. */
export function generatedDeck(level:PracticeLevel,rows:WordProgress[],events:ListeningEvidence[],seed:string,options:DeckOptions={}):GeneratedQuestion[]{
 return serveBlueprintDeck(level,hierarchyState(masteredWords(rows,events)),learningStates(rows,events),events,seed,options)
}
