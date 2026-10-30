import {expect,it} from 'vitest'
import {numberCatalogue} from './numberCatalogue'
import {recallStates,recallKey,selectRecallItem,scheduledNumberDeck,type RecallAttempt} from './numberRecall'
const now=Date.UTC(2026,9,30)
const attempt=(changes:Partial<RecallAttempt>={}):RecallAttempt=>({id:crypto.randomUUID(),word:'hotel',module:1,answer:0,correct:true,at:now,assisted:false,heard:true,replays:1,support:0,...changes})
it('opens the authored catalogue, preserving first lesson assignment and plural-only eligibility',()=>{
 expect(numberCatalogue).toHaveLength(100)
 expect(numberCatalogue.find(q=>q.word==='hotels')?.lesson).toBe(1)
 expect(numberCatalogue.find(q=>q.word==='apples')?.lesson).toBe(3)
 const deck=scheduledNumberDeck(1,[],now)
 expect(deck).toHaveLength(30);expect(deck.filter(q=>q.plural)).toHaveLength(15)
 expect(deck.every(q=>numberCatalogue.find(i=>i.word===q.word)?.lesson===1)).toBe(true)
 expect(new Set(deck.map(q=>q.id)).size).toBe(30)
 const learned=numberCatalogue.filter(q=>q.word!=='trousers').flatMap(q=>[attempt({word:q.word,at:now-1}),attempt({word:q.word,at:now})])
 expect(selectRecallItem({module:1,events:learned,now})?.word).not.toBe('trousers')
 expect(selectRecallItem({module:3,events:learned.map(e=>({...e,module:3,verb:'is' as const})),now})?.word).toBe('trousers')
})
it('introduces lesson two only after earlier unseen words, then lesson three',()=>{
 const seen=numberCatalogue.filter(q=>q.lesson===1).map(q=>attempt({word:q.word}))
 expect(selectRecallItem({module:1,events:seen,recent:['a','b','c'],now})?.lesson).toBe(2)
 const seenTwo=numberCatalogue.filter(q=>q.lesson<=2).map(q=>attempt({word:q.word}))
 expect(selectRecallItem({module:1,events:seenTwo,recent:['a','b','c'],now})?.lesson).toBe(3)
})
it('repeats after other questions, then spaces successful recall over days',()=>{
 const first=attempt()
 expect(selectRecallItem({module:1,events:[first],recent:['hotel','phone','key'],now})?.word).not.toBe('hotel')
 expect(selectRecallItem({module:1,events:[first],recent:['hotel','phone','key','book'],now})?.word).toBe('hotel')
 const second=attempt({at:now+1})
 const state=recallStates([first,second])['1:hotel']
 expect(state).toMatchObject({correct:2,wrong:0,support:1,independent:2})
 expect(state.due).toBe(now+1+86400000)
 expect(selectRecallItem({module:1,events:[first,second],now:now+1})?.word).not.toBe('hotel')
 expect(selectRecallItem({module:1,events:[first,second],now:state.due})?.word).toBe('hotel')
})
it('wrong restores support and resets the interval; assistance and silent answers cannot advance fade',()=>{
 const successful=[attempt(),attempt({at:now+1}),attempt({at:now+86400001,support:1}),attempt({at:now+4*86400000+1,support:1})]
 const states=recallStates(successful);expect(states['1:hotel'].support).toBe(2)
 const wrong=attempt({at:now+5*86400000,correct:false,support:2,answer:1})
 expect(recallStates([...successful,wrong])['1:hotel']).toMatchObject({wrong:1,support:1,streak:0,interval:0,due:wrong.at})
 for(const change of [{assisted:true},{heard:false},{replays:2}])expect(recallStates([attempt(change),attempt({...change,at:now+1})])['1:hotel']).toMatchObject({correct:2,independent:0,support:0,interval:0})
})
it('isolates each word form and skill, deduplicates retries, and ignores input event order',()=>{
 const one=attempt(),two=attempt({at:now+1})
 const events=[one,two,one,attempt({word:'hotels',correct:false}),attempt({module:2,correct:false})]
 const states=recallStates(events)
 expect(states[recallKey(1,'hotel')]).toMatchObject({correct:2,wrong:0})
 expect(states['1:hotels']).toMatchObject({wrong:1,support:0})
 expect(states['2:hotel']).toMatchObject({wrong:1,support:0})
 expect(recallStates([...events].reverse())).toEqual(states)
})
it('does not force mastered words back early when there is nothing due or unseen',()=>{
 const events=numberCatalogue.flatMap(q=>[attempt({word:q.word,at:now-1}),attempt({word:q.word,at:now})])
 expect(scheduledNumberDeck(1,events,now)).toEqual([])
})

it('balances agreement judgements independently from noun number',()=>{
 const deck=scheduledNumberDeck(3,[],now)
 expect(deck).toHaveLength(30)
 expect(deck.filter(q=>q.plural)).toHaveLength(15)
 expect(deck.filter(q=>(q.verb==='are')===q.plural)).toHaveLength(15)
 expect(new Set(deck.map(q=>`${q.verb}:${q.plural}`)).size).toBe(4)
 expect(recallStates([attempt({module:3}),attempt({module:3,at:now+1})])).toEqual({})
})
