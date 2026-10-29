import { nounsForSentence,agreeingNoun } from '../sentenceRules/choices'
import { useState } from 'react'
import { useSentenceSlots } from './selection'
import { lessonDeterminers, lessonVerbs, tenseForVerb, type BeVerb, type Tense, locationSentence, type Determiner, type MatrixLesson } from './model'

export function useLocationMatrix(lesson: MatrixLesson, controlledWord?: string, onWord?: (word:string)=>void) {
  const [localWord, setLocalWord] = useState(lesson.initialWord)
  const catalogue = nounsForSentence({blueprint:'where-noun',determiner:lesson.initialOwner??'the'},lesson.vocabulary)
  const [tense,setTense]=useState<Tense>(lesson.initialTense??'present')
  const owners=lessonDeterminers(lesson), verbs=lessonVerbs(lesson)
  if (!catalogue.length) throw new Error('A sentence matrix needs at least one vocabulary word')
  const item = catalogue.find(item=>item.word===(controlledWord ?? localWord)) ?? catalogue.find(item=>item.word===lesson.initialWord) ?? catalogue[0]
  const slots = [
    {label:'Question',options:[['Where','ที่ไหน']] as const},
    {label:'Verb',options: verbs.map(item=>[item.word,item.thai] as const)},
    {label:'Owner',options:owners.map(item=>[item.word,item.thai] as const)},
    {label:'Noun',options:catalogue.map(item=>[item.word,item.thai] as const)},
  ]
  const selection = useSentenceSlots(slots,[undefined,undefined,lesson.initialOwner])
  const owner = selection.parts[2][0] as Determiner
  function chooseWord(word:string) {
    if (!catalogue.some(item=>item.word===word)) return
    setLocalWord(word); onWord?.(word)
  }
  function canChooseVerb(verb:BeVerb) {
    return verbs.some(option=>option.word===verb)&&!!agreeingNoun(item,verb,catalogue,owner)
  }
  function chooseVerb(verb:BeVerb) { const target=agreeingNoun(item,verb,catalogue,owner);if(canChooseVerb(verb)&&target){setTense(tenseForVerb(verb));chooseWord(target.word)} }

  function chooseOwner(owner:Determiner) { selection.choose(2,owners.findIndex(item=>item.word===owner)) }
  const sentence=locationSentence(item,owner,'',tense)
  return { ...selection, catalogue, owners, verbs, tense, item, word:item.word, owner, verb:sentence.verb, chooseWord, chooseVerb, chooseOwner, canChooseVerb, sentence }
}
