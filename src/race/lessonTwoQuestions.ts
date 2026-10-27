import type { HotelQuestion } from '../hotel/course'
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
// Round one changes only number and verb. Every noun occurs with both correct
// and incorrect agreement, so the noun or an -s ending cannot give away a choice.
export const lessonTwoNumberQuestions = judgement([...lessonTwoWords,...lessonTwoPairs], ['the'])
export const lessonTwoOwnerQuestions = lessonTwoWords.filter(item => (lessonTwoCore as readonly string[]).includes(item.singular)).flatMap(item => [false,true].flatMap(plural => (['my','your'] as const).map(owner => {
  const sentence = numberSentence(item,plural,owner)
  const other = numberSentence(item,plural,owner === 'my' ? 'your' : 'my')
  return {id:`l2-owner-${sentence.noun}-${owner}`,english:sentence.english,skill,correct:0,audioUrl:lessonTwoAudio(sentence.noun,owner,sentence.verb),
    answers:[[{text:sentence.thai,skill}],[{text:other.thai,skill}]],meaningDistractor:other.thai} satisfies HotelQuestion & {meaningDistractor:string}
})))
export const lessonTwoReviewQuestions = judgement([...lessonTwoWords,...lessonTwoPairs],owners)
export const lessonTwoRecordings = [...new Map([...lessonTwoNumberQuestions,...lessonTwoOwnerQuestions,...lessonTwoReviewQuestions].map(q => [q.audioUrl,{audioUrl:q.audioUrl,spokenText:q.english}])).values()]
