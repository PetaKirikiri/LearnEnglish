import { lessonOneCatalogue, lessonTwoCatalogue, lessonTwoIntroducedCatalogue, lessonThreeCatalogue } from './wordCatalogue'
import { lessonTwoAudio } from '../race/lessonTwoQuestions'
import type { MatrixLesson } from '../learning/sentenceMatrix/model'
const lessonTwoRecordedWords=new Set(lessonTwoIntroducedCatalogue.map(item=>item.word))
export const cumulativeLessonTwoAudio: NonNullable<MatrixLesson['audio']> = (noun,owner,verb) => lessonTwoRecordedWords.has(noun)
  ? lessonTwoAudio(noun,owner as 'the'|'my'|'your',verb)
  : `/audio/race-class-one/${noun.replaceAll(' ', '-')}-${owner}.wav`
const earlierWords=new Set(lessonTwoCatalogue.map(item=>item.word))
export const lessonThreeAudio:NonNullable<MatrixLesson['audio']>=(noun,owner,verb)=>
  earlierWords.has(noun) && (owner==='the'||owner==='my'||owner==='your') && (verb==='is'||verb==='are')
  ? cumulativeLessonTwoAudio(noun,owner,verb)
  : `/audio/race-lesson-three/${noun.replaceAll(' ','-')}-${owner}-${verb}.wav`
export const classroomMatrices = {
  'lesson-1': {id:'lesson-1', vocabulary:lessonOneCatalogue, plural:false, settings:{explanations:true,wordPicker:true}, initialWord:'hotel', audio:cumulativeLessonTwoAudio},
  'lesson-2': {id:'lesson-2', vocabulary:lessonTwoCatalogue, plural:true, settings:{explanations:true,wordPicker:true}, initialWord:'shoes', audio:cumulativeLessonTwoAudio},
  'lesson-3': {id:'lesson-3', vocabulary:lessonThreeCatalogue, plural:true, past:true, owners:['the','my','your','his','her'], settings:{explanations:true,wordPicker:true}, initialWord:'phone', audio:lessonThreeAudio},
} satisfies Record<string, MatrixLesson>
