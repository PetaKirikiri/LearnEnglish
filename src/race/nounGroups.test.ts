import {expect,it} from 'vitest'
import {nounGroupFor} from './nounGroups'
import {wordHierarchies} from './wordHierarchy'
it('groups people and animals as subjects and inanimate nouns as objects',()=>{
 for(const word of ['man','woman','boy','girl','mother','father','son','daughter','doctor','cat','dog','bird'])expect(nounGroupFor(word),word).toBe('subjects')
 for(const word of ['phone','apple','water','school','bus','table'])expect(nounGroupFor(word),word).toBe('objects')
 expect(wordHierarchies.noun.filter(word=>nounGroupFor(word)==='subjects')).toHaveLength(9)
 expect(wordHierarchies.noun.filter(word=>nounGroupFor(word)==='objects')).toHaveLength(wordHierarchies.noun.length-9)
})
