import {expect,it} from 'vitest'
import {nounsForSentence,blueprintsForNoun,agreeingNoun} from './choices'
import {validateSentence} from './blueprints'
import {lessonThreeMatrixCatalogue} from '../../classroom/wordCatalogue'
it('forward and reverse selection agree for every authored noun',()=>{
 const subject={word:'I',thai:'ฉัน',person:1 as const}
 for(const blueprint of ['where-noun','person-at-place'] as const){
  const request={blueprint,subject,determiner:'the',...(blueprint==='person-at-place'?{verb:'am'}:{})}
  const choices=nounsForSentence(request,lessonThreeMatrixCatalogue)
  for(const noun of lessonThreeMatrixCatalogue){
   const included=choices.includes(noun)
   expect(included,`${blueprint}: ${noun.word}`).toBe(blueprintsForNoun(noun).includes(blueprint))
   if(included)expect(validateSentence({...request,noun,verb:blueprint==='person-at-place'?'am':noun.number==='plural'||noun.pairOnly?'are':'is'})).toEqual([])
  }
 }
})
it('changing the verb resolves only validated authored counterparts',()=>{
 const hotel=lessonThreeMatrixCatalogue.find(w=>w.word==='hotel')!
 const hotels=agreeingNoun(hotel,'are',lessonThreeMatrixCatalogue)!
 expect(hotels.word).toBe('hotels')
 expect(agreeingNoun(hotels,'is',lessonThreeMatrixCatalogue)?.word).toBe('hotel')
 expect(agreeingNoun(hotel,'are',[hotel])).toBeUndefined()
 expect(agreeingNoun({word:'thought',thai:'',plural:'thoughts'},'is',lessonThreeMatrixCatalogue)).toBeUndefined()
})
it('does not offer abstract or unclassified words in either direction',()=>{
 for(const word of ['thought','unreviewed-new-word']){
  const noun={word,thai:''}
  expect(blueprintsForNoun(noun)).toEqual([])
  expect(nounsForSentence({blueprint:'where-noun',determiner:'the'},[noun])).toEqual([])
 }
})
