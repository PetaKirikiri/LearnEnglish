import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import path from 'node:path'
import { tonightMeaningQuestions } from '../src/race/tonightQuestions'
const recordings = tonightMeaningQuestions.map(q => ({audioUrl:q.audioUrl, spokenText:q.english}))
const root = path.resolve(import.meta.dirname, '..')
const cache = path.join(homedir(), '.cache', 'englishsuccess-voice')
const result = spawnSync(path.join(cache, 'venv/bin/python'), [path.join(root, 'scripts/generateNeuralAudio.py'), '--model-dir', path.join(cache, 'models'), '--output', path.join(root, 'public/audio/race-class-one')], {
  input: JSON.stringify(recordings), stdio: ['pipe', 'inherit', 'inherit'],
})
if (result.error) throw result.error
if (result.status !== 0) throw new Error(`Audio generation failed: ${result.status}`)
