import * as Y from 'yjs'
import type { JSONContent } from '@tiptap/core'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { raceLessonSeed } from '../src/race/raceLessonSeed'

function xml(node: JSONContent): Y.XmlElement | Y.XmlText {
  if (node.type === 'text') { const text = new Y.XmlText(); text.insert(0, node.text ?? ''); return text }
  const element = new Y.XmlElement(node.type!)
  for (const [key, value] of Object.entries(node.attrs ?? {})) element.setAttribute(key, value)
  if (node.content?.length) element.insert(0, node.content.map(xml))
  return element
}
export function seedRaceLesson() {
  const doc = new Y.Doc()
  doc.getMap('pages').set('default', { id: 'default', title: 'Teaching', order: 0 })
  doc.getXmlFragment('default').insert(0, raceLessonSeed.content!.map(xml))
  return doc
}
export const snapshotOf = (doc: Y.Doc) => Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64')
export function applySnapshot(doc: Y.Doc, snapshot: unknown) {
  if (typeof snapshot !== 'string' || snapshot.length > 2_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(snapshot)) throw new Error('Invalid document snapshot')
  Y.applyUpdate(doc, Buffer.from(snapshot, 'base64'))
}
export function raceLessonStore(directory: string) {
  let queue = Promise.resolve()
  const path = join(directory, 'where-is-the-notes.json')
  const save = async (doc: Y.Doc) => {
    const snapshot = snapshotOf(doc)
    if (snapshot.length > 2_000_000) throw new Error('Document is too large')
    await mkdir(directory, { recursive: true, mode: 0o700 })
    await writeFile(`${path}.tmp`, JSON.stringify({ version: 1, snapshot }), { mode: 0o600 })
    await rename(`${path}.tmp`, path)
    return snapshot
  }
  return (incoming?: unknown): Promise<string> => {
    const result = queue.then(async () => {
      const doc = new Y.Doc()
      try {
        try { const stored = JSON.parse(await readFile(path, 'utf8')); applySnapshot(doc, stored.snapshot) }
        catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
          const seeded = seedRaceLesson(); Y.applyUpdate(doc, Y.encodeStateAsUpdate(seeded)); seeded.destroy()
          await save(doc)
        }
        if (incoming !== undefined) { applySnapshot(doc, incoming); return await save(doc) }
        return snapshotOf(doc)
      } finally { doc.destroy() }
    })
    queue = result.then(() => undefined, () => undefined)
    return result
  }
}
