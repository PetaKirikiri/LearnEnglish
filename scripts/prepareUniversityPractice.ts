import {writeFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {homedir} from 'node:os'
import {actionPracticeQuestions} from '../src/race/actionPracticeContent'
const quote=(s:string)=>`'${s.replaceAll("'","''")}'`
const forms=[...new Set(actionPracticeQuestions.flatMap(q=>q.english.toLowerCase().match(/[a-z]+/g)??[]))]
writeFileSync('supabase/migrations/20261103000600_action_level_six.sql',`begin;\ninsert into public.english_word_forms(id,form,lemma_id) values\n${forms.map(w=>`(${quote('en:'+w)},${quote(w)},${quote('en:'+w)})`).join(',\n')}\non conflict(id) do nothing;\ninsert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence) values\n${actionPracticeQuestions.map(q=>`(${quote(q.id)},1,${quote(q.english)},array[${q.choices.map(quote).join(',')}],${quote(q.thai)},${quote(q.english)})`).join(',\n')}\non conflict(id,version) do nothing;\ncreate table if not exists public.english_classroom_question_catalogue (question_id text primary key);\nrevoke all on public.english_classroom_question_catalogue from anon, authenticated;\ndelete from public.english_classroom_question_catalogue;\ninsert into public.english_classroom_question_catalogue(question_id) values ${actionPracticeQuestions.map(q=>`(${quote(q.id)})`).join(',')};\ncommit;\n`)
const cache=homedir()+'/.cache/englishsuccess-voice'
const result=spawnSync(cache+'/venv/bin/python',['scripts/generateNeuralAudio.py','--model-dir',cache+'/models','--output','public/audio/action-practice'],{input:JSON.stringify(actionPracticeQuestions.map(q=>({audioUrl:q.audioUrl,spokenText:q.english}))),stdio:['pipe','inherit','inherit']})
if(result.status!==0)throw new Error('Audio generation failed')
