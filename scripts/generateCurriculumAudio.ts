import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import path from 'node:path'
import { expandedQuestions } from '../src/curriculum/expandedContent'
import { generalQuestions } from '../src/curriculum/generalContent'
import { beginnerQuestions } from '../src/curriculum/beginnerContent'
import { introductionQuestions } from '../src/curriculum/introductions'
const root=path.resolve(import.meta.dirname,'..')
const cache=path.join(homedir(),'.cache','englishsuccess-voice')
const items=[...expandedQuestions(),...generalQuestions(),...beginnerQuestions(),...introductionQuestions()].flatMap(q=>[
  {audioUrl:q.audioUrl!,spokenText:q.english},
  ...(q.grammar?.promptAudioUrl?[{audioUrl:q.grammar.promptAudioUrl,spokenText:q.grammar.prompt!}]:[]),
])
const result=spawnSync(path.join(cache,'venv/bin/python'),[path.join(root,'scripts/generateNeuralAudio.py'),'--model-dir',path.join(cache,'models'),'--output',path.join(root,'public/audio/hotel')],{input:JSON.stringify(items),stdio:['pipe','inherit','inherit']})
if(result.error) throw result.error
if(result.status!==0) throw new Error(`Audio generation failed: ${result.status}`)
