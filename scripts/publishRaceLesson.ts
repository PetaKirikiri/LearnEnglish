import * as Y from 'yjs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

// Publish visible teaching content only, without recovery data or edit history.
const lesson = process.argv[2] ?? 'where-is-the'
if (!['where-is-the', 'where-are-my'].includes(lesson)) throw new Error('Unknown lesson')
const source = JSON.parse(await readFile(`.classroom-races/${lesson}-notes.json`, 'utf8'))
const original = new Y.Doc(), clean = new Y.Doc()
Y.applyUpdate(original, Buffer.from(source.snapshot, 'base64'))
function copy(node: Y.XmlElement | Y.XmlText): Y.XmlElement | Y.XmlText {
  if (node instanceof Y.XmlText) { const text = new Y.XmlText(); text.applyDelta(node.toDelta()); return text }
  const next = new Y.XmlElement(node.nodeName)
  Object.entries(node.getAttributes()).forEach(([key, value]) => next.setAttribute(key, value))
  next.insert(0, node.toArray().map(child => copy(child as Y.XmlElement | Y.XmlText)))
  return next
}
const nodes = original.getXmlFragment('default').toArray()
if (!nodes.length) throw new Error('The teaching document is empty. Nothing was published.')
clean.getXmlFragment('default').insert(0, nodes.map(node => copy(node as Y.XmlElement | Y.XmlText)))
clean.getMap('pages').set('default', { id: 'default', title: 'Teaching', order: 0 })
await mkdir('public/lessons', { recursive: true })
await writeFile(`public/lessons/${lesson}.json`, JSON.stringify({ snapshot: Buffer.from(Y.encodeStateAsUpdate(clean)).toString('base64'), canEdit: false }))
console.log('Published the saved teaching document.')
original.destroy(); clean.destroy()
