// @vitest-environment node
import {existsSync,readFileSync} from 'node:fs'
import {expect,it} from 'vitest'
import {numberRecordings,numberSentenceRecordings} from './numberFoundation'
it('ships every noun phrase and full sentence recording with its exact text',()=>{
 const manifest=JSON.parse(readFileSync('public/audio/number-foundation/voice-manifest.json','utf8'))
 for(const recording of [...numberRecordings,...numberSentenceRecordings]){
  expect(existsSync(`public${recording.audioUrl}`)).toBe(true)
  const name=recording.audioUrl.split('/').at(-1)!
  expect(manifest[name].text).toBe(recording.spokenText)
  expect(manifest[name].seconds).toBeGreaterThan(.2)
  expect(readFileSync(`public${recording.audioUrl}`).subarray(0,4).toString()).toBe('RIFF')
 }
})
