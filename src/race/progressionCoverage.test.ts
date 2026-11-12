// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {mkdirSync,writeFileSync} from 'node:fs'
import {lessonPracticeTemplate} from './lessonPracticeTemplate'
import {practiceCandidates} from './generatedPracticeContent'
import {hierarchyState,hierarchyTypes,wordHierarchies,targetsHierarchy} from './wordHierarchy'
it('covers every currently compatible word and defers unsupported verb frames',()=>{
 const eligible=new Set<string>(wordHierarchies.verb)
 const banks=Array.from({length:6},(_,index)=>{const template=lessonPracticeTemplate(index+1);return {lesson:index+1,questions:practiceCandidates(template.level,template.options.structure,eligible)}})
 // An optimistic check: if no authored question can credit a hierarchy word even
 // across all authored verb frames before prerequisite filtering, no sequence of real answers can advance it.
 const coverage=hierarchyTypes.flatMap(type=>wordHierarchies[type].map(word=>({type,word,byLesson:banks.map(bank=>({lesson:bank.lesson,questions:bank.questions.filter(q=>targetsHierarchy(q,type,word)).length}))})))
 const unreachable=coverage.filter(row=>row.byLesson.every(lesson=>lesson.questions===0))
 mkdirSync('reports',{recursive:true});writeFileSync('reports/progression-reachability-audit.json',JSON.stringify({coverage,unreachable,pendingBlueprints:hierarchyState(new Set()).verb.waiting},null,2)+'\n')
 expect(unreachable.map(row=>row.word).sort()).toEqual([...hierarchyState(new Set()).verb.waiting].sort())
 expect(unreachable.every(row=>row.type==='verb')).toBe(true)
},120000)
