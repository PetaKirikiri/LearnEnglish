import type { HotelQuestion } from '../hotel/course'
import { holidayMeaningQuestions } from './holidayQuestions'
import { lessonTwoWords, lessonTwoPairs, lessonTwoCore, numberSentence, owners, type LessonTwoWord, type Owner } from '../classroom/lessonTwoContent'

const skill = 'race-lesson-two'
export const lessonTwoAudio = (noun: string, owner: Owner, verb: string) => `/audio/race-lesson-two/${noun}-${owner}-${verb}.wav`
function judgement(items: readonly LessonTwoWord[], determiners: Owner[]) {
  return items.flatMap(item => (item.singular ? [false, true] : [true]).flatMap(plural => determiners.flatMap(owner => {
    const sentence = numberSentence(item, plural, owner)
    return [true, false].map(correct => {
      const verb = correct ? sentence.verb : sentence.verb === 'is' ? 'are' : 'is'
      return { id:`l2-${sentence.noun}-${owner}-${verb}`, english:`Where ${verb} ${owner} ${sentence.noun}?`, skill, correct:correct ? 0 : 1,
        answers: [[{text:'Correct',skill}], [{text:'Wrong',skill}]], audioUrl:lessonTwoAudio(sentence.noun,owner,verb),
        grammar:{kind:'meaning',context:'Match is or are to the noun.',phase:'practice',targets:['is','are'],contrast:correct?'number-correct':'number-wrong',explanation:sentence.english},
      } satisfies HotelQuestion
    })
  })))
}
// Round one tests only is/are agreement in complete sentences. Every noun
// and determiner occurs with correct and incorrect agreement; no words are omitted.
export const lessonTwoNumberQuestions = judgement([...lessonTwoWords,...lessonTwoPairs], owners)
export const lessonTwoOwnerQuestions = lessonTwoWords.filter(item => (lessonTwoCore as readonly string[]).includes(item.singular)).flatMap(item => [false,true].flatMap(plural => (['my','your'] as const).map(owner => {
  const sentence = numberSentence(item,plural,owner)
  const other = numberSentence(item,plural,owner === 'my' ? 'your' : 'my')
  return {id:`l2-owner-${sentence.noun}-${owner}`,english:sentence.english,skill,correct:0,audioUrl:lessonTwoAudio(sentence.noun,owner,sentence.verb),
    answers:[[{text:sentence.thai,skill}],[{text:other.thai,skill}]],meaningDistractor:other.thai} satisfies HotelQuestion & {meaningDistractor:string}
})))
// Translation contrasts change number, owner, or object, never grammaticality.
// Explicit Thai quantities make the singular/plural choices unambiguous.
const translationWords: readonly LessonTwoWord[] = [...lessonTwoWords,...lessonTwoPairs]
export const lessonTwoReviewQuestions: (HotelQuestion & {meaningDistractor:string})[] = [
  ...translationWords.flatMap((item,index)=>(item.singular?[false,true]:[true]).flatMap(plural=>owners.map(owner=>{
    const sentence=numberSentence(item,plural,owner)
    const otherItem=item.singular ? lessonTwoWords[(index+1)%lessonTwoWords.length] : lessonTwoPairs[(index-lessonTwoWords.length+1)%lessonTwoPairs.length]
    const distractor=owner==='my' ? numberSentence(item,plural,'your').thai
      : owner==='the' && item.singular ? numberSentence(item,!plural,owner).thai
      : numberSentence(otherItem,plural,owner).thai
    return {id:`l2-translation-${sentence.noun}-${owner}`,english:sentence.english,skill,correct:0,
      audioUrl:lessonTwoAudio(sentence.noun,owner,sentence.verb),
      answers:[[{text:sentence.thai,skill}],[{text:distractor,skill}]],meaningDistractor:distractor} satisfies HotelQuestion & {meaningDistractor:string}
  }))),
  // Earlier lesson nouns return in their taught singular Where is the... frame.
  ...holidayMeaningQuestions.map(question=>({...question,id:`l2-translation-${question.id}`,
    meaningDistractor:question.answers[1-question.correct].map(part=>part.text).join('')})),
]
export const lessonTwoRecordings = [...new Map([...lessonTwoNumberQuestions,...lessonTwoOwnerQuestions,...lessonTwoReviewQuestions].filter(q=>q.audioUrl?.startsWith('/audio/race-lesson-two/')).map(q => [q.audioUrl,{audioUrl:q.audioUrl,spokenText:q.english}])).values()]
