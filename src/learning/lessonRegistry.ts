import {assessedSubjectPronouns} from './sentenceRules/assessmentScope'
import {lessonId, type LessonId} from './lessonRequests'
import { subjectPronouns } from './sentenceMatrix/subjectEngine'
import { peopleAudio } from './sentenceMatrix/peopleLocation'
import { lessonOneCatalogue, lessonTwoMatrixCatalogue, lessonTwoIntroducedCatalogue, lessonThreeMatrixCatalogue } from '../classroom/wordCatalogue'
import { lessonTwoAudio } from '../race/lessonTwoQuestions'
import type { MatrixLesson } from './sentenceMatrix/model'
const lessonOneRecordedWords=new Set(lessonOneCatalogue.map(item=>item.word))
const lessonTwoRecordedWords=new Set(lessonTwoIntroducedCatalogue.map(item=>item.word))
export const cumulativeLessonTwoAudio: NonNullable<MatrixLesson['audio']> = (noun,owner,verb) => lessonTwoRecordedWords.has(noun)
  ? lessonTwoAudio(noun,owner as 'the'|'my'|'your',verb)
  : lessonOneRecordedWords.has(noun) && verb==='is' ? `/audio/race-class-one/${noun.replaceAll(' ', '-')}-${owner}.wav` : undefined
const earlierWords=new Set(lessonTwoMatrixCatalogue.map(item=>item.word))
const lessonThreeQuestionAudio:NonNullable<MatrixLesson['audio']>=(noun,owner,verb)=>noun==='water'?undefined:earlierWords.has(noun)
 ? cumulativeLessonTwoAudio(noun,owner,verb)
 : `/audio/race-lesson-three/${noun.replaceAll(' ','-')}-${owner}-${verb}.wav`
export const classroomMatrices = {
  'lesson-1': {id:'lesson-1', practiceMode:'journey', stages:['class-one-judgement','tonight-slots'], vocabulary:lessonOneCatalogue, plural:false, settings:{explanations:true,wordPicker:true}, initialWord:'hotel', audio:cumulativeLessonTwoAudio},
  'lesson-2': {id:'lesson-2', practiceMode:'journey', stages:['lesson-two-number','lesson-two-owner','lesson-two-review'], vocabulary:lessonTwoMatrixCatalogue, plural:true, settings:{explanations:true,wordPicker:true}, initialWord:'shoes', audio:cumulativeLessonTwoAudio},
  'lesson-3': {id:'lesson-3', practiceMode:'lesson', stages:['lesson-three-people','lesson-three-answers','lesson-three-review'], owners:['the','my','your','his','her','our','their'], vocabulary:lessonThreeMatrixCatalogue, plural:true, pattern:'people-location', subjectModes:{pronouns:subjectPronouns,names:[{word:'Bia',thai:'Bia',kind:'person'},{word:'Central',thai:'เซ็นทรัล',kind:'place'},{word:'Success',thai:'Success',kind:'place'}],initialPronoun:'you',initialName:'Bia',audio:(sentence,mode)=>mode==='pronoun'?peopleAudio(sentence):undefined}, settings:{explanations:true,wordPicker:true}, initialWord:'hotel', audio:lessonThreeQuestionAudio},
  'lesson-4': {id:'lesson-4', practiceMode:'action-stars', stages:['lesson-four-actions'], vocabulary:lessonThreeMatrixCatalogue, plural:true, pattern:'present-action', actionReply:'same-subject', actions:['eating','drinking','reading','holding','opening','washing'], owners:['the','my','your','his','her','our','their'], initialOwner:'the', subjectModes:{pronouns:assessedSubjectPronouns,names:[],initialPronoun:'I'}, settings:{explanations:true,wordPicker:true,initialPattern:'answer'}, initialWord:'apple'},
  'lesson-5': {id:'lesson-5', practiceMode:'lesson', stages:['lesson-five-destinations'], vocabulary:lessonThreeMatrixCatalogue.filter(item=>['hotel','school','gym','bedroom','kitchen'].includes(item.word)), plural:false, pattern:'present-action', actionQuestion:'destination', actions:['going','walking','running'], owners:['the','my','your','his','her','our','their'], initialOwner:'the', subjectModes:{pronouns:assessedSubjectPronouns,names:[],initialPronoun:'you'}, settings:{explanations:true,wordPicker:true,initialPattern:'question'}, initialWord:'hotel'},
  'lesson-6': {id:'lesson-6',practiceMode:'identification',stages:['lesson-six-identification'],vocabulary:lessonThreeMatrixCatalogue,plural:false,pattern:'identification',initialWord:'phone',settings:{wordPicker:true,explanations:true}},
} satisfies Record<LessonId, MatrixLesson>

export const lessonRegistry = classroomMatrices
export function requestLesson(value: unknown): MatrixLesson { return lessonRegistry[lessonId(value)] }

/** A question and its answer are one construction entry, supplied to shared navigation. */
export const classroomStructures = [
 {id:'identify',question:'What is this?',lesson:classroomMatrices['lesson-6'],lessonIds:['lesson-6']},
 {id:'where',question:'Where is the hotel?',lesson:classroomMatrices['lesson-3'],lessonIds:['lesson-1','lesson-2']},
 {id:'ask',question:'What are you doing?',lesson:{...classroomMatrices['lesson-3'],pattern:'present-action'},lessonIds:['lesson-3','lesson-4']},
 {id:'destination',question:'Where are you going?',lesson:classroomMatrices['lesson-5'],lessonIds:['lesson-5']},
] as const satisfies readonly {id:string;question:string;lesson:MatrixLesson;lessonIds:readonly LessonId[]}[]
/** Only introduced constructions are available; earlier lessons stay available for revision. */
export function structuresForLesson(lesson:LessonId){
 const level=Number(lesson.slice(7))
 return classroomStructures.filter(structure=>Math.min(...structure.lessonIds.map(id=>Number(id.slice(7))))<=level)
}
export type ClassroomStructureId=typeof classroomStructures[number]['id']
export function structureForLesson(id?:LessonId):ClassroomStructureId{return classroomStructures.find(structure=>id!==undefined&&(structure.lessonIds as readonly LessonId[]).includes(id))?.id??'ask'}

export function lessonForStructure(id:ClassroomStructureId,selectedLesson?:LessonId):MatrixLesson{
 const structure=classroomStructures.find(entry=>entry.id===id)!
 return selectedLesson&&(structure.lessonIds as readonly LessonId[]).includes(selectedLesson)
  ? {...classroomMatrices[selectedLesson],pattern:structure.lesson.pattern}
  : structure.lesson
}
