import { lessonTwoNumberQuestions, lessonTwoOwnerQuestions, lessonTwoReviewQuestions } from './lessonTwoQuestions'
import { tonightMeaningQuestions } from './tonightQuestions'
import { classOneQuestions, classOneVocabularyQuestions, classOneFrameQuestions } from '../portal/classOne'
import { holidayMeaningQuestions, holidayQuestions } from './holidayQuestions'
import type { HotelQuestion } from '../hotel/course'

// Keep the teacher's selected vocabulary and question frame stable for a race.
export const racePools: { id: string; title: string; kind?: 'judgement' | 'meaning'; questions: (HotelQuestion & { meaningDistractor?: string })[] }[] = [
  { id: 'man-woman', title: 'A man · A woman', questions: classOneVocabularyQuestions.slice(2, 4) },
  { id: 'who-what', title: 'Who · What', questions: classOneQuestions.slice(0, 2) },
  { id: 'where-when', title: 'Where · When', questions: classOneQuestions.slice(2, 4) },
  { id: 'much-many', title: 'How much · How many', questions: classOneQuestions.slice(5, 7) },
  { id: 'first-questions', title: 'Who is this? · What is this?', questions: classOneFrameQuestions },
  { id: 'where-is-the', title: 'Where is the…? · Correct or wrong', kind: 'judgement', questions: holidayQuestions },
  { id: 'holiday-meaning', title: 'Where is the…? · Holiday words', kind: 'meaning', questions: holidayMeaningQuestions },
  { id: 'tonight-slots', title: 'Where is · the / my / your · Tonight', kind: 'meaning', questions: tonightMeaningQuestions },
  { id: 'lesson-two-number', title: 'Lesson 2 · is / are', kind: 'judgement', questions: lessonTwoNumberQuestions },
  { id: 'lesson-two-owner', title: 'Lesson 2 · my / your', kind: 'meaning', questions: lessonTwoOwnerQuestions },
  { id: 'lesson-two-review', title: 'Lesson 2 · Review', kind: 'judgement', questions: lessonTwoReviewQuestions },
]
