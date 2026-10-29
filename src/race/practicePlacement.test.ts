import {beforeEach,expect,it,vi} from 'vitest'
const rpc=vi.hoisted(()=>vi.fn())
vi.mock('../lib/supabase',()=>({supabase:{rpc}}))
import {loadPracticeStartingRound,practiceStartingRound} from './practicePlacement'
beforeEach(()=>rpc.mockReset())
it('places students at round 3 from exactly 600 points',()=>{
 for(const points of [0,300,599,NaN])expect(practiceStartingRound(points)).toBe(1)
 for(const points of [600,601,1000])expect(practiceStartingRound(points)).toBe(3)
})
it('uses only the incoming account and the all-time English scoreboard',async()=>{
 rpc.mockResolvedValue({data:{rows:[{id:'other',points:9999},{id:'student',points:599}]},error:null})
 expect(await loadPracticeStartingRound('student')).toBe(1)
 expect(rpc).toHaveBeenCalledWith('english_success_leaderboard',{p_period:'all'})
 rpc.mockResolvedValue({data:{rows:[{id:'student',points:600}]},error:null})
 expect(await loadPracticeStartingRound('student')).toBe(3)
 expect(await loadPracticeStartingRound('new')).toBe(1)
})
it('does not silently reset an experienced student when scores cannot load',async()=>{
 rpc.mockResolvedValue({error:new Error('offline')})
 await expect(loadPracticeStartingRound('student')).rejects.toThrow('offline')
 rpc.mockResolvedValue({data:{},error:null})
 await expect(loadPracticeStartingRound('student')).rejects.toThrow('Score unavailable')
})
