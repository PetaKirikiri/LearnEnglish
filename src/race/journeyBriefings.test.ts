import {describe,it,expect} from 'vitest'
import {existsSync} from 'node:fs'
import {journeyBriefings} from './journeyBriefings'
import {quadrantLayout} from '../learning/sentenceMatrix/LanguageQuadrant'
import {actionPracticeQuestions} from './actionPracticeContent'
import {mergeRun,runStars} from './PracticeJourney'
describe('shared level briefings',()=>{
 it('requires all 30 answers for Level 4 completion and stars',()=>{
  expect(journeyBriefings.find(b=>b.id===4)?.total).toBe(30)
  const short={level:4 as const,score:9,total:9,passed:true}
  expect(runStars(short)).toBe(0)
  expect(mergeRun({},short)).toEqual({})
  expect(runStars({...short,score:30,total:30})).toBe(3)
 })
 it('uses valid shared constructions and existing recorded audio for every example',()=>{
  expect(journeyBriefings.map(b=>b.id)).toEqual([1,2,3,4,5,6])
  for(const b of journeyBriefings)for(const e of b.examples){
   expect(()=>quadrantLayout(e.document)).not.toThrow()
   expect(existsSync(`public${e.audio}`),e.audio).toBe(true)
   expect(e.choices).toHaveLength(2)
   if(b.id>=4){const q=actionPracticeQuestions.find(q=>q.english===e.document.english)!;expect(e.choices).toEqual(q.choices);expect(e.correct).toBe(q.correct)}
  }
 })
})
