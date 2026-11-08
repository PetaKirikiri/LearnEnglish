import {expect,it} from 'vitest'
import {inspectSentence,isFlagged,parseDecisions,sentenceReview,type SentenceUse} from './sentenceReviewCatalogue'
import {actionStarTiers} from '../race/actionStarContent'

const use:SentenceUse={source:'Test',area:'practice',questionId:'test',position:1,choices:['ใช่','ไม่ใช่'],correct:0,intentionalIncorrect:false,task:'Choose the Thai translation'}
const codes=(english:string,uses=[use])=>inspectSentence(english,uses).map(issue=>issue.code)

it('lists unique sentences in stable order and retains original source positions',()=>{
 expect(sentenceReview.length).toBeGreaterThan(1000)
 expect(new Set(sentenceReview.map(row=>row.id)).size).toBe(sentenceReview.length)
 expect(sentenceReview.map(row=>row.position)).toEqual(sentenceReview.map((_,i)=>i+1))
 for(const row of sentenceReview)expect(row.uses.every(source=>source.position>0)).toBe(true)
 for(const tier of actionStarTiers)for(const q of tier.questions){
  expect(sentenceReview.some(row=>row.uses.some(source=>source.area==='practice'&&source.questionId===q.id))).toBe(true)
 }
 expect(sentenceReview.some(row=>row.uses.every(source=>source.area==='excluded'))).toBe(true)
})
it('flags questionable context and untaught scope without flagging ordinary examples',()=>{
 expect(codes('The doctors are going to their toilets.')).toEqual(expect.arrayContaining(['untaught-destination','multiple-destinations','owned-toilet']))
 expect(codes('I am eating an apple.')).toEqual([])
 expect(codes('They are eating an apple.')).toContain('shared-single-object')
 expect(codes('They are eating apples.')).toEqual([])
 expect(codes('It are sleeping.',[{...use,intentionalIncorrect:true}])).toContain('untaught-it')
 expect(codes('She is reading its book.')).toContain('untaught-it')
 expect(codes('Where are the key?',[{...use,intentionalIncorrect:true}])).toEqual([])
})
it('catches flawed answers and a mass noun in a number task',()=>{
 expect(codes('the water',[{...use,task:'Choose one or many',nounCountability:'mass'}])).toContain('uncountable-number-task')
 expect(codes('the key',[{...use,choices:['same','same'],correct:4}])).toEqual(expect.arrayContaining(['duplicate-answers:Test','missing-answer:Test']))
})
it('allows manual flag and unflag decisions to override suggestions',()=>{
 const row=sentenceReview.find(row=>row.issues.length>0)!
 expect(isFlagged(row,{})).toBe(true)
 const decisions=parseDecisions(JSON.stringify({[row.id]:{flagged:false,note:'Reviewed in class',updatedAt:'2026-11-08'},invalid:{flagged:'false'}}))
 expect(isFlagged(row,decisions)).toBe(false)
 expect(decisions[row.id].note).toBe('Reviewed in class')
 expect(decisions.invalid).toBeUndefined()
 expect(isFlagged({...row,issues:[]},{[row.id]:{flagged:true,note:'',updatedAt:''}})).toBe(true)
 expect(parseDecisions('bad json')).toEqual({})
})
