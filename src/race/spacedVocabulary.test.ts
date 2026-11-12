// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {generatedDeck,type ListeningEvidence} from './generatedPracticeProgress'
import type {WordProgress} from '../learning/wordProgress/model'
const now=Date.UTC(2026,10,11),old=new Date(now-2*86400000).toISOString()
const row:WordProgress={word_id:'en:man',correct:28,attempts:28,listening_correct:3,direct_correct:0,last_practised:old,recent_results:[true,true,true],fade_score:25,confirmation_count:3,proven_at:old,review_due_at:new Date(now-86400000).toISOString(),review_step:0,learning_updated_at:old,learning_version:1}
it('prioritizes a due hidden-word review over new vocabulary without testing an unproven plural',()=>{
 const deck=generatedDeck(6,[row],[],'review',{now})
 expect(deck.every(q=>q.targetWords.includes('man'))).toBe(true)
})
it('moves on after the due review succeeds, and backfills the word after a failed review',()=>{
 const event:ListeningEvidence={id:'review',questionId:'q',level:6,sentence:'the man',targets:['man'],vocabulary:['man'],correct:true,hidden:true,heard:true,assisted:false,plays:1,at:new Date(now).toISOString()}
 const next=generatedDeck(6,[row],[event],'success',{now:now+1})
 expect(next.some(q=>q.targetWords.some(w=>['woman','women'].includes(w)))).toBe(true)
 const failed=generatedDeck(6,[row],[{...event,correct:false}],'failure',{now:now+1})
 expect(failed[0].targetWords.some(w=>['man','men'].includes(w))).toBe(true)
})
