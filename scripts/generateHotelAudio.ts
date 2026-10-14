import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { homedir } from 'node:os'
import { hotelQuestions } from '../src/hotel/course'
const cache = path.join(homedir(), '.cache/englishsuccess-voice')
const result = spawnSync(process.env.VOICE_PYTHON ?? path.join(cache, 'venv/bin/python'), [
  'scripts/generateNeuralAudio.py', '--model-dir', process.env.VOICE_MODEL_DIR ?? path.join(cache, 'models'), '--output', 'public/audio/hotel',
], { input: JSON.stringify(hotelQuestions.flatMap(q => [{ audioUrl: q.audioUrl, spokenText: q.english }, ...(q.grammar?.prompt ? [{audioUrl:q.grammar.promptAudioUrl!,spokenText:q.grammar.prompt}] : [])])), stdio: ['pipe', 'inherit', 'inherit'] })
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)
