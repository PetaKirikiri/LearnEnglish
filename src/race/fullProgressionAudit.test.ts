import {classroomWordQuestion} from '../classroom/wordServer'
// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs'
import {lessonPracticeTemplate} from './lessonPracticeTemplate'
import {nextPersonalQuestion} from './practiceForecast'
import {evidenceKey,curriculumBaseline,evidenceScores,loadEvidence,masteredWords,saveEvidence,type ListeningEvidence} from './generatedPracticeProgress'
import {hierarchyCompatible,hierarchyState,hierarchyTypes,wordHierarchies} from './wordHierarchy'
import {wordOpacity,wordTokens} from '../learning/wordProgress/model'

it('walks the shared word tree across phone practice and classroom GO using real selection and saved answer evidence',async()=>{
 localStorage.clear()
 const user='internal-full-progression-audit',started=Date.now()
 const saved=process.env.PROGRESSION_CHECKPOINT?JSON.parse(readFileSync(process.env.PROGRESSION_CHECKPOINT,'utf8')):null
 if(saved){expect(saved.contract).toBe('shared-activities-fixed-structures-v3');expect(saved.user).toBe(user);expect(saved.events.length).toBe(saved.answered);expect(saved.events.every((event:ListeningEvidence,index:number)=>event.id===`audit-${index}`)).toBe(true);localStorage.setItem(evidenceKey(user),JSON.stringify(saved.events))}
 const base:number=saved?.base??Date.now(),resumedAt:number=saved?.answered??0
 const pendingBlueprints=[...hierarchyState(new Set()).verb.waiting]
 const required=Object.fromEntries(hierarchyTypes.map(type=>[type,wordHierarchies[type].filter(word=>type!=='verb'||!pendingBlueprints.includes(word))])) as Record<typeof hierarchyTypes[number],readonly string[]>
 const introductions:Record<string,number>={},transitions:unknown[]=[],paths=saved?.paths??{phone:0,casino:0},structures:Record<string,number>=saved?.structures??{}
 for(const [index,event] of loadEvidence(user).entries())for(const target of event.targets)introductions[target]??=index
 let lastMastered=0,lastAdvance=resumedAt,answered=resumedAt,reason='answer limit'
 for(;answered<12000;answered++){
  const lesson=answered%6+1,template=lessonPracticeTemplate(lesson),events=loadEvidence(user)
  const mastered=masteredWords([],events),state=hierarchyState(mastered)
  const completed=hierarchyTypes.reduce((n,type)=>n+state[type].completed.length,0)
  if(completed>lastMastered){lastMastered=completed;lastAdvance=answered;transitions.push({answer:answered,completed,current:Object.fromEntries(hierarchyTypes.map(type=>[type,state[type].current]))})}
  if(hierarchyTypes.every(type=>required[type].every(word=>state[type].completed.includes(word)))){reason='all active-blueprint words learnt';break}
  if(answered-lastAdvance>=900){reason='no newly learnt word in 900 answers';break}
  const path=Math.floor(answered/6)%2===0?'phone':'casino'
  const q=path==='casino'?classroomWordQuestion(lesson,user,[],events,answered,'full-progression-audit').question:nextPersonalQuestion(template.level,[],events,'full-progression-audit',answered,{...template.options,now:base+answered,familiar:curriculumBaseline([],events,user)})
  paths[path]++;structures[q.document.construction??'unknown']=(structures[q.document.construction??'unknown']??0)+1
  expect(q,`no question at answer ${answered}, lesson ${lesson}`).toBeDefined()
  const constructions=lesson===1?['noun-phrase']:lesson===2?['question']:lesson===6?['identification-question','identification-answer']:['action-answer']
  expect(constructions,`wrong blueprint in lesson ${lesson}: ${q.document.english}`).toContain(q.document.construction)
  expect(hierarchyCompatible(q,state),`out-of-order question at answer ${answered}: ${q.document.english}`).toBe(true)
  for(const target of q.targetWords){expect(pendingBlueprints).not.toContain(target);introductions[target]??=answered}
  for(const doc of [q.document,...(q.alternatives??[])])if(doc.construction==='action-answer'){
   expect(doc.units.some(unit=>unit.role==='object'),doc.english).toBe(true)
   expect(doc.units.filter(unit=>unit.role==='preposition').every(unit=>unit.english==='to'),doc.english).toBe(true)
  }
  const scores=evidenceScores([],events)
  const event:ListeningEvidence={id:`audit-${answered}`,questionId:q.id,level:template.level,sentence:q.document.english,targets:q.credit===null?[]:q.targetWords,vocabulary:q.vocabulary,correct:true,heard:true,hidden:q.listeningWords.length>0&&q.listeningWords.flatMap(wordTokens).every(word=>wordOpacity(word,scores,{fadeMode:true})===0),assisted:false,plays:1,at:new Date(base+answered+1).toISOString()}
  saveEvidence(event,user)
  if(answered%100===0){
   console.log(JSON.stringify({answered,completed,paths,current:Object.fromEntries(hierarchyTypes.map(type=>[type,state[type].current]))}))
   mkdirSync('reports',{recursive:true});writeFileSync('reports/full-progression-audit-progress.json',JSON.stringify({answered,completed,paths,structures,seconds:Math.round((Date.now()-started)/1000),current:Object.fromEntries(hierarchyTypes.map(type=>[type,state[type].current])),learnt:Object.fromEntries(hierarchyTypes.map(type=>[type,state[type].completed.length]))},null,2))
   writeFileSync('reports/full-progression-earned-checkpoint.json',JSON.stringify({contract:'shared-activities-fixed-structures-v3',user,answered:answered+1,base,paths,structures,events:loadEvidence(user)}))
  }
  if(answered%10===0)await new Promise(resolve=>setTimeout(resolve,0))
 }
 const events=loadEvidence(user),state=hierarchyState(masteredWords([],events))
 const tracks=Object.fromEntries(hierarchyTypes.map(type=>[type,{total:wordHierarchies[type].length,compatible:required[type].length,learnt:state[type].completed.length,current:state[type].current,remaining:wordHierarchies[type].filter(word=>!state[type].completed.includes(word))}]))
 const report={answered,resumedAt,reason,paths,structures,pendingBlueprints,seconds:Math.round((Date.now()-started)/1000),tracks,introductions,transitions}
 mkdirSync('reports',{recursive:true});writeFileSync('reports/full-progression-audit.json',JSON.stringify(report,null,2)+'\n')
 writeFileSync('reports/full-progression-audit-progress.json',JSON.stringify({...report,finished:true,completed:hierarchyTypes.reduce((count,type)=>count+state[type].completed.length,0)},null,2)+'\n')
 writeFileSync('reports/full-progression-earned-checkpoint.json',JSON.stringify({contract:'shared-activities-fixed-structures-v3',user,answered,base,paths,structures,events}))
 console.log(JSON.stringify({answered,reason,paths,structures,tracks},null,2))
 expect(state.verb.completed.filter(word=>pendingBlueprints.includes(word))).toEqual([])
 expect(paths.phone).toBeGreaterThan(0);expect(paths.casino).toBeGreaterThan(0)
 expect(reason,'See reports/full-progression-audit.json for unlearnt words and stalled frontiers').toBe('all active-blueprint words learnt')
},1800000)
