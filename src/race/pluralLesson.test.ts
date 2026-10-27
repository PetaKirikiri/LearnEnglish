import { expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as Y from 'yjs'
import { pluralLessonSeed } from './pluralLessonSeed'
import { pluralVocabulary, pairVocabulary } from './pluralVocabulary'
import { applySnapshot, raceLessonStore } from '../../server/raceLessonDocument'

it('introduces are before ownership and treats pair nouns separately', () => {
  const sections = pluralLessonSeed.content!
  const text = JSON.stringify(sections)
  expect(text.indexOf('Where are the shops?')).toBeLessThan(text.indexOf('Where are my shoes?'))
  expect(text.indexOf('Where are my shoes?')).toBeLessThan(text.indexOf('Where are your shoes?'))
  expect(pluralVocabulary.map(word => word.plural)).toEqual(expect.arrayContaining(['shoes','keys','socks','bags','tickets','books','sandals','boots','shirts','hats','pens','pencils','phones','chargers','towels','bottles','cups','plates']))
  expect(pairVocabulary.map(word => word.plural)).toEqual(['glasses','trousers'])
  for (const word of pairVocabulary) expect(text).toContain(word.plural)
  expect(text).not.toContain('Where is my glasses?')
  expect(text).not.toContain('Where is your trousers?')
})

it('keeps tomorrow’s saved notes separate from the existing lesson', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'race-lessons-'))
  const first = raceLessonStore(dir)
  const second = raceLessonStore(dir, { filename:'where-are-my-notes.json', seed:pluralLessonSeed })
  const doc = new Y.Doc()
  try {
    const original = await first()
    applySnapshot(doc, await second())
    expect(doc.getXmlFragment('default').toString()).toContain('Where are my')
    doc.getMap('test').set('saved', true)
    await second(Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64'))
    expect(await first()).toBe(original)
    const reopened = new Y.Doc()
    applySnapshot(reopened, await raceLessonStore(dir, { filename:'where-are-my-notes.json', seed:pluralLessonSeed })())
    expect(reopened.getMap('test').get('saved')).toBe(true)
    reopened.destroy()
  } finally { doc.destroy(); await rm(dir, {recursive:true,force:true}) }
})
