import {expect,it} from 'vitest'
import {waveformFromChannels,waveformAtTime} from './audioWaveform'

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
