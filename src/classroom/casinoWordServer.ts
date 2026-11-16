import {sharedDrawingVocabulary} from '../drawing/vocabulary'
import {serveBlueprintDeck,NoCompatibleBlueprintChoice} from '../race/blueprintWordServer'
import {hierarchyState,nounFamily,wordHierarchies} from '../race/wordHierarchy'
import {masteredWords,type ListeningEvidence} from '../race/generatedPracticeProgress'
import {lessonPracticeTemplate} from '../race/lessonPracticeTemplate'
import {learningStates} from '../learning/wordProgress/learningLifecycle'
import {wordTokens,type WordProgress} from '../learning/wordProgress/model'
import {sentenceHash,type GeneratedQuestion} from '../race/generatedPracticeContent'
const contentTypes=['noun','verb','adjective'] as const
const functionWords=new Set('a an the some this that these those my your his her our their i you he she it we they me him us them am is are was were be been being do does did have has had can could may might must shall should will would to at in on of for and or but because if as than what where who when which how here there over under near behind between correct incorrect true false'.split(' '))
/** Check every visible surface, including text-only and picture answer choices. */
export function casinoContentWords(q:GeneratedQuestion){
 const surfaces=[q.document.english,...(q.alternatives??[]).map(doc=>doc.english),...q.choices,...(q.sceneChoices??[]).map(scene=>scene.word)]
 return [...new Set(surfaces.flatMap(wordTokens).filter(word=>!functionWords.has(word)))]
}
export function sharedCasinoQuestion(lesson:unknown,learner:string,rows:WordProgress[],history:ListeningEvidence[],turn:number,seed:string,players:readonly (readonly WordProgress[])[]){
 if(!players.length)throw new Error('No participating students')
 // A token history cannot prove an unseen multiword phrase. Use known single-word surfaces here.
 const shared=sharedDrawingVocabulary(players).filter(item=>item.tokens.length===1)
 const surfaces=new Set(shared.map(item=>item.word.toLowerCase()))
 const state=hierarchyState(masteredWords(rows,history))
 for(const type of contentTypes){
  const words=[...new Set(shared.filter(item=>item.kind===type).map(item=>type==='noun'?nounFamily(item.word):item.word))]
  // This is a temporary review eligibility view, never a change to learner mastery.
  state[type]={...state[type],allowed:words,current:words,completed:words,queued:[],next:null,foil:null}
 }
 for(const type of ['determiner','pronoun'] as const){
  const words=wordHierarchies[type].filter(word=>players.every(progress=>wordTokens(word).every(token=>progress.some(row=>row.word_id==='en:'+token&&((row.exposure_count??0)>0||row.attempts>0)))))
  state[type]={...state[type],allowed:words,current:words,completed:words,queued:[],next:null,foil:null}
 }
 const template=lessonPracticeTemplate(lesson)
 if(template.options.structure==='identify'){
  // Keep the taught identification frame stable; only the noun is contrasted.
  state.determiner={...state.determiner,allowed:['the'],current:['the'],completed:['the'],queued:[],next:null,foil:null}
 }
 const anchors=contentTypes.flatMap(type=>state[type].allowed.map(word=>({type,word})))
 const start=anchors.length?(turn+parseInt(sentenceHash(learner+':'+seed),36))%anchors.length:0
 const ordered=[...anchors.slice(start),...anchors.slice(0,start)]
 const seen=players.map(progress=>new Set(progress.filter(row=>(row.exposure_count??0)>0||row.attempts>0).map(row=>row.word_id)))
 for(const anchor of ordered){
  for(let variation=0;variation<8;variation++){
   try{
    const q=serveBlueprintDeck(template.level,state,learningStates(rows,history),history,`${learner}:${seed}:${anchor.type}:${anchor.word}:${variation}`,{...template.options,focus:anchor,selectionIndex:turn+variation,limit:1},surfaces)[0]
    const targets=q.targetWords.flatMap(wordTokens)
    if(!targets.length||targets.some(word=>functionWords.has(word))||!targets.every(word=>surfaces.has(word)))continue
    if(!casinoContentWords(q).every(word=>seen.every(player=>player.has('en:'+word))))continue
    return q
   }catch(error){if(!(error instanceof NoCompatibleBlueprintChoice))throw error}
  }
 }
 throw new Error('No shared familiar content-word contrast fits this lesson. Practise more words together first.')
}
