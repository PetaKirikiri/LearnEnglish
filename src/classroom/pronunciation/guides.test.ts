import { beforeEach, expect, it } from 'vitest'
import { defaultGuide, isSketch, readGuide, saveGuide, splitSketch } from './guides'
import { lessonOneCatalogue, lessonTwoCatalogue, lessonThreeCatalogue } from '../../classroom/wordCatalogue'
beforeEach(()=>localStorage.clear())
it('supports every classroom word and keeps pitch separate from emphasis',()=>{
 for(const word of [...lessonOneCatalogue,...lessonTwoCatalogue,...lessonThreeCatalogue].map(item=>item.word).concat(['where','is','are','the','my','your','was','were','his','her'])) {
  const guide=defaultGuide(word)
  expect(isSketch(guide.thai)).toBe(true)
  expect(isSketch(guide.english)).toBe(true)
  expect(guide.english.syllables.join('')).toBe(word.replaceAll(' ',''))
  expect(guide.thai.drawn).toBe(false)
  expect(guide.thai.syllables.join('')).toMatch(/[ก-๙]/)
  expect(guide.english.drawn).toBe(true)
 }
 expect(defaultGuide('COMPUTER?').english.emphasis).toBe(1)
 expect(defaultGuide('computer').thai.pitch).toEqual([.5,.35,.9])
})
it('saves each word independently, accepts unknown words and rejects corrupt curves',()=>{
 const guide=defaultGuide('computer')
 saveGuide('Computer?',guide)
 expect(readGuide('computer')).toEqual(guide)
 expect(readGuide('hotel').thai.drawn).toBe(false)
 expect(defaultGuide('newword').english.syllables).toEqual(['newword'])
 expect(isSketch({...guide.english,pitch:[NaN]})).toBe(false)
 localStorage.setItem('englishsuccess:pronunciation-sketch:v1:computer','bad json')
 expect(readGuide('computer')).toEqual(defaultGuide('computer'))
})
it('allows different syllable counts on each side without losing valid points',()=>{
 const sketch=defaultGuide('computer').thai
 const split=splitSketch(sketch,'kom-piu-ter-extra')
 expect(split.syllables).toEqual(['kom','piu','ter','extra'])
 expect(split.pitch).toEqual([.5,.35,.9,.5])
 expect(splitSketch(sketch,'')).toEqual(sketch)
})

it('uses Thai phonetic spellings, with English stress guides and conservative unknowns',()=>{
 expect(defaultGuide('hotel').thai.syllables).toEqual(['โฮ','เทล'])
 expect(defaultGuide('hotel').english.pitch[1]).toBeGreaterThan(defaultGuide('hotel').english.pitch[0])
 expect(defaultGuide('doctor').english.pitch[0]).toBeGreaterThan(defaultGuide('doctor').english.pitch[1])
 expect(defaultGuide('unknown').thai.syllables).toEqual(['…'])
 expect(defaultGuide('unknown').english.drawn).toBe(false)
 const custom={...defaultGuide('hotel'),thai:{syllables:['ครู','แก้'],pitch:[.1,.8],emphasis:null,drawn:true}}
 saveGuide('hotel',custom)
 expect(readGuide('hotel')).toEqual(custom)
})
