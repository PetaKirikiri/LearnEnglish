import {expect,it} from 'vitest'
import {advanceLearning,emptyLearning,fadingPercent,learningStates,type WordLearning} from './learningLifecycle'
import type {WordProgress} from './model'
const at=(seconds:number)=>new Date(Date.UTC(2026,0,1)+seconds*1000).toISOString()
it('marks a word Learnt as soon as its fade score reaches 100 percent',()=>{
 let state=emptyLearning()
 for(let i=1;i<=24;i++)state=advanceLearning(state,{correct:true,independent:false,at:at(i)})
 expect(state.provenAt).toBeNull()
 state=advanceLearning(state,{correct:true,independent:false,at:at(25)})
 expect(fadingPercent(state.fadeScore)).toBe(100)
 expect(state.provenAt).toBe(at(25));expect(state.confirmations).toBe(0)
 expect(state.reviewDueAt).toBe(at(25+86400))
})
it('does not postpone a review early, then schedules 3 days after a due success and relearns after failure',()=>{
 let state:WordLearning={...emptyLearning(),fadeScore:25,confirmations:3,provenAt:at(0),reviewDueAt:at(86400)}
 state=advanceLearning(state,{correct:true,independent:true,at:at(100)})
 expect(state.reviewStep).toBe(0);expect(state.reviewDueAt).toBe(at(86400))
 state=advanceLearning(state,{correct:true,independent:true,at:at(86400)})
 expect(state.reviewStep).toBe(1);expect(state.reviewDueAt).toBe(at(4*86400))
 state=advanceLearning(state,{correct:false,independent:true,at:at(4*86400)})
 expect(state.provenAt).toBeNull();expect(state.reviewDueAt).toBeNull();expect(state.fadeScore).toBe(5);expect(state.confirmations).toBe(0)
})
it('treats saved full fading as Learnt and ignores duplicate or already saved events',()=>{
 const row:WordProgress={word_id:'en:man',correct:30,attempts:30,listening_correct:10,direct_correct:0,recent_results:[true,true,true],last_practised:at(10),fade_score:25,confirmation_count:0,learning_updated_at:at(10)}
 const event={id:'new',targets:['man'],correct:true,hidden:true,heard:true,assisted:false,plays:1,at:at(11)}
 expect(learningStates([row]).get('en:man')?.provenAt).toBe(at(10))
 const state=learningStates([row],[{...event,id:'old',at:at(9)},event,event]).get('en:man')!
 expect(state.confirmations).toBe(0)
 expect(learningStates([row],[{...event,assisted:true},{...event,id:'replay',plays:2}]).get('en:man')?.confirmations).toBe(0)
})

it('counts correct sentence context toward fading and learns it at full fade',()=>{
 const events=Array.from({length:200},(_,i)=>({id:'sentence-'+i,targets:['drinking'],sentence:'She is drinking the water.',correct:true,hidden:true,heard:true,assisted:false,plays:1,at:at(i+1)}))
 const states=learningStates([],events)
 expect(states.get('en:water')?.fadeScore).toBe(25)
 expect(states.get('en:the')?.fadeScore).toBe(25)
 expect(states.get('en:water')?.confirmations).toBe(0)
 expect(states.get('en:water')?.provenAt).toBe(at(25))
 expect(states.get('en:drinking')?.provenAt).not.toBeNull()
 const failed={...events[0],id:'wrong',correct:false,at:at(201)}
 expect(learningStates([],[...events,failed]).get('en:water')).toEqual(states.get('en:water'))
 expect(learningStates([],[{...events[0],targets:[]}]).size).toBe(0)
})

it('gives the contrasted word three fading points and context one, learning at full fade',()=>{
 const events=Array.from({length:9},(_,i)=>({id:'weighted-'+i,targets:['his'],sentence:'I am going to his shop.',correct:true,hidden:false,heard:true,assisted:false,plays:1,at:at(i+1)}))
 const states=learningStates([],events)
 expect(states.get('en:his')?.fadeScore).toBe(25)
 expect(states.get('en:shop')?.fadeScore).toBe(9)
 expect(states.get('en:his')?.confirmations).toBe(0)
 expect(states.get('en:his')?.provenAt).toBe(at(9))
})
it('counts a shown unanswered question once, then adds only the +2 answer bonus',()=>{
 const shown={id:'served',phase:'presented' as const,presentedAt:at(1),at:at(1),targets:['his'],sentence:'I am going to his shop.',correct:false,hidden:false,heard:false,assisted:false,plays:0}
 const view=learningStates([],[shown,shown])
 expect(view.get('en:his')?.fadeScore).toBe(1);expect(view.get('en:shop')?.fadeScore).toBe(1)
 const answered={...shown,phase:'answered' as const,correct:true,at:at(2)}
 const result=learningStates([],[answered,answered])
 expect(result.get('en:his')?.fadeScore).toBe(3);expect(result.get('en:shop')?.fadeScore).toBe(1)
 const server:WordProgress={word_id:'en:his',correct:0,attempts:0,listening_correct:0,direct_correct:0,last_practised:at(1),recent_results:[],fade_score:1,learning_updated_at:at(1)}
 expect(learningStates([server],[answered]).get('en:his')?.fadeScore).toBe(3)
})
