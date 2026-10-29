import { subjectPronouns } from '../learning/sentenceMatrix/subjectEngine'
import { peopleAudio } from '../learning/sentenceMatrix/peopleLocation'
import { lessonOneCatalogue, lessonTwoMatrixCatalogue, lessonTwoIntroducedCatalogue, lessonThreeMatrixCatalogue } from './wordCatalogue'
import { lessonTwoAudio } from '../race/lessonTwoQuestions'
import type { MatrixLesson } from '../learning/sentenceMatrix/model'
const lessonOneRecordedWords=new Set(lessonOneCatalogue.map(item=>item.word))
const lessonTwoRecordedWords=new Set(lessonTwoIntroducedCatalogue.map(item=>item.word))
export const cumulativeLessonTwoAudio: NonNullable<MatrixLesson['audio']> = (noun,owner,verb) => lessonTwoRecordedWords.has(noun)
  ? lessonTwoAudio(noun,owner as 'the'|'my'|'your',verb)
  : lessonOneRecordedWords.has(noun) && verb==='is' ? `/audio/race-class-one/${noun.replaceAll(' ', '-')}-${owner}.wav` : undefined
const earlierWords=new Set(lessonTwoMatrixCatalogue.map(item=>item.word))
const lessonThreeQuestionAudio:NonNullable<MatrixLesson['audio']>=(noun,owner,verb)=>earlierWords.has(noun)
 ? cumulativeLessonTwoAudio(noun,owner,verb)
 : `/audio/race-lesson-three/${noun.replaceAll(' ','-')}-${owner}-${verb}.wav`
export const classroomMatrices = {
  'lesson-1': {id:'lesson-1', vocabulary:lessonOneCatalogue, plural:false, settings:{explanations:true,wordPicker:true}, initialWord:'hotel', audio:cumulativeLessonTwoAudio},
  'lesson-2': {id:'lesson-2', vocabulary:lessonTwoMatrixCatalogue, plural:true, settings:{explanations:true,wordPicker:true}, initialWord:'shoes', audio:cumulativeLessonTwoAudio},
  'lesson-3': {id:'lesson-3', vocabulary:lessonThreeMatrixCatalogue, plural:false, pattern:'people-location', subjectModes:{pronouns:subjectPronouns,names:[{word:'Bia',thai:'Bia',kind:'person'},{word:'Central',thai:'เซ็นทรัล',kind:'place'},{word:'Success',thai:'Success',kind:'place'}],initialPronoun:'you',initialName:'Bia',audio:(sentence,mode)=>mode==='pronoun'?peopleAudio(sentence):undefined}, settings:{explanations:true,wordPicker:true}, initialWord:'hotel', audio:lessonThreeQuestionAudio},
} satisfies Record<string, MatrixLesson>
