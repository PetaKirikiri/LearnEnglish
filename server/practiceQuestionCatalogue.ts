import {canonicalBlueprintQuestion} from '../src/race/blueprintWordServer'
import {generatedCandidates,structureCandidates,determinerCandidates,type GeneratedQuestion} from '../src/race/generatedPracticeContent'
import type {PracticeLevel} from '../src/race/PracticeLevelPicker'
import {questionLessonDeck} from '../src/pages/generalQuestionDeck'
const indexes=new Map<string,Map<string,GeneratedQuestion>>()
function lookup(key:string,id:string,create:()=>GeneratedQuestion[]){
 let index=indexes.get(key)
 if(!index){index=new Map(create().map(question=>[question.id,question]));indexes.set(key,index)}
 return index.get(id)
}
/** Resolve only server-authored combinations, building relevant construction banks on demand. */
export function canonicalPracticeQuestion(id:string,recipe?:unknown){
 if(recipe!==undefined){const question=canonicalBlueprintQuestion(recipe);return question?.id===id?question:undefined}
 const daily=/^daily-question-([78])-/.exec(id)
 if(daily){
  const level=daily[1]==='7'?7:8
  // Changed answer keys need fresh IDs. Older typed questions stay available for queued receipts.
  const format=level===7
   ? id.startsWith('daily-question-7-typed-')?'beginner':'legacy-typed'
   : id.startsWith('daily-question-8-beginner-')?'beginner'
   : id.startsWith('daily-question-8-word-')?'word'
   : id.startsWith('daily-question-8-sentence-')?'sentence':'original'
  return lookup('daily-'+level+'-'+format,id,()=>questionLessonDeck(level,format))
 }
 // Historical pending receipts retain their old catalogue lookup only.
 if(id.startsWith('identify-v2-'))return lookup('identify',id,()=>structureCandidates('identify'))
 const match=/^compose-v2-l([1-6])-/.exec(id)
 if(!match)return undefined
 const level=Number(match[1]) as PracticeLevel
 const simple=level===6?lookup('determiner',id,determinerCandidates)??lookup('identify',id,()=>structureCandidates('identify')):undefined
 if(simple)return simple
 const destination=level===5?lookup('destination',id,()=>structureCandidates('destination')):undefined
 if(destination)return destination
 const generated=lookup('level-'+level,id,()=>generatedCandidates(level))
 return generated??(level===3?lookup('location',id,()=>structureCandidates('location')):undefined)
}
