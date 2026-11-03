import {actionSubjects,objectsForAction,type ActionSubject} from '../sentenceRules/actionDialogue'
import type {LanguageDocument} from './LanguageQuadrant'
import type {SentenceMatrixProps} from './SentenceMatrix'
import type {MatrixLesson,Determiner} from './model'
/** Reopen a generated question in the same editable engine without changing its words. */
export function actionSeed(document:Pick<LanguageDocument,'units'>,lesson:MatrixLesson):SentenceMatrixProps['initialAction']{
 const value=(role:string)=>document.units.find(u=>u.role===role)?.english.replace(/[?.]$/,'')
 const raw=value('person')??'you',pronoun=raw==='I'?'you':raw.toLowerCase(),isPronoun=pronoun in actionSubjects
 const action=value('action')==='doing'?'eating':value('action')??'eating'
 const noun=value('object')
 const object=noun?objectsForAction(action,lesson.vocabulary).find(o=>o.noun===noun)?.word:undefined
 if(noun&&!object)throw new Error('Question object is outside this lesson catalogue')
 const owner=value('person-determiner')?.toLowerCase()
 return {subject:isPronoun?pronoun as ActionSubject:'he',action,object,determiner:value('determiner')?.toLowerCase() as Determiner|undefined,
  personMode:isPronoun?'pronoun':owner?'noun':'name',personWord:isPronoun?undefined:owner?`${owner} ${raw}`:raw}
}
