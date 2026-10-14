// @vitest-environment node
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { hotelQuestions } from './course'

it('ships a matching, nonempty neural recording for every Hotel question', () => {
  const manifest = JSON.parse(readFileSync(resolve('public/audio/hotel/voice-manifest.json'), 'utf8'))
  const recordings = hotelQuestions.flatMap(q => [{id:q.id,english:q.english,audioUrl:q.audioUrl},...(q.grammar?.prompt ? [{id:`${q.id}-prompt`,english:q.grammar.prompt,audioUrl:q.grammar.promptAudioUrl!}] : [])])
  for (const question of recordings) {
    const name = question.audioUrl.split('/').at(-1)!
    const entry = manifest[name]
    expect(entry, question.id).toBeDefined()
    expect(entry.text, question.id).toBe(question.english)
    const fingerprint = createHash('sha256').update(`kokoro-1.0-heart-v1|0.95|0.65|${question.english}`).digest('hex')
    expect(entry.fingerprint, question.id).toBe(fingerprint)
    expect(entry.seconds).toBeGreaterThan(0.1)
    const audio = readFileSync(resolve('public', question.audioUrl.slice(1)))
    expect(audio.subarray(0, 4).toString()).toBe('RIFF')
    expect(audio.subarray(8, 12).toString()).toBe('WAVE')
    expect(audio.length).toBeGreaterThan(4800)
  }
})
