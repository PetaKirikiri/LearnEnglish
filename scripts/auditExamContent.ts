import { config } from 'dotenv'
import { writeFileSync } from 'node:fs'
import { examPracticeQuestions, buildExamExplainers } from '../src/learning/examPracticeContent'
import { finalExamVocabulary } from '../src/content/finalExamVocabulary'
import { createPracticeRound } from '../src/learning/quizContent'
import { questionProgressKey } from '../src/learning/progressData'
import { recordAnswer, type LearningMemory } from '../src/learning/learningMemory'
config({path:'.env.local',quiet:true})
const response=await fetch(process.env.VITE_LANGUAGE_SUPABASE_URL+'/rest/v1/rpc/englishsuccess_language',{method:'POST',headers:{apikey:process.env.VITE_LANGUAGE_SUPABASE_ANON_KEY!,'Content-Type':'application/json'},body:'{}'})
if(!response.ok) throw new Error(`Language audit failed: ${response.status}`)
const language=await response.json() as {words:{word:string;thai_gloss:string|null;word_profile:unknown}[]}
const dictionary=new Map(language.words.map(w=>[w.word,w]))
const explainers=buildExamExplainers()
const texts=examPracticeQuestions.flatMap(q=>[q.prompt,q.example,q.passage??'',...q.choices]).concat(explainers.flatMap(h=>[h.rule_th,h.clue_th,h.caution_th??'',...h.examples,...h.contrasts.map(c=>c.text)]))
const tokens=[...new Set(texts.flatMap(t=>(t.match(/[A-Za-z]+(?:[’'][A-Za-z]+)*/g)??[]).map(w=>w.toLowerCase().replaceAll('’',"'"))))]
const missing=tokens.filter(w=>!dictionary.get(w)?.thai_gloss||!dictionary.get(w)?.word_profile)
let memory:LearningMemory={}, firstCompleteRound:number|null=null
const seen=new Set<string>(), counts:Record<string,number>={}
for(let round=0;round<200;round++) for(const q of createPracticeRound(round,memory)) {
 if(!q.examCategory) throw new Error(`Out-of-syllabus question: ${q.id}`)
 counts[q.examCategory]=(counts[q.examCategory]??0)+1
 seen.add(q.id);memory=recordAnswer(memory,q,true,round+1,`audit-${round}`)
 if(seen.size===examPracticeQuestions.filter(q=>q.examUse!=='assessment').length&&firstCompleteRound===null) firstCompleteRound=round+1
}
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'"
const rows=examPracticeQuestions.map(q=>`(${quote(questionProgressKey(q))},${quote(q.answer)},${quote(explainers.find(e=>e.question_id===q.id)!.content_key)})`).join(',\n')
writeFileSync('/tmp/fifa-exam-release-db-audit.sql',`with expected(id,answer,content_key) as (values ${rows}) select count(*) as expected, count(s.question_id) filter(where s.active and s.answer=e.answer) as correct_active_keys, count(h.question_id) filter(where h.content_key=e.content_key and h.clue_th ~ '[ก-๙]' and jsonb_array_length(h.examples)>=2 and jsonb_array_length(h.contrasts)>=2) as current_thai_explainers from expected e left join public.fifa_english_scoring_questions s on s.question_id=e.id left join public.fifa_english_question_explainers h on h.question_id=e.id;`)
console.log(JSON.stringify({questionCount:examPracticeQuestions.length,categories:Object.fromEntries(['vocabulary','dialogue','grammar','reading'].map(c=>[c,examPracticeQuestions.filter(q=>q.examCategory===c).length])),vocabularyEntries:finalExamVocabulary.length,pageCounts:Object.fromEntries([34,36,38,40,46,48,50].map(p=>[p,finalExamVocabulary.filter(v=>v.page===p).length])),helpTokens:tokens.length,missingHelp:missing,simulatedAnswers:2000,categoryExposure:counts,allQuestionsEncounteredByRound:firstCompleteRound},null,2))
if(missing.length||firstCompleteRound===null) process.exitCode=1
