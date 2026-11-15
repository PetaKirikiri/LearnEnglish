import {expect,it} from 'vitest'
import {orderedReviewVocabulary,reviewVocabulary} from './reviewVocabulary'
import {universityVocabulary} from '../learning/universityVocabulary'
import {actionVocabulary} from '../learning/sentenceRules/actionDialogue'
import {expandedVocabularyOrder} from '../learning/expandedEverydayVocabulary'
import {wordHierarchies} from './wordHierarchy'
it('includes every shared noun and action, including the expanded vocabulary, without duplicate noun forms',()=>{
 for(const item of universityVocabulary)expect(reviewVocabulary.noun).toContain(item.singular??item.word)
 for(const item of actionVocabulary)expect(reviewVocabulary.verb).toContain(item.word)
 for(const word of expandedVocabularyOrder)expect(reviewVocabulary.noun).toContain(word)
 expect(new Set(reviewVocabulary.noun).size).toBe(reviewVocabulary.noun.length)
 expect(reviewVocabulary.determiner).toEqual([...wordHierarchies.determiner])
 expect(reviewVocabulary.noun.slice(0,2)).toEqual(['man','woman'])
})
it('automatically shows a newly authored word even before it receives a curriculum rank',()=>{
 const inventory={noun:['woman','man','new noun'],verb:['new verb','holding'],adjective:['red'],determiner:['the']}
 const words=orderedReviewVocabulary(inventory,{noun:['man','woman'],verb:['holding'],adjective:['red'],determiner:['the']})
 expect(words.noun).toEqual(['man','woman','new noun'])
 expect(words.verb).toEqual(['holding','new verb'])
})
