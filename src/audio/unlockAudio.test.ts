import {expect,it} from 'vitest'
import {silentPlaybackUrl} from './unlockAudio'
it('provides a complete 100ms PCM recording for mobile media unlocking',()=>{
 const bytes=Uint8Array.from(atob(silentPlaybackUrl().split(',')[1]),c=>c.charCodeAt(0)),view=new DataView(bytes.buffer)
 expect(new TextDecoder().decode(bytes.slice(0,4))).toBe('RIFF')
 expect(view.getUint32(4,true)+8).toBe(bytes.length)
 expect(view.getUint16(20,true)).toBe(1)
 expect(view.getUint32(24,true)).toBe(16000)
 expect(view.getUint32(40,true)).toBe(3200)
 expect(bytes.length).toBe(3244)
 expect(bytes.slice(44).every(byte=>byte===0)).toBe(true)
})
