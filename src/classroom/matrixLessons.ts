import { lessonOneCatalogue, lessonTwoCatalogue } from './wordCatalogue'
import { lessonTwoAudio } from '../race/lessonTwoQuestions'
import type { MatrixLesson } from '../learning/sentenceMatrix/model'
export const classroomMatrices = {
  'lesson-1': {id:'lesson-1', vocabulary:lessonOneCatalogue, plural:false, settings:{explanations:true,wordPicker:true}, initialWord:'hotel'},
  'lesson-2': {id:'lesson-2', vocabulary:lessonTwoCatalogue, plural:true, settings:{explanations:true,wordPicker:true}, initialWord:'shoes', audio:lessonTwoAudio},
} satisfies Record<string, MatrixLesson>
