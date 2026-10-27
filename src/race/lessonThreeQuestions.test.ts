// @vitest-environment node
import { expect,it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { lessonThreePastQuestions, lessonThreeOwnerQuestions, lessonThreeReviewQuestions } from './lessonThreeQuestions'
import { lessonOneCatalogue,lessonTwoCatalogue,lessonThreeCatalogue,lessonThreeIntroducedCatalogue } from '../classroom/wordCatalogue'
import { locationSentence,allDeterminers } from '../learning/sentenceMatrix/model'
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
it('introduces past agreement, then ownership, before combining skills in review',()=>{
 expect(lessonThreePastQuestions).toHaveLength(20)
 expect(lessonThreeOwnerQuestions).toHaveLength(20)
 expect(lessonThreeReviewQuestions).toHaveLength(810)
 for(const q of lessonThreePastQuestions){
  expect(q.english).toMatch(/^Where (was|were) the /)
  const noun=lessonTwoCatalogue.find(item=>q.english.endsWith(` ${item.word}?`))!
  expect(q.english===locationSentence(noun,'the','','past').english).toBe(q.correct===0)
 }
 for(const q of lessonThreeOwnerQuestions)expect(q.english).toMatch(/^Where (is|are) (his|her) /)
 for(const item of lessonThreeCatalogue)for(const owner of allDeterminers)for(const tense of ['past','present'] as const){
  expect(lessonThreeReviewQuestions.some(q=>q.english===locationSentence(item,owner.word,'',tense).english)).toBe(true)
 }
 const all=[...lessonThreePastQuestions,...lessonThreeOwnerQuestions,...lessonThreeReviewQuestions]
 expect(new Set(all.map(q=>q.id)).size).toBe(all.length)
 for(const q of [...lessonThreeOwnerQuestions,...lessonThreeReviewQuestions]){
  expect(q.answers).toHaveLength(2)
  expect(q.answers[0]).not.toEqual(q.answers[1])
  expect(q.answers.every(answer=>/[ก-๙]/.test(answer[0].text))).toBe(true)
 }
})

it('ships a matching nonempty recording for every question and teaching combination',()=>{
 const all=[...lessonThreePastQuestions,...lessonThreeOwnerQuestions,...lessonThreeReviewQuestions]
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
