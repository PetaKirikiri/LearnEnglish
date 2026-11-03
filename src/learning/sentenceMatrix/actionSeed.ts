import {actionCapabilities} from '../sentenceRules/actionCapabilities'
import {meaningForWord} from '../sentenceRules/blueprints'
import {actionSubjects,type ActionSubject} from '../sentenceRules/actionDialogue'
import type {LanguageDocument} from './LanguageQuadrant'
import type {SentenceMatrixProps} from './SentenceMatrix'
import type {MatrixLesson,Determiner} from './model'
/** Reopen a generated question in the same editable engine without changing its words. */
export function actionSeed(document:Pick<LanguageDocument,'units'>,lesson:MatrixLesson):SentenceMatrixProps['initialAction']{
 const value=(role:string)=>document.units.find(u=>u.role===role)?.english.replace(/[?.]$/,'')
 const raw=value('person')
 if(!raw)throw new Error('Question has no subject')
 const capability=actionCapabilities(lesson),pronoun=raw.toLowerCase(),isPronoun=pronoun in actionSubjects
 if(isPronoun&&!capability.subjects.some(item=>item.word.toLowerCase()===pronoun))throw new Error('Question subject outside lesson scope')
 if(!isPronoun&&!lesson.subjectModes?.names.some(item=>item.kind==='person'&&item.word===raw)&&!lesson.vocabulary.some(item=>item.word===raw&&meaningForWord(item)?.kind==='person'))throw new Error('Question person outside lesson scope')
 const rawAction=value('action')
 if(!rawAction)throw new Error('Question has no action')
 const action=rawAction==='doing'?capability.actions[0].word:rawAction
 const noun=value('object')
 const object=noun?capability.objects(action).find(o=>o.noun===noun)?.word:undefined
 if(noun&&!object)throw new Error('Question object is outside this lesson catalogue')
 const owner=value('person-determiner')?.toLowerCase()
 return {answerPronoun:isPronoun&&!document.units.some(unit=>unit.role==='question')?raw:undefined,subject:isPronoun?pronoun as ActionSubject:'he',action,object,determiner:value('determiner')?.toLowerCase() as Determiner|undefined,
  personMode:isPronoun?'pronoun':owner?'noun':'name',personWord:isPronoun?undefined:owner?`${owner} ${raw}`:raw}
}
