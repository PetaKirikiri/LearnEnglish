import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import path from 'node:path'
import { classOneAudio } from '../src/portal/classOne'
const root=path.resolve(import.meta.dirname,'..'),cache=path.join(homedir(),'.cache','englishsuccess-voice')
const result=spawnSync(path.join(cache,'venv/bin/python'),[path.join(root,'scripts/generateNeuralAudio.py'),'--model-dir',path.join(cache,'models'),'--output',path.join(root,'public/audio/class-one')],{input:JSON.stringify(classOneAudio),stdio:['pipe','inherit','inherit']})
if(result.error)throw result.error
if(result.status!==0)throw new Error(`Audio generation failed: ${result.status}`)
