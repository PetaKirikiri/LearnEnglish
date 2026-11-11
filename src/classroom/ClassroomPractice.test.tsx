import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
const stage=vi.hoisted(()=>vi.fn())
vi.mock('../race/ActionPracticeStage',()=>({default:(props:unknown)=>{stage(props);return null}}))
import ClassroomPractice,{classroomPracticeQuestion} from './ClassroomPractice'
import {actionPracticeQuestions} from '../race/actionPracticeContent'
import type {ClassTurn} from './session'
const q=actionPracticeQuestions[0]
const turn:ClassTurn={id:'turn',learner:'peta',questionId:q.id,english:q.english,choices:[q.choices[1],q.choices[0]],answer:null,correct:null}
it('preserves shuffled classroom answers in the shared practice component',async()=>{
 vi.stubGlobal('Audio',class{play(){return Promise.resolve()}pause(){}})
 const el=document.createElement('div'),root=createRoot(el),answer=vi.fn()
 await act(async()=>root.render(<ClassroomPractice question={q} turn={{...turn,scores:{'en:doctor':15}}} onAnswer={answer}/>))
 const props=stage.mock.lastCall![0] as any
 expect(props.question.correct).toBe(1-q.correct);expect(props.teacherControlled).toBe(true);expect(props.settings.fadeMode).toBe(true);expect(props.scores).toEqual({'en:doctor':15})
 props.onChoose(0);expect(answer).toHaveBeenCalledWith(turn.choices[0])
 await act(async()=>root.unmount());vi.unstubAllGlobals()
})
it('keeps the teacher display read-only and preserves answered state',async()=>{
 const el=document.createElement('div'),root=createRoot(el)
 await act(async()=>root.render(<ClassroomPractice question={q} turn={{...turn,answer:turn.choices[0],correct:false}}/>))
 const props=stage.mock.lastCall![0] as any;expect(props.disabled).toBe(true);expect(props.picked).toBe(0);expect(props.review).toBe(true)
 await act(async()=>root.unmount())
})
it('rejects mismatched server choices rather than showing a different test',()=>{expect(()=>classroomPracticeQuestion(q,{...turn,choices:['unrelated','wrong']})).toThrow()})
