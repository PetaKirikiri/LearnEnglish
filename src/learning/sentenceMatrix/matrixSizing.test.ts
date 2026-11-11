import {expect,it} from 'vitest'
import {allocateColumns} from './matrixSizing'
it('keeps exact-fit tracks finite when no card needs extra space',()=>{
 expect(allocateColumns([{minimum:100,preferred:100},{minimum:100,preferred:100}],210,10)).toEqual([100,100])
})
it('gives a long phrase more room than a short verb while filling the row',()=>{
 const sizes=allocateColumns([{minimum:150,preferred:360},{minimum:80,preferred:90},{minimum:100,preferred:150}],700,10)
 expect(sizes[0]).toBeGreaterThan(sizes[1]*2)
 expect(sizes.reduce((a,b)=>a+b,0)).toBeCloseTo(680)
 expect(sizes.every((size,index)=>size>=[150,80,100][index])).toBe(true)
})
it('spends limited spare room on text before expanding already fitted labels',()=>{
 expect(allocateColumns([{minimum:120,preferred:300},{minimum:80,preferred:80}],270,10)).toEqual([180,80])
})
it('handles narrower space without negative tracks or overflow',()=>{
 const sizes=allocateColumns([{minimum:200,preferred:300},{minimum:100,preferred:150}],210,10)
 expect(sizes.every(size=>size>0)).toBe(true)
 expect(sizes.reduce((a,b)=>a+b,0)).toBeCloseTo(200)
})
