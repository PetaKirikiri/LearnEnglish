// @vitest-environment node
import { expect,it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { lessonThreePeopleQuestions, lessonThreeAnswerQuestions, lessonThreeReviewQuestions } from './lessonThreeQuestions'
import { lessonOneCatalogue,lessonTwoCatalogue,lessonThreeCatalogue,lessonThreeIntroducedCatalogue } from '../classroom/wordCatalogue'
import { people,peopleSentence,locationWords,replyPerson } from '../learning/sentenceMatrix/peopleLocation'
import { defaultGuide } from '../classroom/pronunciation/guides'
it('adds 12 pictured noun families without leaking future words into earlier lessons',()=>{
 expect(lessonOneCatalogue).toHaveLength(20)
 expect(lessonTwoCatalogue).toHaveLength(57)
 expect(lessonThreeIntroducedCatalogue).toHaveLength(24)
 expect(lessonThreeCatalogue).toHaveLength(81)
 expect(new Set(lessonThreeCatalogue.map(item=>item.word)).size).toBe(81)
 for(const item of lessonThreeIntroducedCatalogue){
  expect(existsSync(`public/classroom/icons/level-three/${item.singular}.png`)).toBe(true)
  expect(item.categories?.length).toBeGreaterThan(0)
  expect(defaultGuide(item.word).english.drawn).toBe(true)
 }
})
it('teaches present person agreement, location meaning and reciprocal dialogue',()=>{
 const places=locationWords(lessonThreeCatalogue)
 expect(lessonThreePeopleQuestions).toHaveLength(12)
 expect(lessonThreeAnswerQuestions).toHaveLength(places.length*4)
 expect(lessonThreeReviewQuestions).toHaveLength(places.length*4)
 expect(places.map(p=>p.word)).not.toContain('shoe')
 expect(places.map(p=>p.word)).not.toContain('bedroom')
 for(const q of lessonThreePeopleQuestions){
  const person=people.find(p=>q.english.endsWith(` ${p.word}?`))!
  expect(q.english===`Where ${person.verb} ${person.word}?`).toBe(q.correct===0)
 }
 for(const place of places)for(const person of people){
  const q=lessonThreeReviewQuestions.find(q=>q.id===`l3-dialogue-${person.word}-${place.word}`)!
  expect(q.english).toBe(`${peopleSentence('question',person.word,place).english} ${peopleSentence('answer',replyPerson(person.word),place).english}`)
 }
 const all=[...lessonThreePeopleQuestions,...lessonThreeAnswerQuestions,...lessonThreeReviewQuestions]
 expect(all.length).toBeGreaterThanOrEqual(80)
 expect(new Set(all.map(q=>q.id)).size).toBe(all.length)
 for(const q of all)expect(q.english).not.toMatch(/\b(was|were|his|her)\b/)
 for(const q of [...lessonThreeAnswerQuestions,...lessonThreeReviewQuestions]){
  expect(q.answers).toHaveLength(2)
  expect(q.answers[0]).not.toEqual(q.answers[1])
  expect(q.answers.every(answer=>/[ก-๙]/.test(answer[0].text))).toBe(true)
 }
})

it('ships a matching nonempty recording for every question and teaching combination',()=>{
 const all=[...lessonThreePeopleQuestions,...lessonThreeAnswerQuestions,...lessonThreeReviewQuestions]
 for(const q of all){
  expect(existsSync(`public${q.audioUrl}`),q.audioUrl).toBe(true)
  const file=readFileSync(`public${q.audioUrl}`)
  expect(file.toString('ascii',0,4)).toBe('RIFF')
  expect(file.length).toBeGreaterThan(4800)
  const folder=q.audioUrl!.slice(0,q.audioUrl!.lastIndexOf('/'))
  const name=q.audioUrl!.slice(q.audioUrl!.lastIndexOf('/')+1)
  const manifest=JSON.parse(readFileSync(`public${folder}/voice-manifest.json`,'utf8'))
  expect(manifest[name].text).toBe(q.english)
 }
})
