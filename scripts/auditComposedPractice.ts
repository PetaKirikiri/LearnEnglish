import {createHash} from 'node:crypto'
import {readFileSync,existsSync,writeFileSync} from 'node:fs'
import {dirname,basename} from 'node:path'
import {generatedCandidates,sentenceKey} from '../src/race/generatedPracticeContent'
const audio=JSON.parse(readFileSync('src/race/generatedPracticeAudio.json','utf8')) as Record<string,string>
const questions=([1,2,3,4,5,6] as const).flatMap(generatedCandidates)
const manifests=new Map<string,Record<string,{text:string;voice:string}>>()
const files=new Set<string>()
for(const q of questions){
 const url=audio[sentenceKey(q.document.english)],path='public'+url
 if(!url||!existsSync(path))throw new Error(`Missing audio: ${q.document.english}: ${url}`)
 if(files.has(path))continue
 files.add(path)
 const source=dirname(path)+'/voice-manifest.json'
 if(!manifests.has(source))manifests.set(source,JSON.parse(readFileSync(source,'utf8')))
 const entry=manifests.get(source)![basename(path)]
 if(sentenceKey(entry?.text??'')!==sentenceKey(q.document.english)||entry.voice!=='kokoro-1.0-heart-v1')throw new Error(`Incorrect recording: ${path}`)
 const bytes=readFileSync(path)
 if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE'||bytes.length<4844)throw new Error(`Invalid audio: ${path}`)
}
const canonical=questions.sort((a,b)=>a.id.localeCompare(b.id)).map(q=>[q.id,1,q.document.english,...q.choices,q.choices[q.correct],q.credit??'<null>'].join('\x1f')).join('\n')
const expected=createHash('md5').update(canonical).digest('hex')
const activeIds=questions.map(q=>`('${q.id}')`).join(',')
writeFileSync('/tmp/english-composed-catalogue-audit.sql',`with current_ids(current_id) as (values ${activeIds}) select count(*) as questions,md5(string_agg(concat_ws(chr(31),id,version::text,sentence,choices[1],choices[2],answer,coalesce(credit_sentence,'<null>')),chr(10) order by id collate "C")) as content_hash from public.english_word_questions join current_ids on id=current_id where version=1;\n`)
console.log(JSON.stringify({questions:questions.length,recordings:files.size,expectedCatalogueHash:expected}))
