import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs'
import {join,relative,dirname} from 'node:path'
import {generatedCandidates,sentenceHash,sentenceKey} from '../src/race/generatedPracticeContent'
const root=process.cwd(),audio=join(root,'public/audio')
function files(dir:string):string[]{return readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?files(join(dir,f.name)):[join(dir,f.name)])}
const recordings=new Map<string,string>()
for(const file of files(audio).filter(f=>f.endsWith('voice-manifest.json'))){
 const manifest=JSON.parse(readFileSync(file,'utf8'))
 for(const [name,entry] of Object.entries(manifest) as [string,{text:string}][])if(entry.text&&existsSync(join(dirname(file),name)))recordings.set(sentenceKey(entry.text),'/'+relative(join(root,'public'),join(dirname(file),name)))
}
const bank=([1,2,3,4,5,6] as const).flatMap(level=>generatedCandidates(level))
const missing:{audioUrl:string;spokenText:string}[]=[],manifest:Record<string,string>={}
for(const q of bank){const text=q.document.english,key=sentenceKey(text);if(manifest[key])continue;const existing=recordings.get(key);const url=existing??`/audio/generated-practice/${sentenceHash(key)}.wav`;manifest[key]=url;if(!existing)missing.push({audioUrl:url,spokenText:text})}
writeFileSync('src/race/generatedPracticeAudio.json',JSON.stringify(manifest,null,2)+'\n')
writeFileSync('/tmp/english-generated-audio.json',JSON.stringify(missing))
const sql=(s:string)=>`'${s.replaceAll("'","''")}'`
const tokens=new Set(bank.flatMap(q=>(q.credit??'').toLowerCase().match(/[a-z]+(?:'[a-z]+)*/g)??[]))
const rows=bank.map(q=>`(${sql(q.id)},1,${sql(q.document.english)},array[${q.choices.map(sql).join(',')}],${sql(q.choices[q.correct])},${q.credit===null?'null':sql(q.credit)})`)
writeFileSync('supabase/migrations/20261110000600_people_first_vocabulary.sql',`-- Additive catalogue: only the contrasting words receive proficiency credit.\nbegin;\ninsert into public.english_word_forms(id,form) values\n${[...tokens].sort().map(t=>`(${sql('en:'+t)},${sql(t)})`).join(',\n')}\non conflict do nothing;\ninsert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence) values\n${rows.join(',\n')}\non conflict(id,version) do nothing;\ncommit;\n`)
console.log({questions:bank.length,sentences:Object.keys(manifest).length,newRecordings:missing.length})
