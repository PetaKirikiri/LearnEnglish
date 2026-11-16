import {lessonNumber} from '../learning/lessonRequests'
import type {PracticeLevel} from './PracticeLevelPicker'
import type {DeckOptions} from './generatedPracticeProgress'
/** Lessons specify constructions only. Account evidence owns every lexical choice. */
export function lessonPracticeTemplate(value:unknown):{level:PracticeLevel;label:string;scope:string;options:DeckOptions}{
 const lesson=Number(lessonNumber(value))
 // Lesson 3's existing What…doing? pair includes the general action answer;
 // the location-only bank omitted its intransitive assessment path.
 const structure=lesson===5?'destination':lesson>=6?'identify':undefined
 return {level:(lesson===3?5:lesson===4||lesson===7?6:lesson) as PracticeLevel,label:`Lesson ${lesson}`,scope:`lesson-${lesson}`,options:{structure,...(lesson===7?{referenceNumber:'plural' as const}:{})}}
}
