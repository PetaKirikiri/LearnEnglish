import {emptyLearning,fadingPercent,type WordLearning} from '../learning/wordProgress/learningLifecycle'
import {wordTokens,type WordProgress} from '../learning/wordProgress/model'
import {numberItem} from './numberCatalogue'
import type {HierarchyType} from './wordHierarchy'
/** Each phrase is one answer, even when it credits multiple word tokens. */
export function vocabularyScore(type:HierarchyType,word:string,rows:WordProgress[]){
 const forms=type==='noun'?[word,numberItem(word)?.plural].filter((w):w is string=>!!w):[word]
 const byWord=new Map(rows.map(row=>[row.word_id,row]))
 const minimum=(form:string,field:'correct'|'attempts'|'listening_correct')=>Math.min(...wordTokens(form).map(token=>byWord.get('en:'+token)?.[field]??0))
 return [...new Set(forms)].reduce((sum,form)=>({correct:sum.correct+minimum(form,'correct'),attempts:sum.attempts+minimum(form,'attempts'),listening:sum.listening+minimum(form,'listening_correct')}),{correct:0,attempts:0,listening:0})
}

export function vocabularyLearning(type:HierarchyType,word:string,states:ReadonlyMap<string,WordLearning>,now=Date.now()){
 const forms=type==='noun'?[word,numberItem(word)?.plural].filter((w):w is string=>!!w):[word]
 const combined=forms.map(form=>{
  const values=wordTokens(form).map(token=>states.get('en:'+token)??emptyLearning()),proven=values.every(v=>v.provenAt)
  return {fadeScore:Math.min(...values.map(v=>v.fadeScore)),confirmations:Math.min(...values.map(v=>v.confirmations)),provenAt:proven?values.map(v=>v.provenAt!).sort().at(-1)!:null,reviewDueAt:proven?values.map(v=>v.reviewDueAt).filter((v):v is string=>!!v).sort()[0]??null:null,lapsed:values.some(v=>v.lapsedAt)}
 })
 const best=combined.sort((a,b)=>Number(!!b.provenAt)-Number(!!a.provenAt)||b.fadeScore-a.fadeScore||b.confirmations-a.confirmations)[0]
 return {...best,fadePercent:fadingPercent(best.fadeScore),due:!!best.reviewDueAt&&Date.parse(best.reviewDueAt)<=now,stage:best.provenAt?'proven':best.fadeScore>=25?'confirming':best.lapsed?'relearning':'fading'} as const
}
