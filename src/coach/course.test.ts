import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { coachPairs, coachTopics, coachWords } from './content'
import { englishMeaning, englishReview } from './englishReview'
import { audioUrl, complete, nextQuestion, opacity, questions, recordAnswer, recordWords, type Progress } from './course'

describe('Thai for a French-speaking padel coach', () => {
  it('has an English review meaning for every prompt, keyed to stable pair IDs', () => {
    expect(Object.keys(englishReview).sort()).toEqual(coachPairs.map(([id]) => id).sort())
    for (const q of questions) {
      expect(englishMeaning(q.id, q.correct)).not.toBe('—')
      expect(englishMeaning(q.id, q.correct).length).toBeGreaterThan(3)
    }
    expect(englishMeaning('coach-serve-2-1', 0)).toBe('After serving, move up to the net.')
    expect(englishMeaning('coach-serve-2-2', 1)).toBe('After serving, wait here.')
  })
  it('contains 128 paired prompts across sixteen topics, with complete word help', () => {
    expect(questions).toHaveLength(128)
    expect(coachTopics).toHaveLength(16)
    expect(new Set(questions.map(q => q.id)).size).toBe(128)
    for (const [skill] of coachTopics) expect(questions.filter(q => q.skill === skill)).toHaveLength(8)
    for (const [, , thai, french] of coachPairs) {
      expect(thai[0]).not.toBe(thai[1]); expect(french[0]).not.toBe(french[1])
      for (const sentence of thai) for (const token of sentence.split('|')) {
        expect(coachWords[token], token).toBeDefined()
        expect(coachWords[token][0]).toBeTruthy(); expect(coachWords[token][1]).toBeTruthy()
      }
    }
    for (const q of questions) expect(q.thai).toBe(q.tokens.join(''))
  })
  it('has a matching playable Thai recording for every sentence and word-help chunk', () => {
    const manifest = JSON.parse(readFileSync('public/audio/padel-coach/manifest.json', 'utf8'))
    expect(manifest.language).toBe('th-TH')
    const texts = new Set([...questions.map(q => q.thai), ...Object.keys(coachWords)])
    expect(new Set([...texts].map(audioUrl)).size).toBe(texts.size)
    for (const text of texts) {
      const url = audioUrl(text)
      expect(manifest.files[url]).toBe(text)
      const buffer = readFileSync(`public${url}`)
      expect(buffer.subarray(0, 4).toString()).toBe('RIFF')
      expect(buffer.subarray(8, 12).toString()).toBe('WAVE')
      expect(buffer.length).toBeGreaterThan(1000)
    }
  })
  it('makes time contrasts about time rather than a different person or object', () => {
    const future = coachPairs.find(([id]) => id === 'timing-1')!
    const finished = coachPairs.find(([id]) => id === 'timing-2')!
    expect(future[2]).toEqual(['จะ|เสิร์ฟ','กำลัง|เสิร์ฟ'])
    expect(finished[2]).toEqual(['กำลัง|เสิร์ฟ','เสิร์ฟ|แล้ว'])
  })
  it('tracks only the chunks heard in each answered sentence, once per attempt', () => {
    let memory = recordWords({}, ['ตี','ลูก','ให้','เร็ว','ลูก'], true, false)
    memory = recordWords(memory, ['ตี','ลูก','เร็ว'], true, false)
    expect(memory.ให้).toEqual({ seen: 1, strength: 1 })
    expect(memory.ลูก).toEqual({ seen: 2, strength: 2 })
    expect(opacity(memory, 'ลูก')).toBeLessThan(opacity(memory, 'ให้'))
    const helped = recordWords(memory, ['ลูก'], true, true)
    expect(helped.ลูก.strength).toBe(2)
    expect(recordWords(helped, ['ลูก'], false, false).ลูก.strength).toBe(0)
  })
  it('requires two unaided successes per item and revisits completed topics', () => {
    const q = questions[0]
    const once = recordAnswer({}, q, true, false)
    expect(once[q.id].streak).toBe(1)
    expect(recordAnswer(once, q, true, true)[q.id].streak).toBe(0)
    expect(recordAnswer(once, q, false, false)[q.id].streak).toBe(0)
    expect(nextQuestion({}, undefined, 0, () => 0).skill).toBe('feedback')
    expect(nextQuestion({}, undefined, 1, () => 0).skill).toBe('contact')
    const progress: Progress = Object.fromEntries(questions.filter(q => q.skill === 'feedback').map(q => [q.id, { attempts: 2, correct: 2, streak: 2 }]))
    expect(complete(progress, 'feedback')).toBe(true)
    expect(nextQuestion(progress, undefined, 0, () => 0).skill).toBe('contact')
    expect(nextQuestion(progress, undefined, 1, () => 0).skill).toBe('movement')
    expect(nextQuestion(progress, undefined, 3, () => 0).skill).toBe('feedback')
    const all = Object.fromEntries(questions.map(q => [q.id, { attempts: 2, correct: 2, streak: 2 }]))
    expect(new Set(Array.from({ length: coachTopics.length }, (_, i) => nextQuestion(all, undefined, i).skill)).size).toBe(coachTopics.length)
  })
  it('teaches demonstration, negation, questions and clarification with matching contrasts', () => {
    expect(coachPairs.find(([id]) => id === 'demonstration-2')?.[2]).toEqual(['ทำ|แบบนี้','อย่า|ทำ|แบบนี้'])
    expect(coachPairs.find(([id]) => id === 'explanation-4')?.[2]).toEqual(['ขยับ|แบบนี้','อย่า|ขยับ|แบบนี้'])
    expect(englishMeaning('coach-understanding-1-1', 0)).toBe('Do you understand?')
    expect(englishMeaning('coach-repeat-1-2', 1)).toBe('Can you show it again?')
    expect(englishMeaning('coach-check_in-1-2', 1)).toBe('Does it hurt?')
  })
})
