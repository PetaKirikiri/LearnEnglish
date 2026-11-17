import {expect,it} from 'vitest'
import {taughtWords,taughtNouns,taughtActions} from './curriculumPool'
import {offers,emptyBoard} from './tableEngine'
it('keeps lesson nouns/functions and adds teacher-approved authored verbs with familiar objects',()=>{
 expect(taughtWords).toContain('doctor');expect(taughtWords).toContain('reading');expect(taughtWords).toContain('is');expect(taughtWords).toContain('are')
 for(const word of ['dog','cat','fish','quickly','and','small','a'])expect(taughtWords).not.toContain(word)
 expect(taughtNouns.length).toBeGreaterThan(30);expect(taughtActions.length).toBeGreaterThan(25)
 let id=1
 for(let i=0;i<50;i++){const shop=offers(3,()=>id++,emptyBoard());expect(shop).toHaveLength(4);for(const tile of shop)expect(taughtWords).toContain(tile.word)}
})

it('includes useful expanded verbs for today without adding unfamiliar nouns',()=>{for(const word of ['walking','running','sleeping','talking','listening','driving','carrying','buying','cleaning','closing','using'])expect(taughtWords).toContain(word)})
