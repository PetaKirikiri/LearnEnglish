import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
import IdentificationClassroomPractice from './IdentificationClassroomPractice'
import {identificationQuestions} from '../race/identificationContent'
import type {ClassTurn} from './session'
it('shows the same shuffled picture choices on the computer and selected phone, and only the phone answers',async()=>{
 vi.stubGlobal('Audio',class{play(){return Promise.resolve()}pause(){}})
 const q=identificationQuestions[0],turn:ClassTurn={id:'t',learner:'student',questionId:q.id,english:q.document.english,choices:[q.choices[1],q.choices[0]],answer:null,correct:null,scores:{'en:this':12}}
 const teacher=document.createElement('div'),phone=document.createElement('div'),tr=createRoot(teacher),pr=createRoot(phone),answer=vi.fn()
 await act(async()=>{tr.render(<IdentificationClassroomPractice question={q} turn={turn}/>);pr.render(<IdentificationClassroomPractice question={q} turn={turn} onAnswer={answer}/>)})
 const labels=(el:HTMLElement)=>[...el.querySelectorAll('.binary-answer')].map(b=>b.getAttribute('aria-label'))
 expect(labels(teacher)).toEqual(turn.choices);expect(labels(phone)).toEqual(turn.choices)
 expect([...teacher.querySelectorAll<HTMLButtonElement>('.binary-answer')].every(b=>b.disabled)).toBe(true)
 expect([...phone.querySelectorAll('[data-distance]')].map(e=>e.getAttribute('data-distance'))).toEqual([...teacher.querySelectorAll('[data-distance]')].map(e=>e.getAttribute('data-distance')))
 await act(async()=>phone.querySelectorAll<HTMLButtonElement>('.binary-answer')[1].click());expect(answer).toHaveBeenCalledWith(turn.choices[1])
 await act(async()=>tr.render(<IdentificationClassroomPractice question={q} turn={{...turn,answer:turn.choices[1],correct:true}}/>))
 expect(teacher.querySelector('[role=status]')?.textContent).toBe('ถูกต้อง')
 await act(async()=>{tr.unmount();pr.unmount()});vi.unstubAllGlobals()
})
