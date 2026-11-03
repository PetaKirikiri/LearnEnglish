import {tonightMeaningQuestions} from './tonightQuestions'
import {lessonTwoReviewQuestions} from './lessonTwoQuestions'
import {lessonThreeAnswerQuestions} from './lessonThreeQuestions'
import {actionStarTiers} from './actionStarContent'
import {requestLesson} from '../learning/lessonRegistry'
import {lessonNumber} from '../learning/lessonRequests'
import {composeLessonAction,actionCapabilities} from '../learning/sentenceRules/actionCapabilities'
import {people,peopleSentence} from '../learning/sentenceMatrix/peopleLocation'
import type {LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'
import type {HotelQuestion} from '../hotel/course'
export type LessonPracticeQuestion=HotelQuestion & {meaningDistractor:string;document?:LanguageDocument}
export function lessonPracticeQuestions(value:unknown):LessonPracticeQuestion[] {
 const number=lessonNumber(value),lesson=requestLesson(number)
 if(number==='1')return [...tonightMeaningQuestions]
 if(number==='2')return [...tonightMeaningQuestions,...lessonTwoReviewQuestions.filter(q=>q.id.startsWith('l2-translation-')&&q.audioUrl?.startsWith('/audio/race-lesson-two/'))]
 if(number==='3')return lessonThreeAnswerQuestions.map(q=>{
  const person=people.find(p=>q.id.startsWith(`l3-answer-${p.word}-`))!
  const noun=lesson.vocabulary.find(n=>q.id===`l3-answer-${person.word}-${n.word}`)!
  const sentence=peopleSentence('answer',person.word,noun)
  const roles=['person','be','preposition','determiner','object'] as const
  return {...q,document:{...sentence,construction:'location-answer',units:sentence.units.map((unit,index)=>({...unit,role:roles[index]}))}}
 })
 const capability=actionCapabilities(lesson)
 // The recorded action bank supplies the taught ownership contrasts.
 // Validate each candidate against the lesson request instead of maintaining another grammar.
 return actionStarTiers.flatMap(tier=>tier.questions).map(q=>{
  const action=q.units.find(u=>u.role==='action')!.english
  const subject=q.units.find(u=>u.role==='person')!.english
  const noun=q.units.find(u=>u.role==='object')!.english.replace(/[.!?]$/,'')
  const object=capability.objects(action).find(item=>item.noun===noun)
  if(!object)throw new Error(`Recorded object outside Lesson 4: ${noun}`)
  const owner=q.units.find(u=>u.role==='determiner')?.english as Parameters<typeof composeLessonAction>[1]['determiner']
  const sentence=composeLessonAction(lesson,{subject,action,object:object.word,determiner:owner}).answer
  if(sentence.english!==q.english||sentence.thai!==q.thai)throw new Error(`Recorded lesson sentence differs from engine: ${q.id}`)
  if(q.correct!==0&&q.correct!==1)throw new Error(`Invalid answer index: ${q.id}`)
  const other=q.choices[1-q.correct]
  return {id:q.id,english:q.english,skill:'race-lesson-four',correct:q.correct,audioUrl:q.audioUrl,answers:[[{text:q.choices[0],skill:'race-lesson-four'}],[{text:q.choices[1],skill:'race-lesson-four'}]],meaningDistractor:other,document:{...sentence,construction:'action-answer'}}
 })
}
