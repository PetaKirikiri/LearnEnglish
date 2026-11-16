import {expect,it} from 'vitest'
import {casinoContentWords,sharedCasinoQuestion} from './casinoWordServer'
import type {GeneratedQuestion} from '../race/generatedPracticeContent'
import type {WordProgress} from '../learning/wordProgress/model'
const seen=(word:string):WordProgress=>({word_id:'en:'+word,exposure_count:1,attempts:0,correct:0,listening_correct:0,direct_correct:0,last_practised:'',recent_results:[]})
it('covers plain answer labels and picture-only vocabulary, including deliberately unseen distractors',()=>{
 const q={document:{english:'These are the phones.'},choices:['These are the phones.','These are the zeppelins.'],sceneChoices:[{word:'unicorns'}]} as GeneratedQuestion
 expect(casinoContentWords(q).sort()).toEqual(['phones','unicorns','zeppelins'])
})
it('does not infer a compound phrase from separately seen words',()=>{
 const rows=['the','air','conditioners','phones'].map(seen)
 expect(()=>sharedCasinoQuestion(7,'student',rows,[],0,'phrase',[rows,rows,rows])).toThrow(/shared familiar content/)
})
it('excludes a distractor known only to the selected player',()=>{
 const selected=['the','phone','phones','bag','bags','brother','brothers'].map(seen),others=['the','phone','phones','bag','bags'].map(seen)
 for(let turn=0;turn<20;turn++){
  const q=sharedCasinoQuestion(7,'student',selected,[],turn,'peer-check',[selected,others,others])
  expect(casinoContentWords(q).every(word=>['phones','bags'].includes(word))).toBe(true)
  expect(q.targetWords.every(word=>['phones','bags'].includes(word))).toBe(true)
 }
})
