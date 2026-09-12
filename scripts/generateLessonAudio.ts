import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getLessonAudioItems } from '../src/learning/quizContent'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputRoot = path.join(projectRoot, 'public', 'audio', 'lessons')
mkdirSync(outputRoot, { recursive: true })

let created = 0

for (const { audioUrl, spokenText } of getLessonAudioItems()) {
  const fileName = path.basename(audioUrl)
  const outputPath = path.join(outputRoot, fileName)
  if (existsSync(outputPath)) continue

  execFileSync('say', [
    '-v', 'Samantha',
    '-r', '150',
    '-o', outputPath,
    '--file-format=WAVE',
    '--data-format=LEI16@22050',
    spokenText,
  ])
  created += 1
}

console.log(`Created ${created} lesson audio files in ${outputRoot}`)
