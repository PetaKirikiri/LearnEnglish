// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {beforeEach,afterEach,expect,it,vi} from 'vitest'
vi.mock('./numberRecallStore',async importOriginal=>({...await importOriginal<typeof import('./numberRecallStore')>(),syncRecall:vi.fn().mockResolvedValue(undefined)}))
import {readRecall,saveRecall} from './numberRecallStore'
import {recallStates} from './numberRecall'
import {numberCatalogue} from './numberCatalogue'
import NumberFoundation from './NumberFoundationCourse'
import {numberDeck,numberPassed,numberRecordings,numberNouns,sentenceNumberNouns,foundationKey} from './numberFoundation'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
let end:()=>void=()=>{}
let played=""
beforeEach(()=>{vi.stubEnv('DEV',false);localStorage.clear();vi.stubGlobal('Audio',class{onended:(()=>void)|null=null;onerror:(()=>void)|null=null;src:string;constructor(src:string){this.src=src}pause(){}play(){played=this.src;end=()=>this.onended?.();return Promise.resolve()}})})
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()})
it('uses 30 balanced encounters of the same five noun pairs',()=>{
 const deck=numberDeck();expect(deck).toHaveLength(30);expect(deck.filter(q=>q.plural)).toHaveLength(15)
 expect(deck.slice(0,2).map(q=>q.word)).toEqual(['hotel','hotels'])
 for(const noun of numberNouns)for(const word of [noun.singular,noun.plural])expect(deck.filter(q=>q.word===word)).toHaveLength(3)
 expect(numberRecordings).toHaveLength(20)
 expect(numberRecordings.every(r=>r.spokenText.startsWith('the ')&&!/\bis\b|\bare\b/.test(r.spokenText))).toBe(true)
 expect(numberPassed(deck,Array(30).fill(true))).toBe(true)
 expect(numberPassed(deck,deck.map(q=>q.plural))).toBe(false)
 expect(numberPassed(deck,Array(29).fill(true))).toBe(false)
})
it('keeps the read-only noun group visible and requires hearing the recording before answering',async()=>{
 const host=document.createElement('div');const root=createRoot(host)
 try{
  await act(async()=>root.render(<NumberFoundation/>))
  expect(host.querySelector('.practice-question .tonight-slots')?.getAttribute('aria-label')).toBe('the hotel')
  expect(host.querySelector('.practice-question button')).toBeNull()
  expect(host.querySelector<HTMLProgressElement>('header progress')?.value).toBe(0)
  expect(host.querySelector('.foundation-question-count')).toBeNull()
  expect(host.querySelector('.cw-game-icon-apple')).not.toBeNull()
  expect(host.querySelector('.cw-game-icon-apples')).not.toBeNull()
  expect(host.querySelector('[data-matrix-layout=noun-phrase]')).not.toBeNull()
  expect(host.querySelector<HTMLButtonElement>('.practice-answers button')?.disabled).toBe(true)
  await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-header-audio')!.click())
  expect(host.querySelector<HTMLButtonElement>('.practice-answers button')?.disabled).toBe(true)
  await act(async()=>end())
  expect(host.querySelector<HTMLButtonElement>('.practice-answers button')?.disabled).toBe(false)
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-answers button')!.click())
  expect(host.querySelector('.tonight-slots')?.getAttribute('aria-label')).toBe('the hotel')
  expect(host.querySelector('.foundation-controls')?.textContent).not.toContain('the hotel')
  expect(host.querySelector<HTMLProgressElement>('header progress')?.value).toBe(1)
  await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-next')!.click())
  expect(host.querySelector<HTMLButtonElement>('.practice-answers button')?.disabled).toBe(true)
 }finally{await act(async()=>root.unmount())}
})
it('adds full-sentence number recognition before sentence judgement',async()=>{
 const host=document.createElement('div');const root=createRoot(host)
 localStorage.setItem(foundationKey(),JSON.stringify({module:1,deck:numberDeck(),answers:Array(30).fill(true),picked:null,numberComplete:false}))
 try{
  await act(async()=>root.render(<NumberFoundation/>))
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-complete button')!.click())
  expect(host.querySelector('.tonight-slots')?.getAttribute('aria-label')).toBe('Where is the hotel?')
  expect([...host.querySelectorAll('.practice-answers button')].map(b=>b.textContent)).toEqual(['หนึ่งสิ่ง','หลายสิ่ง'])
  expect(host.querySelector('.cw-game-icon-apples')).not.toBeNull()
  expect(host.querySelector('.practice-question button')).toBeNull()
  for(let i=0;i<30;i++){
   const saved=JSON.parse(localStorage.getItem(foundationKey())!)
   const q=saved.deck[i]
   expect(host.querySelector('.tonight-slots')?.getAttribute('aria-label')).toBe(`Where ${q.plural?'are':'is'} the ${q.word}?`)
   await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-header-audio')!.click())
   expect(played).toBe(`/audio/number-foundation/where-${q.plural?'are':'is'}-the-${q.word.replaceAll(' ','-')}.wav`)
   await act(async()=>end())
   await act(async()=>host.querySelectorAll<HTMLButtonElement>('.practice-answers button')[q.plural?1:0].click())
   await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-next')!.click())
  }
  expect(host.querySelector('.practice-complete')?.textContent).toContain('30 / 30')
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-complete button')!.click())
  expect(JSON.parse(localStorage.getItem(foundationKey())!).module).toBe(3)
  expect(host.querySelector('.tonight-slots')?.getAttribute('aria-label')).toBe('Where is the hotel?')
  expect([...host.querySelectorAll('.practice-answers button')].map(b=>b.textContent)).toEqual(['ถูก','ผิด'])
  await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-header-audio')!.click())
  expect(played).toBe('/audio/number-foundation/where-is-the-hotel.wav')
 }finally{await act(async()=>root.unmount())}
})
it('does not reuse old verb-module results as sentence-listening results',async()=>{
 localStorage.setItem(foundationKey(),JSON.stringify({module:2,deck:numberDeck(),answers:Array(30).fill(true),picked:null,numberComplete:true}))
 const host=document.createElement('div');const root=createRoot(host)
 try{
  await act(async()=>root.render(<NumberFoundation/>))
  expect(host.querySelector('.tonight-slots')?.getAttribute('aria-label')).toBe('Where is the hotel?')
  expect(host.querySelector<HTMLProgressElement>('progress')?.value).toBe(0)
  expect(JSON.parse(localStorage.getItem(foundationKey())!).sentenceComplete).toBe(false)
 }finally{await act(async()=>root.unmount())}
})
it('ends at thirty, gives a clear pass milestone, and advances using the same noun set',async()=>{
 const host=document.createElement('div');const root=createRoot(host)
 try{
  await act(async()=>root.render(<NumberFoundation/>))
  for(let i=0;i<30;i++){
   await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-header-audio')!.click())
   await act(async()=>end())
   const saved=JSON.parse(localStorage.getItem(foundationKey())!)
   const correct=saved.deck[i].plural?1:0
   await act(async()=>host.querySelectorAll<HTMLButtonElement>('.practice-answers button')[correct].click())
   await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-next')!.click())
  }
  expect(host.querySelector<HTMLProgressElement>('header progress')?.value).toBe(30)
  expect(host.querySelector('.practice-complete')?.textContent).toContain('30 / 30')
  expect(host.querySelector('.practice-complete h1')?.textContent).toBe('ผ่านชุดนี้แล้ว!')
  expect(host.querySelector('.practice-answers')).toBeNull()
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-complete button')!.click())
  const saved=JSON.parse(localStorage.getItem(foundationKey())!)
  expect(saved.module).toBe(2);expect(saved.numberComplete).toBe(true)
  expect(host.querySelector<HTMLProgressElement>('header progress')?.value).toBe(0)
  expect(saved.deck.every((q:{word:string})=>numberCatalogue.some(item=>item.word===q.word))).toBe(true)
  expect(readRecall()).toHaveLength(30)
 }finally{await act(async()=>root.unmount())}
})

it('expands later rounds with repeated new nouns and balanced familiar review',()=>{
 for(const module of [2,3] as const){
  const deck=numberDeck(module)
  expect(deck).toHaveLength(30)
  expect(new Set(deck.map(q=>q.id)).size).toBe(30)
  expect(deck.filter(q=>q.plural)).toHaveLength(15)
  for(const [index,noun] of sentenceNumberNouns.entries()){
   for(const word of [noun.singular,noun.plural]){
    expect(deck.filter(q=>q.word===word)).toHaveLength(index<numberNouns.length?1:2)
   }
  }
 }
 expect(new Set(numberDeck().map(q=>q.word)).size).toBe(10)
})
it('resumes expanded rounds without resetting their answers',async()=>{
 const deck=numberDeck(2)
 localStorage.setItem(foundationKey(),JSON.stringify({version:2,module:2,deck,answers:[true,true],picked:null,numberComplete:true,sentenceComplete:false}))
 const host=document.createElement('div');const root=createRoot(host)
 try{
  await act(async()=>root.render(<NumberFoundation/>))
  expect(host.querySelector<HTMLProgressElement>('progress')?.value).toBe(2)
  expect(JSON.parse(localStorage.getItem(foundationKey())!).deck.map((q:{word:string})=>q.word)).toEqual(deck.map(q=>q.word))
 }finally{await act(async()=>root.unmount())}
})
it('skips beginner rounds for placed accounts without awarding completion and resumes round 3',async()=>{
 const host=document.createElement('div');let root=createRoot(host)
 localStorage.setItem(foundationKey('returning'),JSON.stringify({version:2,module:1,deck:numberDeck(),answers:[true],picked:null,numberComplete:false,sentenceComplete:false}))
 try{
  await act(async()=>root.render(<NumberFoundation userId="returning" minimumModule={3}/>))
  expect(host.querySelector('.tonight-slots')?.getAttribute('aria-label')).toBe('Where is the hotel?')
  const saved=JSON.parse(localStorage.getItem(foundationKey('returning'))!)
  expect(saved.module).toBe(3);expect(saved.numberComplete).toBe(false);expect(saved.sentenceComplete).toBe(false)
  await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-header-audio')!.click())
  await act(async()=>end())
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-answers button')!.click())
  await act(async()=>root.unmount());root=createRoot(host)
  await act(async()=>root.render(<NumberFoundation userId="returning" minimumModule={3}/>))
  expect(host.querySelector<HTMLProgressElement>('progress')?.value).toBe(1)
  expect(host.querySelector('.practice-feedback')?.textContent).toContain('ถูกต้อง')
 }finally{await act(async()=>root.unmount())}
})

it('allows silent development answers and next questions without requiring audio',async()=>{
 vi.stubEnv('DEV',true)
 const host=document.createElement('div');const root=createRoot(host)
 played=''
 try{
  await act(async()=>root.render(<NumberFoundation/>))
  const answer=()=>host.querySelector<HTMLButtonElement>('.practice-answers button')!
  expect(answer().disabled).toBe(false)
  await act(async()=>answer().click())
  expect(answer().classList.contains('correct')).toBe(true)
  expect(host.querySelector<HTMLProgressElement>('progress')?.value).toBe(1)
  await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-next')!.click())
  expect(answer().disabled).toBe(false)
  const q=JSON.parse(localStorage.getItem(foundationKey())!).deck[1]
  await act(async()=>host.querySelectorAll<HTMLButtonElement>('.practice-answers button')[q.plural?0:1].click())
  expect(host.querySelector('.practice-answers .incorrect')).not.toBeNull()
  expect(host.querySelector<HTMLProgressElement>('progress')?.value).toBe(2)
  expect(played).toBe('')
 }finally{await act(async()=>root.unmount())}
})

it.each([2,6])('keeps sentence icons when fading after %i successes and restores support after a wrong answer',async(successes)=>{
 vi.stubEnv('DEV',true)
 for(let index=0;index<successes;index++)saveRecall({id:crypto.randomUUID(),word:'hotel',module:1,answer:0,correct:true,at:Date.now()-90*86400000+index,assisted:false,heard:true,replays:1,support:Math.floor(index/2)})
 const host=document.createElement('div');const root=createRoot(host)
 try{
  await act(async()=>root.render(<NumberFoundation/>))
  expect(Number(host.querySelector<HTMLElement>('[data-word="hotel"].matrix-fading-word')?.style.opacity)).toBeCloseTo(1-successes/6)
  expect(host.querySelector('.practice-question .example-gloss')).toBeNull()
  expect(host.querySelectorAll('.practice-question .cw-slot-role')).toHaveLength(2)
  expect(host.querySelector('.practice-question .vocabulary-picture[data-word=hotel] img')).not.toBeNull()
  await act(async()=>host.querySelectorAll<HTMLButtonElement>('.practice-answers button')[1].click())
  expect(recallStates(readRecall())['1:hotel']).toMatchObject({wrong:1,support:successes/2-1,interval:0})
  expect(host.querySelector('.practice-question .example-gloss')).not.toBeNull()
 }finally{await act(async()=>root.unmount())}
})

it.each([
 ['phone',false,'is',0],['phones',true,'are',0],['book',false,'are',1],['books',true,'is',1],
] as const)('judges the complete sentence for %s with %s and %s',async(word,plural,verb,answer)=>{
 const item=numberCatalogue.find(item=>item.word===word)!
 const prompt={id:crypto.randomUUID(),word,thai:item.thai,plural,verb,audioUrl:`/audio/number-foundation/the-${word}.wav`}
 localStorage.setItem(foundationKey(),JSON.stringify({version:3,module:3,deck:[prompt],answers:[],picked:null,numberComplete:true,sentenceComplete:true}))
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<NumberFoundation/>))
  expect(host.querySelector('.tonight-slots')?.getAttribute('aria-label')).toBe(`Where ${verb} the ${word}?`)
  expect([...host.querySelectorAll('.practice-answers button')].map(b=>b.textContent)).toEqual(['ถูก','ผิด'])
  expect(host.querySelectorAll('.binary-answer-icon img')).toHaveLength(2)
  await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-header-audio')!.click())
  expect(played).toBe(`/audio/number-foundation/where-${verb}-the-${word}.wav`)
  await act(async()=>end())
  await act(async()=>host.querySelectorAll<HTMLButtonElement>('.practice-answers button')[answer].click())
  expect(readRecall()[0]).toMatchObject({word,module:3,verb,answer,correct:true})
  expect(host.querySelectorAll('.practice-answers button')[answer].classList.contains('correct')).toBe(true)
 }finally{await act(async()=>root.unmount())}
})
it('restarts legacy blank-verb rounds without carrying their results into judgement',async()=>{
 const deck=numberDeck(2)
 localStorage.setItem(foundationKey(),JSON.stringify({version:3,module:3,deck,answers:[true],picked:null,numberComplete:true,sentenceComplete:true}))
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<NumberFoundation/>))
  const saved=JSON.parse(localStorage.getItem(foundationKey())!)
  expect(saved.answers).toEqual([]);expect(saved.deck.every((q:{verb?:string})=>q.verb==='is'||q.verb==='are')).toBe(true)
 }finally{await act(async()=>root.unmount())}
})
