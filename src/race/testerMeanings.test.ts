// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {practiceDeck,practiceEnglishMeaning} from './practiceDeck'
it('has authored English meanings for every answer in both lessons',()=>{
 for(const lesson of [1,2]) for(const q of practiceDeck(lesson)) for(const choice of q.choices) expect(practiceEnglishMeaning(choice),choice).toMatch(/^Where /)
})
