// @vitest-environment happy-dom
import {beforeEach,expect,it} from 'vitest'
import {generatedCandidates,practiceCandidates} from './generatedPracticeContent'
import {generatedDeck,masteredWords,evidenceScores,saveEvidence,loadEvidence,curriculumBaseline,availableVocabulary,type ListeningEvidence} from './generatedPracticeProgress'
import {quadrantLayout} from '../learning/sentenceMatrix/LanguageQuadrant'
import {completeAdaptiveStar} from './actionStarProgress'
const event=(overrides:Partial<ListeningEvidence>={}):ListeningEvidence=>({id:crypto.randomUUID(),questionId:'q',level:1,sentence:'the man',targets:['man'],vocabulary:['man'],correct:true,hidden:true,heard:true,assisted:false,plays:1,at:new Date().toISOString(),...overrides})
const faded={word_id:'en:man',correct:25,attempts:25,listening_correct:0,direct_correct:0,last_practised:'2026-01-01T00:00:00Z',recent_results:[true,true,true],fade_score:25,confirmation_count:0,learning_updated_at:'2026-01-01T00:00:00Z'}
beforeEach(()=>localStorage.clear())
it('builds reproducible thirty-answer rounds without padding vocabulary to get distinct sentences',()=>{
 for(const level of [1,2,3,4,5,6] as const){
  const deck=generatedDeck(level,[],[],'same')
  expect(deck).toHaveLength(30);expect(deck).toEqual(generatedDeck(level,[],[],'same'))
  for(const q of deck){expect(q.choices[0]).not.toBe(q.choices[1]);expect(()=>quadrantLayout(q.document)).not.toThrow();expect(practiceCandidates(level).some(item=>item.id===q.id)).toBe(true)}
 }
})
it('preserves evidence isolation, duplicate protection and recovery after a mistake',()=>{
 const e=event();saveEvidence(e,'one');saveEvidence(e,'one');expect(loadEvidence('one')).toHaveLength(1);expect(loadEvidence('two')).toEqual([])
 const proved=[event(),event(),event()];expect(masteredWords([faded],proved).has('en:man')).toBe(true)
 const failed=[...proved,event({correct:false})];expect(masteredWords([faded],failed).has('en:man')).toBe(false)
 expect(evidenceScores([faded],failed)['en:man']).toBe(5)
})
it('requires unassisted first-play hidden listening to advance the hierarchy',()=>{
 for(const bad of [{hidden:false},{heard:false},{assisted:true},{plays:2}])expect([...availableVocabulary([faded],Array.from({length:3},()=>event(bad)))]).toEqual(['man','woman','phone','bag'])
 expect([...availableVocabulary([faded],[event(),event(),event()])]).toEqual(['man','woman','boy','phone','bag'])
 expect(curriculumBaseline([],[],'a')).toEqual(curriculumBaseline([],[],'b'))
})
it('keeps separate answer attempts and the existing thirty-answer star pass requirements',()=>{
 const progress=completeAdaptiveStar({},1,27,30,true)
 expect(progress[1]?.passes).toBe(1)
 expect(completeAdaptiveStar(progress,1,30,30,true)[1]?.passes).toBe(2)
 expect(completeAdaptiveStar(progress,2,29,30,false)[2]?.passes).toBeUndefined()
})
it('retains shared blueprint rendering and contrast-only scoring',()=>{
 const q=generatedCandidates(5).find(q=>q.targetWords[0]==='your')!
 expect(q.credit).toBe('your')
 const agreement=generatedCandidates(2).find(q=>q.document.english==='Where is my hotel?')!
 expect(agreement.listeningWords).toContain('is')
 expect(agreement.targetWords).toEqual(['hotel','is'])
})
