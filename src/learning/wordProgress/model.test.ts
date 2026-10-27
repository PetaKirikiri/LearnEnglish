import { expect,it } from 'vitest'
import { wordId,wordTokens,wordOpacity } from './model'
it('normalises punctuation without merging grammatical forms',()=>{
 expect(wordTokens("Where ARE my shoes? Where’s my shoe?")).toEqual(['where','are','my','shoes',"where's",'my','shoe'])
 expect(wordId('Shoes?')).toBe('en:shoes');expect(wordId('shoe')).not.toBe(wordId('shoes'))
})
it('fades words independently and never decreases support when disabled',()=>{
 const scores={'en:where':25,'en:are':15,'en:shoes':2}
 expect(wordOpacity('Where',scores,{fadeMode:true})).toBe(0)
 expect(wordOpacity('are',scores,{fadeMode:true})).toBe(.5)
 expect(wordOpacity('shoes',scores,{fadeMode:true})).toBe(1)
 expect(wordOpacity('Where',scores)).toBe(1)
 expect(wordOpacity('new',scores,{fadeMode:true})).toBe(1)
})
