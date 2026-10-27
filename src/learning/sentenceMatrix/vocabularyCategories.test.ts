import { expect,it } from 'vitest'
import { categoriesForWord, grammaticalNumber } from './vocabularyCategories'
it('shares categories between noun forms and permits overlapping categories',()=>{
 expect(categoriesForWord({word:'shoes',singular:'shoe',thai:''})).toEqual(categoriesForWord({word:'shoe',thai:''}))
 expect(categoriesForWord({word:'hotel',thai:''})).toEqual(expect.arrayContaining(['places','buildings']))
 expect(grammaticalNumber({word:'glasses',pairOnly:true,thai:''})).toBe('plural')
})
it('supports authored categories for new words without guessing unknown words',()=>{
 expect(categoriesForWord({word:'apple',thai:'',categories:['food']})).toEqual(['food'])
 expect(categoriesForWord({word:'unknown',thai:''})).toEqual([])
})
