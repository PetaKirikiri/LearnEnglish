import { beforeEach, expect, it, vi } from 'vitest'
const db=vi.hoisted(()=>({upsert:vi.fn(),maybeSingle:vi.fn(),eq:vi.fn(),select:vi.fn()}))
vi.mock('../../lib/supabase',()=>({supabase:{from:()=>db}}))
import { cachedConfidence, loadConfidence, saveConfidence } from './confidence'
const user='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();db.upsert.mockResolvedValue({error:null});db.select.mockReturnValue(db);db.eq.mockReturnValue(db);db.maybeSingle.mockResolvedValue({data:{confidence:4},error:null})})
it('keeps preview ratings local and isolated by learner and normalized word',async()=>{
 await saveConfidence('visual-preview','Children',3)
 expect((await loadConfidence('visual-preview','children')).score).toBe(3)
 expect((await loadConfidence('another-preview','children')).score).toBeNull()
 expect((await loadConfidence('visual-preview','child')).score).toBeNull()
 expect(db.upsert).not.toHaveBeenCalled()
})
it('loads account ratings and persists an explicit score from 1 to 5',async()=>{
 expect((await loadConfidence(user,'Read')).score).toBe(4)
 expect(db.eq).toHaveBeenCalledWith('learner_id',user)
 await saveConfidence(user,'Read',5)
 expect(db.upsert).toHaveBeenCalledWith({learner_id:user,word:'read',confidence:5},{onConflict:'learner_id,word'})
 expect(cachedConfidence(user,'read')?.pending).toBe(false)
 await expect(saveConfidence(user,'read',6)).rejects.toThrow()
})
it('leaves unrated words empty and clears stale saved ratings without writing a default',async()=>{
 await loadConfidence(user,'city')
 expect(cachedConfidence(user,'city')?.score).toBe(4)
 db.maybeSingle.mockResolvedValue({data:null,error:null})
 expect((await loadConfidence(user,'city')).score).toBeNull()
 expect(cachedConfidence(user,'city')).toBeNull()
 expect((await loadConfidence(user,'train')).score).toBeNull()
 expect(db.upsert).not.toHaveBeenCalled()
})
it('keeps failed saves pending and retries them when help reopens',async()=>{
 db.upsert.mockResolvedValueOnce({error:new Error('offline')})
 await expect(saveConfidence(user,'read',2)).rejects.toThrow('offline')
 expect(cachedConfidence(user,'read')).toMatchObject({score:2,pending:true})
 expect((await loadConfidence(user,'read')).score).toBe(2)
 expect(cachedConfidence(user,'read')?.pending).toBe(false)
})
it('serializes rapid changes so the last tap remains the saved score',async()=>{
 const tasks=[saveConfidence(user,'read',1),saveConfidence(user,'read',5),saveConfidence(user,'read',3)]
 await Promise.all(tasks)
 expect(db.upsert.mock.calls.map(call=>call[0].confidence)).toEqual([1,5,3])
 expect(cachedConfidence(user,'read')).toMatchObject({score:3,pending:false})
})
