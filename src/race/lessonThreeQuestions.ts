import type { HotelQuestion } from '../hotel/course'
import { lessonThreeCatalogue } from '../classroom/wordCatalogue'
import { locationWords, people, peopleAudio, peopleSentence, replyPerson } from '../learning/sentenceMatrix/peopleLocation'

export const lessonThreeStages=['lesson-three-people','lesson-three-answers','lesson-three-review']
const skill='race-lesson-three'
const places=locationWords(lessonThreeCatalogue)
// Introduce person/be agreement before adding the location answer.
export const lessonThreePeopleQuestions:HotelQuestion[]=people.flatMap(person=>(['am','is','are'] as const).map(verb=>{
 const english=`Where ${verb} ${person.word}?`
 const correct=verb===person.verb
 return {id:`l3-person-${person.word}-${verb}`,english,skill,correct:correct?0:1,audioUrl:peopleAudio(english),
 answers:[[{text:'Correct',skill}],[{text:'Wrong',skill}]],
 grammar:{kind:'meaning',context:'Match I/am, you/are, he/is and she/is.',phase:'practice',targets:['I','you','he','she','am','is','are'],contrast:correct?'person-correct':'person-wrong',explanation:`Where ${person.verb} ${person.word}?`}}
}))
export const lessonThreeAnswerQuestions=places.flatMap(place=>people.map((person,index)=>{
 const sentence=peopleSentence('answer',person.word,place)
 // Same destination in both options: recognizing the picture alone cannot win.
 const distractor=peopleSentence('answer',people[(index+1)%people.length].word,place).thai
 return {id:`l3-answer-${person.word}-${place.word}`,english:sentence.english,skill,correct:0,audioUrl:peopleAudio(sentence.english),
 answers:[[{text:sentence.thai,skill}],[{text:distractor,skill}]],meaningDistractor:distractor} satisfies HotelQuestion & {meaningDistractor:string}
}))
export const lessonThreeReviewQuestions=places.flatMap((place,index)=>people.map(person=>{
 const question=peopleSentence('question',person.word,place)
 const answer=peopleSentence('answer',replyPerson(person.word),place)
 const english=`${question.english} ${answer.english}`
 const distractor=peopleSentence('answer',replyPerson(person.word),places[(index+1)%places.length]).thai
 return {id:`l3-dialogue-${person.word}-${place.word}`,english,skill,correct:0,audioUrl:peopleAudio(english),
 answers:[[{text:answer.thai,skill}],[{text:distractor,skill}]],meaningDistractor:distractor} satisfies HotelQuestion & {meaningDistractor:string}
}))
export const lessonThreeRecordings=[...new Map([
 ...lessonThreePeopleQuestions,...lessonThreeAnswerQuestions,...lessonThreeReviewQuestions,
].map(q=>[q.audioUrl!,{audioUrl:q.audioUrl!,spokenText:q.english}])).values()]
