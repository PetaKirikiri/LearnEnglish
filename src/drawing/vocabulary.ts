import {universityVocabulary} from '../learning/universityVocabulary'
import {actionVocabulary} from '../learning/sentenceRules/actionDialogue'
import {descriptions} from '../learning/everydayVocabulary'
import {wordTokens,type WordProgress} from '../learning/wordProgress/model'
export type DrawingWord={word:string;thai:string;english:string;kind:'noun'|'verb'|'adjective';forms:string[];tokens:string[]}
const grammar=new Set('am is are was were be been being do does did doing have has had having can could will would shall should may might must a an the this that these those some my your his her our their I you he she it we they to at in on of for and or not'.toLowerCase().split(' '))
/** The shared lexical catalogues provide content words; no grammar-word fallback. */
export const drawingVocabulary:DrawingWord[]=[...new Map([
 ...universityVocabulary.map(item=>({...item,kind:'noun' as const})),
 ...actionVocabulary.map(item=>({...item,kind:'verb' as const})),
 ...descriptions.map(item=>({...item,kind:'adjective' as const})),
].filter(item=>!grammar.has(item.word.toLowerCase())).map(item=>[item.word,{word:item.word,english:item.word,thai:item.thai,kind:item.kind,forms:[item.word],tokens:wordTokens(item.word)}])).values()]
/** Every player must have seen every token of the exact displayed surface form. */
export function sharedDrawingVocabulary(players:readonly (readonly WordProgress[])[]):DrawingWord[]{
 if(!players.length)return []
 const seen=players.map(rows=>new Set(rows.filter(row=>(row.exposure_count??0)>0||row.attempts>0).map(row=>row.word_id)))
 return drawingVocabulary.filter(item=>item.tokens.length>0&&seen.every(words=>item.tokens.every(token=>words.has('en:'+token))))
}
