import { config } from 'dotenv'
import { readFileSync, writeFileSync } from 'node:fs'
import { finalExamVocabulary } from '../src/content/finalExamVocabulary'
import { examPracticeQuestions, buildExamExplainers } from '../src/learning/examPracticeContent'
import { wordProfileSchema, type NounForms, type VerbForms } from '../src/learning/wordInfo/types'
import { nouns, verbs, nounMatches, verbMatches, grammarNotes } from './wordGrammar'
import { nounUsageFrames } from './wordUsageFrames'
import { countNeighbours, rankedNeighbours } from '../src/learning/wordInfo/corpus'
import { examWordGlosses } from './examWordGlosses'
config({path:'.env.local',quiet:true})
const response=await fetch(process.env.VITE_LANGUAGE_SUPABASE_URL+'/rest/v1/rpc/englishsuccess_language',{method:'POST',headers:{apikey:process.env.VITE_LANGUAGE_SUPABASE_ANON_KEY!,'Content-Type':'application/json'},body:'{}'})
if(!response.ok) throw new Error(`Language read failed: ${response.status}`)
const snapshot=(process.argv[2] ? JSON.parse(readFileSync(process.argv[2],'utf8')) : await response.json()) as {words:{word:string;thai_gloss:string|null;word_profile:unknown}[]}
const existing=new Map(snapshot.words.map(w=>[w.word,w]))
const glosses={...examWordGlosses}
const extraNouns:NounForms[]=finalExamVocabulary.filter(v=>v.plural&&!v.word.includes(' ')).map(v=>({singular:v.word,plural:v.plural!,countability:'countable'}))
extraNouns.push({singular:'clothes',plural:null,countability:'plural-only',note_th:'ใช้รูปพหูพจน์: clothes are; ถ้านับเป็นชิ้นใช้ an item of clothing'}, {singular:'tooth',plural:'teeth',countability:'countable'})
for(const v of finalExamVocabulary) if(!v.word.includes(' ')) {glosses[v.word]=v.thai;if(v.plural)glosses[v.plural]=v.thai}
for(const singular of ['rainstorm','driver','road','percentage','statement','advantage','paragraph']) extraNouns.push({singular,plural:singular+'s',countability:'countable'})
extraNouns.push({singular:'activity',plural:'activities',countability:'countable'})
const extraVerbs:VerbForms[]=['brush','pack','clean','flow','jump'].map(base=>({base,third:base==='brush'?'brushes':base+'s',past:base+'ed',participle:base+'ed',ing:base+'ing'}))
const allNouns=[...extraNouns,...nouns.filter(n=>!extraNouns.some(e=>e.singular===n.singular))]
const allVerbs=[...extraVerbs,...verbs.filter(v=>!extraVerbs.some(e=>e.base===v.base))]
const help=buildExamExplainers()
const texts=examPracticeQuestions.flatMap(q=>[q.prompt,q.example,q.passage??'',...q.choices]).concat(help.flatMap(h=>[h.rule_th,h.clue_th,h.caution_th??'',...h.examples,...h.contrasts.map(c=>c.text)]))
const words=[...new Set(texts.flatMap(t=>(t.match(/[A-Za-z]+(?:[’'][A-Za-z]+)*/g)??[]).map(w=>w.toLowerCase().replaceAll('’',"'"))))]
const missing=words.filter(w=>!existing.get(w)?.thai_gloss&&!glosses[w])
if(missing.length) throw new Error(`Missing reviewed meanings: ${missing.join(', ')}`)
const counts=countNeighbours(texts)
const rows=words.filter(w=>!existing.get(w)?.thai_gloss||!existing.get(w)?.word_profile).map(word=>{
 const count=counts.get(word),n=allNouns.filter(n=>nounMatches(n,word))
 const profile=wordProfileSchema.parse({nouns:n,verbs:allVerbs.filter(v=>verbMatches(v,word)),usage_frames:nounUsageFrames(word,n),grammar_note_th:grammarNotes[word],before:count?rankedNeighbours(count.before):[],after:count?rankedNeighbours(count.after):[],occurrences:count?.occurrences??0,corpus_version:'exam-ch34-v1'})
 return {word,thai_gloss:glosses[word]??existing.get(word)?.thai_gloss,word_profile:profile}
})
writeFileSync(process.argv[3] ?? 'supabase/language/20260921170100_exam_words.sql',`begin;
-- Add missing exam word help; preserve all existing reviewed meanings/profiles.
insert into public.englishsuccess_words(word,thai_gloss,word_profile,corpus_count,corpus_rank)
select word,thai_gloss,word_profile,0,null from jsonb_to_recordset($examwords$${JSON.stringify(rows)}$examwords$::jsonb) as r(word text,thai_gloss text,word_profile jsonb)
on conflict(word) do update set thai_gloss=coalesce(englishsuccess_words.thai_gloss,excluded.thai_gloss),word_profile=coalesce(englishsuccess_words.word_profile,excluded.word_profile);
commit;
`)
console.log(`${rows.length} missing word-help records prepared; ${words.length} visible/help tokens covered`)
