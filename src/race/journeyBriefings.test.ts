import {describe,it,expect} from 'vitest'
import {existsSync} from 'node:fs'
import {journeyBriefings} from './journeyBriefings'
import {quadrantLayout} from '../learning/sentenceMatrix/LanguageQuadrant'
import {actionPracticeQuestions} from './actionPracticeContent'
describe('shared level briefings',()=>{
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
