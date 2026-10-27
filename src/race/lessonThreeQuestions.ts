import type { HotelQuestion } from '../hotel/course'
import { lessonTwoCatalogue, lessonThreeCatalogue } from '../classroom/wordCatalogue'
import { lessonThreeAudio } from '../classroom/matrixLessons'
import { locationSentence, allDeterminers, type Tense, type Determiner, type ClassroomWord } from '../learning/sentenceMatrix/model'

export const lessonThreeStages=['lesson-three-past','lesson-three-owner','lesson-three-review']
const skill='race-lesson-three'
const familiar=lessonTwoCatalogue.filter(item=>['shoe','shoes','key','keys','bag','bags','book','books','phone','phones'].includes(item.word))
// One new contrast at a time: was/were with familiar nouns and the; then his/her
// with familiar nouns in the present. Only review combines the new pieces.
export const lessonThreePastQuestions:HotelQuestion[]=familiar.flatMap(item=>[true,false].map(correct=>{
 const sentence=locationSentence(item,'the','','past')
 const verb=correct?sentence.verb:sentence.verb==='was'?'were':'was'
 return {id:`l3-past-${item.word}-${verb}`,english:`Where ${verb} the ${item.word}?`,skill,correct:correct?0:1,
 answers:[[{text:'Correct',skill}],[{text:'Wrong',skill}]],audioUrl:lessonThreeAudio(item.word,'the',verb),
 grammar:{kind:'meaning',context:'Earlier: match was or were to the noun.',phase:'practice',targets:['was','were'],contrast:correct?'number-correct':'number-wrong',explanation:sentence.english}}
}))
function meaning(item:ClassroomWord,owner:Determiner,tense:Tense,contrast:'owner'|'time') {
 const sentence=locationSentence(item,owner,'',tense)
 const translation=(selectedOwner:Determiner,selectedTense:Tense)=>`${selectedTense==='past'?'ก่อนหน้านี้':'ตอนนี้'} ${locationSentence(item,selectedOwner).thai}`
 const correct=translation(owner,tense)
 const distractor=contrast==='time'?translation(owner,tense==='past'?'present':'past'):translation(owner==='his'?'her':owner==='her'?'his':owner==='my'?'your':'my',tense)
 return {id:`l3-${contrast}-${item.word}-${owner}-${tense}`,english:sentence.english,skill,correct:0,
 audioUrl:lessonThreeAudio(item.word,owner,sentence.verb),answers:[[{text:correct,skill}],[{text:distractor,skill}]],meaningDistractor:distractor} satisfies HotelQuestion & {meaningDistractor:string}
}
export const lessonThreeOwnerQuestions=familiar.flatMap(item=>(['his','her'] as const).map(owner=>meaning(item,owner,'present','owner')))
export const lessonThreeReviewQuestions=lessonThreeCatalogue.flatMap(item=>allDeterminers.flatMap(({word:owner})=>(['present','past'] as const).map(tense=>meaning(item,owner,tense,owner==='his'||owner==='her'?'owner':'time')))).map(q=>({...q,id:`review-${q.id}`}))
export const lessonThreeRecordings=[...new Map([...lessonThreePastQuestions,...lessonThreeOwnerQuestions,...lessonThreeReviewQuestions].filter(q=>q.audioUrl?.startsWith('/audio/race-lesson-three/')).map(q=>[q.audioUrl,{audioUrl:q.audioUrl,spokenText:q.english}])).values()]
