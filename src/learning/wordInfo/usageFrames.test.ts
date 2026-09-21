import { expect, it } from 'vitest'
import { nounUsageFrames } from '../../../scripts/wordUsageFrames'
const dish={singular:'dish',plural:'dishes',countability:'countable' as const}
it('shows singular and plural combinations together without inventing corpus counts',()=>{
 const frames=nounUsageFrames('dish',[dish])
 expect(frames).toEqual([
  {word:'dish',before:['the','my','your','this'],after:['is','was'],source:'teaching'},
  {word:'dishes',before:['the','my','your','these'],after:['are','were'],source:'teaching'},
 ])
 expect(frames[0]).not.toHaveProperty('count')
 expect(nounUsageFrames('dishes',[dish])).toEqual(frames)
})
it('preserves paired agreement for irregular and unchanged plurals',()=>{
 const children=nounUsageFrames('children',[{...dish,singular:'child',plural:'children'}])
 expect(children.map(f=>[f.word,f.after])).toEqual([['child',['is','was']],['children',['are','were']]])
 const frames=nounUsageFrames('sheep',[{...dish,singular:'sheep',plural:'sheep'}])
 expect(frames).toHaveLength(2)
 expect(frames[0].before).toContain('this')
 expect(frames[1].before).toContain('these')
})
it('does not apply count-noun frames to mass nouns or possessive forms',()=>{
 expect(nounUsageFrames('water',[{singular:'water',plural:null,countability:'uncountable'}])).toEqual([])
 expect(nounUsageFrames("dish's",[dish])).toEqual([])
})
