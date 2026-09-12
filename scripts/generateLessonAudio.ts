import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getLessonAudioItems } from '../src/learning/quizContent'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputRoot = path.join(projectRoot, 'public', 'audio', 'lessons')
mkdirSync(outputRoot, { recursive: true })

let created = 0

function hasAudio(file: string) {
  if (!existsSync(file)) return false
  const bytes = readFileSync(file)
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const size = bytes.readUInt32LE(offset + 4)
    if (bytes.toString('ascii', offset, offset + 4) === 'data') return size > 0 && offset + 8 + size <= bytes.length
    offset += 8 + size + (size % 2)
  }
  return false
}

for (const { audioUrl, spokenText } of getLessonAudioItems()) {
  const fileName = path.basename(audioUrl)
  const outputPath = path.join(outputRoot, fileName)
  if (hasAudio(outputPath)) continue

  execFileSync('say', [
    '-v', 'Samantha',
    '-r', '150',
    '-o', outputPath,
    '--file-format=WAVE',
    '--data-format=LEI16@22050',
    spokenText,
  ])
  if (!hasAudio(outputPath)) throw new Error(`Speech synthesis produced no usable audio: ${fileName}`)
  created += 1
}

console.log(`Created ${created} lesson audio files in ${outputRoot}`)
