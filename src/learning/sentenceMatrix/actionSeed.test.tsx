// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {it,expect} from 'vitest'
import {actionPracticeQuestions} from '../../race/actionPracticeContent'
import {classroomMatrices} from '../../classroom/matrixLessons'
import {actionSeed} from './actionSeed'
import SentenceMatrix from './SentenceMatrix'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('reopens every assigned sentence exactly in the shared editable matrix',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 const lesson={...classroomMatrices['lesson-3'],pattern:'present-action' as const}
 try{for(const q of actionPracticeQuestions){
  await act(async()=>root.render(<SentenceMatrix key={q.id} lesson={lesson} initialAction={actionSeed(q,lesson)} settings={{initialPattern:q.level===4?'question':'answer',patternNavigation:false,audio:false}}/>))
  expect([...host.querySelectorAll('.example-source')].map(e=>e.textContent).join(' '),q.id).toBe(q.english)
 }}finally{await act(async()=>root.unmount())}
},20000)
