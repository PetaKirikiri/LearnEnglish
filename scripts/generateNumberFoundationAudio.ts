import {spawnSync} from 'node:child_process'
import {homedir} from 'node:os'
import path from 'node:path'
import {numberCatalogue,numberAudio} from '../src/race/numberCatalogue'
const recordings=numberCatalogue.flatMap(item=>[{audioUrl:numberAudio(item.word),spokenText:`the ${item.word}`},{audioUrl:numberAudio(item.word,true),spokenText:`Where ${item.pluralForm?'are':'is'} the ${item.word}?`}, {audioUrl:`/audio/number-foundation/where-${item.pluralForm?'is':'are'}-the-${item.word.replaceAll(' ','-')}.wav`,spokenText:`Where ${item.pluralForm?'is':'are'} the ${item.word}?`}])
const cache=path.join(homedir(),'.cache/englishsuccess-voice')
const result=spawnSync(path.join(cache,'venv/bin/python'),['scripts/generateNeuralAudio.py','--model-dir',path.join(cache,'models'),'--output','public/audio/number-foundation'],{input:JSON.stringify(recordings),stdio:['pipe','inherit','inherit']})
if(result.error)throw result.error
if(result.status!==0)throw new Error('Number foundation audio generation failed.')
