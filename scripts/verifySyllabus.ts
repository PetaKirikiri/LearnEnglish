import {config} from 'dotenv'
import {curriculumSchema} from '../src/curriculum/schema'
import snapshot from '../src/curriculum/syllabus.snapshot.json'
config({path:'.env.local',quiet:true})
const url=process.env.VITE_LANGUAGE_SUPABASE_URL!,key=process.env.VITE_LANGUAGE_SUPABASE_ANON_KEY!
if(new URL(url).hostname!=='gbsopnbovsxlstnmaaga.supabase.co') throw Error('Expected language project')
const request=async(name:string)=>{
  const r=await fetch(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:'{}'})
  if(!r.ok) throw Error(`Public RPC ${name}: ${r.status}`)
  return r.json()
}
const [raw,dictionary]=await Promise.all([request('englishsuccess_curriculum_v2'),request('englishsuccess_language')])
const data=curriculumSchema.parse(raw)
for(const field of ['questions','structures','vocabulary','skills','courseSkills'] as const) {
  const key=(v:unknown)=>JSON.stringify(v)
  const actual=data[field].map(key).sort(),expected=snapshot[field].map(key).sort()
  if(JSON.stringify(actual)!==JSON.stringify(expected)) throw Error(`Database differs from reviewed ${field}`)
}
const words=new Set(dictionary.words.filter((w:{thai_gloss:string})=>w.thai_gloss).map((w:{word:string})=>w.word))
if(data.vocabulary.some(w=>!words.has(w.word))) throw Error('Dictionary coverage gap')
console.log({source:'public language RPC',revision:data.revision,sections:data.structures.length,frames:data.structures.reduce((n,s)=>n+s.frames.length,0),questions:data.questions.length,words:data.vocabulary.length,wordLinks:data.wordLinks.length,dictionaryWords:words.size,reviewedSnapshotMatch:true})
