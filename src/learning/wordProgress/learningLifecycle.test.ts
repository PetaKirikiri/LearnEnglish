import {expect,it} from 'vitest'
import {advanceLearning,emptyLearning,fadingPercent,learningStates} from './learningLifecycle'
import type {WordProgress} from './model'
const at=(seconds:number)=>new Date(Date.UTC(2026,0,1)+seconds*1000).toISOString()
it('requires full fading before three independent confirmations can prove a word',()=>{
 let state=emptyLearning()
 for(let i=1;i<=25;i++)state=advanceLearning(state,{correct:true,independent:true,at:at(i)})
 expect(fadingPercent(state.fadeScore)).toBe(100);expect(state.confirmations).toBe(0);expect(state.provenAt).toBeNull()
 state=advanceLearning(state,{correct:true,independent:true,at:at(26)})
 state=advanceLearning(state,{correct:true,independent:false,at:at(27)})
 expect(state.confirmations).toBe(1)
 state=advanceLearning(state,{correct:true,independent:true,at:at(28)})
 state=advanceLearning(state,{correct:true,independent:true,at:at(29)})
 expect(state.provenAt).toBe(at(29));expect(state.reviewDueAt).toBe(at(29+86400))
})
it('does not postpone a review early, then schedules 3 days after a due success and relearns after failure',()=>{
 let state={...emptyLearning(),fadeScore:25,confirmations:3,provenAt:at(0),reviewDueAt:at(86400)}
 state=advanceLearning(state,{correct:true,independent:true,at:at(100)})
 expect(state.reviewStep).toBe(0);expect(state.reviewDueAt).toBe(at(86400))
 state=advanceLearning(state,{correct:true,independent:true,at:at(86400)})
 expect(state.reviewStep).toBe(1);expect(state.reviewDueAt).toBe(at(4*86400))
 state=advanceLearning(state,{correct:false,independent:true,at:at(4*86400)})
 expect(state.provenAt).toBeNull();expect(state.reviewDueAt).toBeNull();expect(state.fadeScore).toBe(5);expect(state.confirmations).toBe(0)
})
it('retains legacy fading without inventing proof, and ignores events already included in the server snapshot',()=>{
 const row:WordProgress={word_id:'en:man',correct:30,attempts:30,listening_correct:10,direct_correct:0,recent_results:[true,true,true],last_practised:at(10),fade_score:25,confirmation_count:0,learning_updated_at:at(10)}
 const event={id:'new',targets:['man'],correct:true,hidden:true,heard:true,assisted:false,plays:1,at:at(11)}
 expect(learningStates([row]).get('en:man')?.provenAt).toBeNull()
 const state=learningStates([row],[{...event,id:'old',at:at(9)},event,event]).get('en:man')!
 expect(state.confirmations).toBe(1)
 expect(learningStates([row],[{...event,assisted:true},{...event,id:'replay',plays:2}]).get('en:man')?.confirmations).toBe(0)
})

