import { useState } from 'react'
import { useSentenceSlots } from './selection'
import { determiners, formForVerb, locationSentence, verbForWord, type Determiner, type MatrixLesson } from './model'

export function useLocationMatrix(lesson: MatrixLesson, controlledWord?: string, onWord?: (word:string)=>void) {
  const [localWord, setLocalWord] = useState(lesson.initialWord)
  const catalogue = lesson.vocabulary
  if (!catalogue.length) throw new Error('A sentence matrix needs at least one vocabulary word')
  const item = catalogue.find(item=>item.word===(controlledWord ?? localWord)) ?? catalogue.find(item=>item.word===lesson.initialWord) ?? catalogue[0]
  const slots = [
    {label:'Question',options:[['Where','ที่ไหน']] as const},
    {label:'Verb',options: lesson.plural ? [['is','หนึ่งสิ่ง'],['are','หลายสิ่ง']] as const : [['is','อยู่']] as const},
    {label:'Owner',options:determiners.map(item=>[item.word,item.thai] as const)},
    {label:'Noun',options:catalogue.map(item=>[item.word,item.thai] as const)},
  ]
  const selection = useSentenceSlots(slots,[undefined,undefined,lesson.initialOwner])
  const owner = selection.parts[2][0] as Determiner
  function chooseWord(word:string) {
    if (!catalogue.some(item=>item.word===word)) return
    setLocalWord(word); onWord?.(word)
  }
  function canChooseVerb(verb:'is'|'are') {
    const target = formForVerb(item,verb)
    return !(item.pairOnly && verb==='is') && catalogue.some(word=>word.word===target && verbForWord(word)===verb)
  }
  function chooseVerb(verb:'is'|'are') { if(canChooseVerb(verb)) chooseWord(formForVerb(item,verb)) }
  function chooseOwner(owner:Determiner) { selection.choose(2,determiners.findIndex(item=>item.word===owner)) }
  return { ...selection, item, word:item.word, owner, verb:verbForWord(item), chooseWord, chooseVerb, chooseOwner, canChooseVerb, sentence:locationSentence(item,owner) }
}
