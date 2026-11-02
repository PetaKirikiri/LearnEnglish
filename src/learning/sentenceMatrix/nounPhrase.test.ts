import {expect,it} from 'vitest'
import {nounPhraseUnits} from './nounPhrase'
it('rejects collapsed articles and prepositions while keeping genuine compound nouns together',()=>{
 for(const noun of ['an apple','a book','the hotel','my shoes','to the gym'])expect(()=>nounPhraseUnits({noun,nounThai:'คำ'})).toThrow('separate')
 expect(nounPhraseUnits({noun:'air conditioner',nounThai:'เครื่องปรับอากาศ',determiner:{english:'the',thai:'ที่กำลังพูดถึง'}}).map(unit=>unit.english)).toEqual(['the','air conditioner'])
})
