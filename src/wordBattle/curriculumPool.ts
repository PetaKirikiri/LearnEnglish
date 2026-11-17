import { lessonPracticeQuestions } from '../race/lessonPractice'
import { lessonThreeMatrixCatalogue } from '../classroom/wordCatalogue'
import { actionVocabulary, objectsForAction } from '../learning/sentenceRules/actionDialogue'
import { assessedSubjectPronouns } from '../learning/sentenceRules/assessmentScope'

// Nouns/functions remain scoped to lesson 1–7. The teacher requested the
// wider authored action catalogue for today’s playtest, using familiar objects.
const questions=Array.from({length:7},(_,i)=>lessonPracticeQuestions(String(i+1))).flat()
const surface=questions.map(question=>question.english.toLowerCase()).join('\n')
const tokens=new Set(surface.match(/[a-z]+/g)??[])
const appears=(word:string)=>new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(surface)
export const taughtNouns=lessonThreeMatrixCatalogue.filter(noun=>appears(noun.word))
export const taughtActions=actionVocabulary.filter(action=>action.complement==='none'||objectsForAction(action.word,taughtNouns).length>0)
export const taughtFunctions=['the','my','your','his','her','our','their','this','that','these','those','is','are','am','and','to','at','in','on','with','where','what',...assessedSubjectPronouns.map(subject=>subject.word)].filter(word=>tokens.has(word.toLowerCase()))
// Orange occurs as a fruit in these lessons, so it must not introduce a colour card.
export const taughtWords=[...new Set([...taughtNouns.map(noun=>noun.word),...taughtActions.map(action=>action.word),...taughtFunctions])]
