import {lessonNumber} from '../learning/lessonRequests'
import type {PracticeLevel} from './PracticeLevelPicker'
import type {DeckOptions} from './generatedPracticeProgress'
/** Lessons specify constructions only. Account evidence owns every lexical choice. */
export function lessonPracticeTemplate(value:unknown):{level:PracticeLevel;label:string;scope:string;options:DeckOptions}{
 const lesson=Number(lessonNumber(value)) as PracticeLevel
 // Lesson 3's existing What…doing? pair includes the general action answer;
 // the location-only bank omitted its intransitive assessment path.
 const structure=lesson===5?'destination':lesson===6?'identify':undefined
 return {level:lesson===3?5:lesson===4?6:lesson,label:`Lesson ${lesson}`,scope:`lesson-${lesson}`,options:{structure}}
}
