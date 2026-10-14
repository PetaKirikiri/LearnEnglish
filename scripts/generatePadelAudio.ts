import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { padelQuestions } from '../src/padel/course'
const cache = `${homedir()}/.cache/englishsuccess-voice`
const result = spawnSync(process.env.VOICE_PYTHON ?? `${cache}/venv/bin/python`, [
  'scripts/generateNeuralAudio.py', '--model-dir', process.env.VOICE_MODEL_DIR ?? `${cache}/models`, '--output', 'public/audio/padel',
], { input: JSON.stringify(padelQuestions.map(q => ({ audioUrl: q.audioUrl, spokenText: q.english }))), stdio: ['pipe','inherit','inherit'] })
if (result.error) throw result.error
process.exit(result.status ?? 1)
