import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { tonightMeaningQuestions } from './tonightQuestions'
import { lessonTwoReviewQuestions } from './lessonTwoQuestions'
it('has matching recorded speech for every homework sentence', () => {
  const questions = [...tonightMeaningQuestions, ...lessonTwoReviewQuestions.filter(q => q.audioUrl?.startsWith('/audio/race-lesson-two/'))]
  expect(questions).toHaveLength(174)
  for (const q of questions) {
    expect(q.audioUrl).toMatch(/^\/audio\//)
    const parts = q.audioUrl.split('/')
    const name = parts.pop()!
    const manifest = JSON.parse(readFileSync(`public${parts.join('/')}/voice-manifest.json`, 'utf8'))
    expect(manifest[name].text).toBe(q.english)
    expect(manifest[name].voice).toBe('kokoro-1.0-heart-v1')
    expect(readFileSync(`public${q.audioUrl}`).length).toBeGreaterThan(4800)
  }
})
