import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { questions, audioUrl } from '../src/coach/course'
import { coachWords } from '../src/coach/content'

// Local Thai voice, not English audio or a browser-dependent TTS fallback.
const texts = [...new Set([...questions.map(q => q.thai), ...Object.keys(coachWords)])]
const paths = new Map<string, string>()
const root = resolve('public/audio/padel-coach')
mkdirSync(root, { recursive: true })
for (const text of texts) {
  const url = audioUrl(text)
  if (paths.has(url) && paths.get(url) !== text) throw new Error(`Audio hash collision: ${url}`)
  paths.set(url, text)
  const output = resolve(`public${url}`)
  if (!existsSync(output)) execFileSync('say', ['-v', 'Kanya', '-r', '145', '--file-format=WAVE', '--data-format=LEI16@22050', '-o', output, text], { timeout: 30000 })
  const data = readFileSync(output)
  if (data.subarray(0,4).toString() !== 'RIFF' || data.length < 1000) throw new Error(`Invalid audio: ${output}`)
}
writeFileSync(resolve(root, 'manifest.json'), JSON.stringify({ voice: 'Kanya', language: 'th-TH', rate: 145, files: Object.fromEntries(paths) }, null, 2) + '\n')
console.log(`Verified ${paths.size} Thai recordings for ${questions.length} questions and all word-help chunks.`)
