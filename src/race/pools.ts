import {lessonPracticeQuestions} from './lessonPractice'
import {actionPracticeQuestions} from './actionPracticeContent'
import { lessonThreePeopleQuestions, lessonThreeAnswerQuestions, lessonThreeReviewQuestions } from './lessonThreeQuestions'
import { lessonTwoNumberQuestions, lessonTwoOwnerQuestions, lessonTwoReviewQuestions } from './lessonTwoQuestions'
import { tonightMeaningQuestions, tonightJudgementQuestions } from './tonightQuestions'
import { classOneQuestions, classOneVocabularyQuestions, classOneFrameQuestions } from '../portal/classOne'
import { holidayMeaningQuestions, holidayQuestions } from './holidayQuestions'
import type { HotelQuestion } from '../hotel/course'

// Keep the teacher's selected vocabulary and question frame stable for a race.
export const racePools: { id: string; title: string; kind?: 'judgement' | 'meaning'; questions: (HotelQuestion & { meaningDistractor?: string })[] }[] = [
  {id:'lesson-six-identification',title:'Lesson 6 · What is this?',kind:'meaning',questions:lessonPracticeQuestions(6)},
  {id:'lesson-five-destinations',title:'Class 5 · Where are you going?',kind:'meaning',questions:lessonPracticeQuestions(5)},
  {id:'lesson-four-actions',title:'Lesson 4 · Actions and ownership',kind:'meaning',questions:lessonPracticeQuestions(4)},
  { id: 'man-woman', title: 'A man · A woman', questions: classOneVocabularyQuestions.slice(2, 4) },
  { id: 'who-what', title: 'Who · What', questions: classOneQuestions.slice(0, 2) },
  { id: 'where-when', title: 'Where · When', questions: classOneQuestions.slice(2, 4) },
  { id: 'much-many', title: 'How much · How many', questions: classOneQuestions.slice(5, 7) },
  { id: 'first-questions', title: 'Who is this? · What is this?', questions: classOneFrameQuestions },
  { id: 'where-is-the', title: 'Where is the…? · Correct or wrong', kind: 'judgement', questions: holidayQuestions },
  { id: 'holiday-meaning', title: 'Where is the…? · Holiday words', kind: 'meaning', questions: holidayMeaningQuestions },
  { id: 'class-one-judgement', title: 'Class 1 · Correct or wrong', kind: 'judgement', questions: tonightJudgementQuestions },
  { id: 'tonight-slots', title: 'Where is · the / my / your · Tonight', kind: 'meaning', questions: tonightMeaningQuestions },
  { id: 'lesson-two-number', title: 'Lesson 2 · is / are', kind: 'judgement', questions: lessonTwoNumberQuestions },
  { id: 'lesson-two-owner', title: 'Lesson 2 · my / your', kind: 'meaning', questions: lessonTwoOwnerQuestions },
  { id: 'lesson-two-review', title: 'Lesson 2 · English → Thai', kind: 'meaning', questions: lessonTwoReviewQuestions },
  {id:'lesson-three-people',title:'Lesson 3 · I am / you are / he is / she is',kind:'judgement',questions:lessonThreePeopleQuestions},
  {id:'lesson-three-answers',title:'Lesson 3 · At the…',kind:'meaning',questions:lessonThreeAnswerQuestions},
  {id:'lesson-three-review',title:'Lesson 3 · Ask and answer',kind:'meaning',questions:lessonThreeReviewQuestions},
  ...([4,5] as const).map(level=>({id:level===4?'classroom-action-questions':'classroom-action-answers',title:level===4?'What … doing?':'… am / is / are …ing',kind:'meaning' as const,questions:actionPracticeQuestions.filter(q=>q.level===level).map(q=>({id:q.id,english:q.english,audioUrl:q.audioUrl,skill:'classroom-actions',correct:q.correct as 0|1,answers:q.choices.map(text=>[{text,skill:'classroom-actions'}]) as HotelQuestion['answers'],meaningDistractor:q.choices[1]}))})),
]
