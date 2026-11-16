import {expect,it} from 'vitest'
import {taughtWords,taughtNouns,taughtActions} from './curriculumPool'
import {offers,emptyBoard} from './tableEngine'
it('offers only actual lesson-content words, with no demo animals or future vocabulary',()=>{
 expect(taughtWords).toContain('doctor');expect(taughtWords).toContain('reading');expect(taughtWords).toContain('is');expect(taughtWords).toContain('are')
 for(const word of ['dog','cat','fish','running','quickly','and','small','a'])expect(taughtWords).not.toContain(word)
 expect(taughtNouns.length).toBeGreaterThan(30);expect(taughtActions.length).toBeGreaterThan(3)
 let id=1
 for(let i=0;i<50;i++){const shop=offers(3,()=>id++,emptyBoard());expect(shop).toHaveLength(4);for(const tile of shop)expect(taughtWords).toContain(tile.word)}
})
