import {expect,it} from 'vitest'
import {alignCTC} from './forcedAlignment'
const labels={'0':'<pad>','1':'I','2':'|','3':'A','4':'M','5':'L'}
function emissions(path:number[]){const logits=new Float32Array(path.length*6).fill(-20);path.forEach((id,t)=>{logits[t*6+id]=0});return logits}
it('aligns known words to acoustic frames, preserving uneven word durations',()=>{
 const path=[0,1,1,0,2,0,3,4,4,4,0,0]
 const timing=alignCTC('I am',emissions(path),path.length,6,labels,1.2)
 expect(timing.words[0]).toMatchObject({text:'I',start:0,end:1})
 expect(timing.words[0].startTime).toBeCloseTo(.1)
 expect(timing.words[0].endTime).toBeCloseTo(.3)
 expect(timing.words[1]).toMatchObject({text:'am',start:2,end:4})
 expect(timing.words[1].startTime).toBeCloseTo(.6)
 expect(timing.words[1].endTime).toBeCloseTo(1)
})
it('keeps repeated letters separate through the required blank state',()=>{
 const path=[0,3,5,0,5,0]
 const timing=alignCTC('all',emissions(path),path.length,6,labels,.6)
 expect(timing.words[0].startTime).toBeCloseTo(.1)
 expect(timing.words[0].endTime).toBeCloseTo(.5)
})
it('refuses unsupported letters rather than inventing timing',()=>{
 expect(()=>alignCTC('bird',emissions([0,1,0]),3,6,labels,.3)).toThrow('Unsupported')
})
