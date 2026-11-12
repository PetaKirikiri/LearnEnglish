// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {forecastPractice,nextPersonalQuestion} from './practiceForecast'
import {vocabularyFamily,availableVocabulary,evidenceScores,type ListeningEvidence} from './generatedPracticeProgress'
import {wordOpacity,wordTokens,type WordProgress} from '../learning/wordProgress/model'
it('predicts the same next question as actual successful evidence without writing progress',()=>{
 const rows:WordProgress[]=[],events:ListeningEvidence[]=[],q=nextPersonalQuestion(6,rows,events,'run',0)
 const before=JSON.stringify({rows,events}),snapshot=localStorage.length
 const forecast=forecastPractice(6,rows,events,'run',0,q)
 expect(forecast).toHaveLength(11);expect(JSON.stringify({rows,events})).toBe(before);expect(localStorage.length).toBe(snapshot)
 const scores=evidenceScores(rows,events)
 const real:ListeningEvidence={id:'real',questionId:q.id,level:6,sentence:q.document.english,targets:q.credit===null?[]:q.targetWords,vocabulary:q.vocabulary,correct:true,heard:true,hidden:q.listeningWords.flatMap(wordTokens).every(w=>wordOpacity(w,scores,{fadeMode:true})===0),assisted:false,plays:1,at:new Date().toISOString()}
 expect(nextPersonalQuestion(6,rows,[real],'run',1).id).toBe(forecast[1].id)
})
it('uses the same vocabulary eligibility in all six structures',()=>{
 const allowed=availableVocabulary([],[])
 for(const level of [1,2,3,4,5,6] as const){const q=nextPersonalQuestion(level,[],[],'account',0);expect(q.vocabulary.every(word=>allowed.has(vocabularyFamily(word))||vocabularyFamily(word)==='woman')).toBe(true);expect(q.document.english).not.toMatch(/apple|banana/i)}
})
it('forecasts newly unlocked vocabulary while keeping earned evidence unchanged',()=>{
 const rows:WordProgress[]=[{word_id:'en:man',correct:24,attempts:24,listening_correct:0,direct_correct:0,last_practised:'2026-01-01T00:00:00Z',recent_results:[true],fade_score:24,learning_updated_at:'2026-01-01T00:00:00Z'}]
 const events:ListeningEvidence[]=[],before=JSON.stringify(rows),options={focus:{type:'noun' as const,word:'man'}}
 let index=0,current=nextPersonalQuestion(1,rows,events,'unlock',index,options)
 while(!current.targetWords.includes('man')&&index<10)current=nextPersonalQuestion(1,rows,events,'unlock',++index,options)
 expect(current.targetWords).toContain('man')
 expect(availableVocabulary(rows,events).has('boy')).toBe(false)
 const future=forecastPractice(1,rows,events,'unlock',index,current)
 expect(future.slice(1).some(question=>question.vocabulary.includes('boy')||question.vocabulary.includes('boys'))).toBe(true)
 expect(events).toHaveLength(0);expect(JSON.stringify(rows)).toBe(before);expect(availableVocabulary(rows,events).has('boy')).toBe(false)
})
