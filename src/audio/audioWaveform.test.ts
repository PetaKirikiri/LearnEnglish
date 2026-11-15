import {expect,it} from 'vitest'
import {waveformFromChannels,waveformAtTime,speechBounds,speechProgress} from './audioWaveform'

it('measures actual audio energy and retains quiet speech and silence',()=>{
 const channel=new Float32Array([...Array(20).fill(0),...Array(20).fill(.05),...Array(20).fill(.2),...Array(20).fill(0)])
 const waveform=waveformFromChannels([channel],1000)
 expect(waveform.levels).toEqual([0,.25,1,0])
 expect(waveformAtTime(waveform,.04)).toBe(1)
 expect(waveformAtTime(waveform,.03)).toBe(.625)
 expect(waveformAtTime(waveform,1)).toBe(0)
 expect(waveformAtTime(waveform,-1)).toBe(0)
})
it('measures channels separately so opposite stereo phases do not cancel',()=>{
 const a=new Float32Array(40).fill(.2),b=new Float32Array(40).fill(-.2)
 expect(waveformFromChannels([a,b],1000).levels).toEqual([1,1])
 expect(waveformFromChannels([new Float32Array(40)],1000).levels).toEqual([0,0])
})

it('maps spoken start and end to the full box row while preserving internal silence',()=>{
 const recording={interval:.1,levels:[0,0,.5,0,1,0,0]}
 expect(speechBounds(recording)).toEqual({start:.2,end:.5})
 expect(speechProgress({recording,time:.2,level:.5})).toBe(0)
 expect(speechProgress({recording,time:.35,level:0})).toBeCloseTo(.5)
 expect(speechProgress({recording,time:.5,level:0})).toBe(1)
 expect(speechProgress({recording,time:.7,level:0})).toBe(1)
})
