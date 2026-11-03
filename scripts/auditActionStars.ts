import {writeFileSync,mkdirSync,readFileSync,existsSync} from 'node:fs'
import {actionStarTiers,actionStarTeachingExample,actionStarLesson} from '../src/race/actionStarContent'
import {questionIntegrity} from '../src/learning/sentenceRules/questionAudit'
import {composeLessonAction,actionCapabilities} from '../src/learning/sentenceRules/actionCapabilities'
const recordings=JSON.parse(readFileSync('public/audio/action-practice/voice-manifest.json','utf8'))
const capability=actionCapabilities(actionStarLesson)
const rows=actionStarTiers.flatMap(tier=>tier.questions.map(q=>{
 const issues:string[]=[]
 if(!existsSync(`public${q.audioUrl}`))issues.push('missing audio')
 if(recordings[q.audioUrl.split('/').pop()!]?.text!==q.english)issues.push('audio manifest mismatch')
 if(!capability.determiners(capability.objects(q.provenance.action).find(object=>object.noun===q.provenance.noun)!).some(owner=>composeLessonAction(actionStarLesson,{...q.provenance,determiner:owner.word}).answer.thai===q.choices[1]))issues.push('distractor differs from scoped ownership contrast')
 issues.push(...questionIntegrity({id:q.id,english:q.english,skill:'action-stars',correct:0,answers:[[{text:q.choices[0],skill:'action-stars'}],[{text:q.choices[1],skill:'action-stars'}]]}).map(i=>i.code))
 return {stars:tier.stars,id:q.id,english:q.english,thai:q.thai,distractor:q.choices[1],audio:q.audioUrl,provenance:q.provenance,issues}
}))
mkdirSync('reports',{recursive:true})
writeFileSync('reports/action-stars.json',JSON.stringify({review:{method:'Blueprint validation plus row-by-row English/Thai and plausibility review',questions:150,audioListening:'PCM decode for every recording; browser samples separately'},teachingExamples:['holding','opening','washing'].map(action=>actionStarTeachingExample(action)),counts:actionStarTiers.map(t=>({stars:t.stars,questions:t.questions.length})),rows},null,2)+'\n')
writeFileSync('reports/action-stars.tsv',['stars\tid\tEnglish\tThai\tdistractor\taudio\taction\tnoun\tsubject\towner',...rows.map(q=>[q.stars,q.id,q.english,q.thai,q.distractor,q.audio,q.provenance.action,q.provenance.noun,q.provenance.subject,q.provenance.determiner].join('\t'))].join('\n')+'\n')
console.log(`${rows.length} generated questions; ${rows.filter(q=>q.issues.length).length} with findings`)
if(rows.some(q=>q.issues.length))throw new Error(rows.filter(q=>q.issues.length).map(q=>q.id+': '+q.issues.join(',')).join('\n'))
