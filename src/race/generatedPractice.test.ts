// @vitest-environment happy-dom
import {beforeEach,describe,expect,it} from 'vitest'
import {generatedCandidates,sentenceKey} from './generatedPracticeContent'
import {availableVocabulary,generatedDeck,masteredWords,evidenceScores,saveEvidence,loadEvidence,availableActions,availableDescriptions,curriculumBaseline,sharedStarterVocabulary,vocabularyProfileKey,vocabularyFamily,type ListeningEvidence} from './generatedPracticeProgress'
import {quadrantLayout} from '../learning/sentenceMatrix/LanguageQuadrant'
import {numberCatalogue} from './numberCatalogue'
import {wordId,type WordProgress} from '../learning/wordProgress/model'
import {completeAdaptiveStar} from './actionStarProgress'
const event=(overrides:Partial<ListeningEvidence>={}):ListeningEvidence=>({id:crypto.randomUUID(),questionId:'q',level:1,sentence:'the man',targets:['man'],vocabulary:['man'],correct:true,hidden:true,heard:true,assisted:false,plays:1,at:new Date().toISOString(),...overrides})
const successes=(overrides:Partial<ListeningEvidence>={})=>Array.from({length:3},()=>event(overrides))
beforeEach(()=>localStorage.clear())
describe('composed practice curriculum',()=>{
 it('keeps Level 6 action questions on the ownership-and-object blueprint',()=>{
  const questions=generatedCandidates(6).filter(q=>q.document.units.some(unit=>unit.role==='action'))
  expect(questions.length).toBeGreaterThan(0)
  for(const q of questions)for(const document of [q.document,...q.alternatives??[]]){
   expect(document.units.some(unit=>unit.role==='object'),document.english).toBe(true)
   expect(document.units.some(unit=>unit.role==='determiner'),document.english).toBe(true)
   expect(['eating','reading','drinking','holding','opening','washing']).toContain(q.action)
  }
  expect(generatedCandidates(5).some(q=>q.action==='walking'&&!q.document.units.some(unit=>unit.role==='object'))).toBe(true)
 })
 it('has thirty distinct questions, balanced unpredictable positions and valid pictures in every level',()=>{
  for(const level of [1,2,3,4,5,6] as const){
   const deck=generatedDeck(level,[],[],'round-one')
   expect(deck).toHaveLength(30);expect(new Set(deck.map(q=>sentenceKey(q.document.english))).size).toBe(30)
   expect(deck.filter(q=>q.correct===0)).toHaveLength(15)
   expect(deck.map(q=>q.correct).join('')).not.toMatch(/^(01|10)+$/)
   expect(deck).toEqual(generatedDeck(level,[],[],'round-one'))
   for(const q of deck){expect(q.choices).toHaveLength(2);expect(q.choices[0]).not.toBe(q.choices[1]);expect(()=>quadrantLayout(q.document)).not.toThrow();for(const d of q.alternatives??[])expect(()=>quadrantLayout(d)).not.toThrow()}
  }
 })
 it('never introduces untaught articles or unsupported action constructions',()=>{
  for(const level of [1,2,3,4,5,6] as const)for(const q of generatedCandidates(level)){
   expect(q.document.english).not.toMatch(/\b(a|an|it|to)\b/i)
   for(const d of q.alternatives??[])expect(d.english).not.toMatch(/\b(a|an|it|to)\b/i)
  }
 })
 it('unlocks the next noun family only after three independent hidden-word listening successes',()=>{
  const initial=availableVocabulary([],[])
  expect(initial.size).toBe(sharedStarterVocabulary.length)
  for(const evidence of [successes({hidden:false}),successes({heard:false}),successes({assisted:true}),successes({plays:2}),successes().slice(0,2)])expect(availableVocabulary([],evidence)).toEqual(initial)
  const proved=successes();expect(availableVocabulary([],proved).size).toBe(initial.size+1)
  expect(masteredWords([],proved).has('en:man')).toBe(true)
  const next=[...availableVocabulary([],proved)].find(w=>!initial.has(w))!
  expect(generatedDeck(1,[],proved,'next').some(q=>q.family===next)).toBe(true)
  const withNew=[...proved,event({targets:[next],vocabulary:[next],hidden:false})]
  expect(availableVocabulary([],withNew).size).toBe(initial.size+1)
  const failed=[...proved,event({correct:false})];expect(masteredWords([],failed).has('en:man')).toBe(false)
 })
 it('uses previous learning, holds the new word until learned, and avoids the last round when alternatives exist',()=>{
  const rows:WordProgress[]=numberCatalogue.map(n=>({word_id:wordId(n.word),correct:25,attempts:25,listening_correct:0,direct_correct:0,last_practised:'',recent_results:[true,true,true]}))
  const familiar=curriculumBaseline(rows,[],'learner'),first=generatedDeck(2,rows,[],'one',{familiar})
  const events=first.map(q=>event({level:2,questionId:q.id,sentence:q.document.english,targets:q.targetWords,vocabulary:q.vocabulary,hidden:false}))
  const next=generatedDeck(2,rows,events,'two',{familiar}),sentences=new Set(first.map(q=>sentenceKey(q.document.english)))
  expect(next.some(q=>sentences.has(sentenceKey(q.document.english)))).toBe(false)
  expect(masteredWords(rows,[]).size).toBe(0)
 })
 it('credits only the tested contrast and preserves independent account evidence without duplicate attempts',()=>{
  const q=generatedCandidates(5).find(q=>q.targetWords[0]==='your')!
  expect(q.credit).toBe('your')
  const e=event({sentence:'your',targets:q.targetWords,vocabulary:q.vocabulary})
  saveEvidence(e,'one');saveEvidence(e,'one')
  expect(loadEvidence('one')).toHaveLength(1);expect(loadEvidence('two')).toHaveLength(0)
  expect(evidenceScores([],loadEvidence('one'))).toEqual({'en:your':1})
 })
 it('introduces later action verbs only after listening mastery and never leaks them through a distractor',()=>{
  const options={actions:['holding','opening','washing'],progressiveActions:true,reviewActions:['eating','reading','drinking']}
  const nouns=[...successes({targets:['apple'],sentence:'the apple',vocabulary:['apple']}),...successes({targets:['book'],sentence:'the book',vocabulary:['book']})]
  const first=generatedDeck(6,[],nouns,'new-actions',options)
  for(const q of first)for(const d of q.alternatives??[])expect(d.english).not.toMatch(/opening|washing/)
  expect(first.some(q=>q.targetWords.includes('holding'))).toBe(true)
  const learned=[...nouns,...successes({targets:['holding'],sentence:'I am holding my book',vocabulary:['book']})]
  const second=generatedDeck(6,[],learned,'next-actions',options)
  expect(second.some(q=>q.action==='opening')).toBe(true)
  for(const q of second)for(const d of q.alternatives??[])expect(d.english).not.toMatch(/washing/)
 })
 it('keeps each star set at thirty and preserves the two-pass gate',()=>{
  for(const actions of [['eating','reading','drinking'],['holding','opening','washing'],undefined])expect(generatedDeck(6,[],[],'star',{actions})).toHaveLength(30)
  let progress=completeAdaptiveStar({},1,27,30,true)
  expect(progress[1]?.passes).toBe(1)
  progress=completeAdaptiveStar(progress,1,30,30,true);expect(progress[1]?.passes).toBe(2)
  expect(completeAdaptiveStar(progress,2,29,30,false)[2]?.passes).toBe(0)
  expect(completeAdaptiveStar(progress,2,27,29,true)).toBe(progress)
 })
})
it('requires the visible agreement cue to fade too before number listening can be credited',()=>{
 const q=generatedCandidates(2).find(q=>q.document.english==='Where is my hotel?')!
 expect(q.listeningWords).toContain('is')
 expect(q.targetWords).toEqual(['hotel','is'])
 const confused=[...successes(),event({correct:false})]
 const scores=evidenceScores([{word_id:'en:man',correct:40,attempts:41,listening_correct:3,direct_correct:0,last_practised:'',recent_results:[false]}],confused)
 expect(scores['en:man']).toBe(5)
 expect(masteredWords([],confused).has('en:man')).toBe(false)
})
it('uses the same starter nouns when entering Level 6 directly or starting at Level 1',()=>{
 const first=curriculumBaseline([],[],'new-learner')
 const six=generatedDeck(6,[],[],'direct-six',{familiar:first,actions:['eating','drinking','holding','reading']})
 const one=generatedDeck(1,[],[],'direct-one',{familiar:curriculumBaseline([],[],'new-learner')})
 const nouns=(deck:typeof one)=>new Set(deck.flatMap(q=>q.vocabulary).map(vocabularyFamily))
 expect(first).toEqual([...sharedStarterVocabulary])
 expect(nouns(one)).toEqual(new Set(sharedStarterVocabulary.filter(w=>w!=='water')))
 for(const noun of nouns(six))expect(sharedStarterVocabulary).toContain(noun)
 for(const noun of ['man','woman','boy','girl','mother','father'])expect(nouns(six)).toContain(noun)
 expect(six).toHaveLength(30);expect(one).toHaveLength(30)
 expect(Object.keys(localStorage).filter(k=>k.includes('composed-vocabulary'))).toEqual([vocabularyProfileKey('new-learner')])
 // A fresh account reaches the same nouns regardless of entry order.
 const other=curriculumBaseline([],[],'other-learner')
 expect(generatedDeck(6,[],[],'direct-six',{familiar:other,actions:['eating','drinking','holding','reading']})).toEqual(six)
})
it('shares listening unlocks between levels without creating another starter or unlock allowance',()=>{
 const familiar=curriculumBaseline([],[],'shared')
 const heardInSix=successes({level:6})
 const allowed=availableVocabulary([],heardInSix,familiar)
 expect(allowed.size).toBe(sharedStarterVocabulary.length+1)
 expect(allowed.has('son')).toBe(true)
 for(const level of [1,2,3,4,5,6] as const){
  expect(curriculumBaseline([],heardInSix,'shared')).toEqual(familiar)
  const deck=generatedDeck(level,[],heardInSix,'shared-'+level,{familiar})
  expect(deck).toHaveLength(30)
  for(const noun of deck.flatMap(q=>q.vocabulary))expect(allowed.has(vocabularyFamily(noun))).toBe(true)
 }
 const learnedKey=[...heardInSix,...successes({level:1,targets:['son'],vocabulary:['son'],sentence:'the son'})]
 expect(availableVocabulary([],learnedKey,familiar).has('daughter')).toBe(true)
 expect(availableVocabulary([],learnedKey,familiar).size).toBe(sharedStarterVocabulary.length+2)
})
it('preserves actual earlier knowledge while ignoring unplayed level-specific seed lists',()=>{
 localStorage.setItem('englishsuccess:composed-vocabulary:v1:existing:1:main',JSON.stringify(['hotel','toilet','gym','padel court','racket']))
 localStorage.setItem('englishsuccess:composed-vocabulary:v1:existing:6:star-1',JSON.stringify(['apple','banana','orange','sandwich','water']))
 const history=[event({targets:['hotel'],vocabulary:['hotel'],sentence:'the hotel',hidden:false})]
 const familiar=curriculumBaseline([],history,'existing')
 expect(familiar).toContain('hotel')
 expect(familiar).not.toContain('toilet')
 expect(familiar).not.toContain('sandwich')
 expect(curriculumBaseline([],history,'existing')).toEqual(familiar)
 expect(curriculumBaseline([],[],'separate')).toEqual([...sharedStarterVocabulary])
})
it('does not introduce doctor through subject-only action sentences before that noun is eligible',()=>{
 for(const level of [1,2,3,4,5,6] as const){
  const deck=generatedDeck(level,[],[],'people-gate')
  for(const q of deck)for(const sentence of [q.document.english,...(q.alternatives??[]).map(d=>d.english)])expect(sentence).not.toMatch(/\bdoctors?\b/i)
 }
 const walking=generatedCandidates(5).filter(q=>/\bdoctors?\b/i.test(q.document.english)&&q.action==='walking')
 expect(walking.length).toBeGreaterThan(0)
 for(const q of walking)expect(q.vocabulary.map(vocabularyFamily)).toContain('doctor')
})

it('adds people before professions and learns useful actions without leaking later verbs',()=>{
 const initial=availableVocabulary([],[])
 for(const word of ['man','woman','boy','girl','mother','father'])expect(initial.has(word)).toBe(true)
 expect(initial.has('doctor')).toBe(false)
 expect(initial.has('apple')).toBe(false);expect(initial.has('book')).toBe(false)
 const first=availableActions([],[])
 expect(first.has('holding')).toBe(false);expect(first.has('running')).toBe(true);expect(first.has('talking')).toBe(true);expect(first.has('listening')).toBe(true);expect(first.has('driving')).toBe(false)
 const heard=successes({targets:['talking'],sentence:'I am talking.',vocabulary:[]})
 expect(availableActions([],heard).has('sleeping')).toBe(true)
 for(const level of [5,6] as const){
  const deck=generatedDeck(level,[],[],'first-actions')
  expect(deck.some(q=>q.action==='running')).toBe(level===5)
  for(const q of deck)for(const d of [q.document,...q.alternatives??[]])expect(d.english).not.toMatch(/driving|reading|holding|playing/)
 }
})
it('introduces description contrasts only on familiar nouns and gates later contrasts',()=>{
 expect(availableDescriptions([],[]).size).toBe(0)
 const heard=successes({targets:['bag'],sentence:'the bag',vocabulary:['bag']})
 expect([...availableDescriptions([],heard)]).toEqual(['red','blue'])
 const deck=generatedDeck(1,[],heard,'colours')
 const coloured=deck.filter(q=>q.document.units.some(u=>u.role==='description'))
 expect(coloured.length).toBeGreaterThan(0)
 for(const q of coloured){expect(q.vocabulary.every(w=>['bag','bags'].includes(w))).toBe(true);expect(q.targetWords.every(w=>['red','blue'].includes(w))).toBe(true)}
 const blue=[...heard,...successes({targets:['blue'],sentence:'the blue bag',vocabulary:['bag']})]
 expect(availableDescriptions([],blue).has('big')).toBe(false)
 const red=[...blue,...successes({targets:['red'],sentence:'the red bag',vocabulary:['bag']})]
 expect(availableDescriptions([],red).has('big')).toBe(true)
 expect(availableDescriptions([],red).has('hot')).toBe(false)
})
it('lets a direct-entry action learner demonstrate water itself, not just the subject or verb',()=>{
 const q=generatedCandidates(6).find(q=>q.action==='vocabulary'&&q.document.english==='the water')!
 expect(q.targetWords).toEqual(['water'])
 expect(q.alternatives?.[1].english).toBe('the cup')
 const heard=successes({level:6,sentence:q.document.english,targets:q.targetWords,vocabulary:q.vocabulary})
 expect(masteredWords([],heard).has('en:water')).toBe(true)
 expect(availableDescriptions([],heard).has('red')).toBe(true)
})
it('keeps previously encountered descriptions available for recovery review',()=>{
 const heard=successes({targets:['bag'],sentence:'the bag',vocabulary:['bag']})
 const old=[...heard,event({sentence:'the green bag',targets:['green'],vocabulary:['bag'],correct:false})]
 expect(availableDescriptions([],old).has('green')).toBe(true)
 expect(availableDescriptions([],old).has('big')).toBe(false)
})
