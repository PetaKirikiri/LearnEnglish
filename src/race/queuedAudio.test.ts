// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {audioPreparationPlan,queuedAudioCandidates,nextPersonalQuestion} from './practiceForecast'
import {generatedDeck} from './generatedPracticeProgress'
it('prepares the queued boy scenario before it enters the Current noun pool without writing progress',()=>{
 const snapshot=localStorage.length,q=nextPersonalQuestion(6,[],[],'prep',0)
 const queued=queuedAudioCandidates(6,[],[])
 expect(queued.some(q=>q.targetWords.some(w=>['boy','boys'].includes(w)))).toBe(true)
 expect(generatedDeck(6,[],[],'actual').some(q=>q.targetWords.some(w=>['boy','boys'].includes(w)))).toBe(false)
 const plan=audioPreparationPlan(6,[],[],'prep',0,q)
 expect(plan.length).toBeLessThanOrEqual(16);expect(plan.some(q=>q.targetWords.some(w=>['boy','boys'].includes(w)))).toBe(true)
 expect(queued.some(q=>q.targetWords.some(w=>w==='water'))).toBe(true)
 expect(localStorage.length).toBe(snapshot)
})
