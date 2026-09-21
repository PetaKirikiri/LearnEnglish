import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { getLessonAudioItems } from '../src/learning/quizContent'
import { installLanguageSnapshot } from '../src/content/languageData'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
config({ path: path.join(projectRoot, '.env.local'), quiet: true })
const databaseUrl = process.env.VITE_LANGUAGE_SUPABASE_URL
const databaseKey = process.env.VITE_LANGUAGE_SUPABASE_ANON_KEY
if (!databaseUrl || !databaseKey) throw new Error('Language database configuration is required to generate the current course audio.')
const response = await fetch(`${new URL(databaseUrl).origin}/rest/v1/rpc/englishsuccess_language`, {
  method: 'POST',
  headers: { apikey: databaseKey, Authorization: `Bearer ${databaseKey}`, 'Content-Type': 'application/json' },
  body: '{}', signal: AbortSignal.timeout(15000),
})
if (!response.ok) throw new Error(`Language snapshot failed: ${response.status}`)
installLanguageSnapshot(await response.json())
const cacheRoot = path.join(homedir(), '.cache', 'englishsuccess-voice')
const result = spawnSync(process.env.VOICE_PYTHON ?? path.join(cacheRoot, 'venv', 'bin', 'python'), [
  path.join(projectRoot, 'scripts', 'generateNeuralAudio.py'),
  '--model-dir', process.env.VOICE_MODEL_DIR ?? path.join(cacheRoot, 'models'),
  '--output', path.join(projectRoot, 'public', 'audio', 'lessons'),
], { input: JSON.stringify(getLessonAudioItems()), stdio: ['pipe', 'inherit', 'inherit'] })
if (result.error) throw result.error
if (result.status !== 0) throw new Error(`Neural audio generation failed (${result.status})`)
