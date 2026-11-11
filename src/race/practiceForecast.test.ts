// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {forecastPractice,nextPersonalQuestion} from './practiceForecast'
import {availableVocabulary,evidenceScores,type ListeningEvidence} from './generatedPracticeProgress'
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
 for(const level of [1,2,3,4,5,6] as const){const q=nextPersonalQuestion(level,[],[],'account',0);expect(q.vocabulary.every(word=>allowed.has(word.replace(/s$/,''))||allowed.has(word))).toBe(true);expect(q.document.english).not.toMatch(/apple|banana/i)}
})
it('forecasts newly unlocked vocabulary while keeping earned evidence unchanged',()=>{
 const rows:WordProgress[]=[{word_id:'en:man',correct:25,attempts:25,listening_correct:0,direct_correct:0,last_practised:'',recent_results:[true,true]}]
 const events:ListeningEvidence[]=[0,1].map(i=>({id:`earned-${i}`,questionId:'old',level:1,sentence:'the man',targets:['man'],vocabulary:['man'],correct:true,hidden:true,heard:true,assisted:false,plays:1,at:new Date(i).toISOString()}))
 const q=nextPersonalQuestion(1,rows,events,'unlock',0)
 // Use a noun question whose next correct hidden contrast is the third proof.
 const current={...q,document:{...q.document,english:'the man'},targetWords:['man'],listeningWords:['man'],vocabulary:['man'],credit:'man'}
 const future=forecastPractice(1,rows,events,'unlock',0,current)
 expect(future.slice(1).some(question=>question.vocabulary.includes('son')||question.vocabulary.includes('sons'))).toBe(true)
 expect(events).toHaveLength(2);expect(availableVocabulary(rows,events).has('son')).toBe(false)
})
