import { afterEach, expect, it, vi } from 'vitest'
import { thaiTranslations as original } from '../content/thaiTranslations.generated'
import { lessonThaiTranslations as lessons } from '../content/lessonThaiTranslations'
import { installLanguageSnapshot, thaiTranslations } from '../content/languageData'
import { getQuizCatalogue } from '../learning/quizContent'
import { loadLanguageDatabase } from './languageDatabase'

const config = { url: 'https://language.example', anonKey: 'public-language-key' }
const snapshot = () => ({ version: 1, words: [...new Set([...Object.keys(original), ...Object.keys(lessons)])].map(word => ({ word, thai_gloss: original[word] ?? null, lesson_thai_gloss: lessons[word] ?? null, corpus_count: 0, corpus_rank: null })) })
afterEach(() => { installLanguageSnapshot(snapshot()); localStorage.clear() })
it('uses database meanings across help and lesson generation, with no Padel session', async () => {
  const data = snapshot()
  data.words.find(w => w.word === 'train')!.thai_gloss = 'database help meaning'
  data.words.find(w => w.word === 'airport')!.lesson_thai_gloss = 'database lesson meaning'
  const request = vi.fn().mockResolvedValue({ ok: true, json: async () => data })
  expect(await loadLanguageDatabase(config, localStorage, request)).toBe('database')
  expect(thaiTranslations.train).toBe('database help meaning')
  const airport = getQuizCatalogue().vocabulary.find(q => q.spokenText === 'airport')!
  expect([airport.prompt, airport.answer]).toContain('database lesson meaning')
  expect(request.mock.calls[0][0]).toBe('https://language.example/rest/v1/rpc/englishsuccess_language')
  expect(request.mock.calls[0][1].headers.Authorization).toBe('Bearer public-language-key')
})
it('uses only a previously verified same-database snapshot offline', async () => {
  await loadLanguageDatabase(config, localStorage, vi.fn().mockResolvedValue({ ok: true, json: async () => snapshot() }))
  const offline = vi.fn().mockRejectedValue(new Error('offline'))
  expect(await loadLanguageDatabase(config, localStorage, offline)).toBe('cache')
  await expect(loadLanguageDatabase({ ...config, url: 'https://other.example' }, localStorage, offline)).rejects.toThrow('offline')
})
it('does not silently fall back to bundled content on a first-time failure', async () => {
  await expect(loadLanguageDatabase(config, localStorage, vi.fn().mockResolvedValue({ ok: false }))).rejects.toThrow('unavailable')
  await expect(loadLanguageDatabase({ ...config, url: '' }, localStorage)).rejects.toThrow('configured')
})
it('validates the entire snapshot before changing meanings or saving it', async () => {
  const data = snapshot()
  data.words.find(w => w.word === 'airport')!.lesson_thai_gloss = null!
  data.words.find(w => w.word === 'train')!.thai_gloss = 'invalid partial update'
  await expect(loadLanguageDatabase(config, localStorage, vi.fn().mockResolvedValue({ ok: true, json: async () => data }))).rejects.toThrow()
  expect(thaiTranslations.train).toBe(original.train)
  expect(localStorage.length).toBe(0)
})
it('uses fresh data even if cache storage is unavailable', async () => {
  const storage = { getItem: () => null, setItem: () => { throw new Error('full') } }
  expect(await loadLanguageDatabase(config, storage, vi.fn().mockResolvedValue({ ok: true, json: async () => snapshot() }))).toBe('database')
})
