// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {beforeEach,expect,it,vi} from 'vitest'
const playback=vi.hoisted(()=>({calls:0,stops:0,callbacks:null as null|{started:()=>void;ended:()=>void;error:()=>void}}))
vi.mock('../audio/sentenceAudio',()=>({prepareSentenceAudio:vi.fn().mockResolvedValue(undefined),playTimedSentence:(_q:unknown,callbacks:typeof playback.callbacks)=>{playback.calls++;playback.callbacks=callbacks;callbacks?.started();return ()=>{playback.stops++}}}))
import GeneratedClassroomPractice from './GeneratedClassroomPractice'
import type {GeneratedQuestion} from '../race/generatedPracticeContent'
const question:GeneratedQuestion={id:'test',version:1,level:1,document:{english:'the man',thai:'',construction:'noun-phrase',units:[{english:'the',thai:'',role:'determiner'},{english:'man',thai:'',role:'object'}]},choices:['the man','the woman'],correct:0,targetWords:['man'],listeningWords:['man'],family:'noun',vocabulary:['man','woman'],action:'',owner:'the',subject:'',plural:false,kind:'meaning',credit:'man'}
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
beforeEach(()=>{playback.calls=0;playback.stops=0;playback.callbacks=null})
it('shows the exact selected sentence on both screens and keeps phone answers available while audio completes',async()=>{
 const host=document.createElement('div'),phone=document.createElement('div'),h=createRoot(host),p=createRoot(phone),answer=vi.fn()
 const turn={id:'turn',learner:'student',questionId:question.id,english:question.document.english,choices:question.choices,answer:null,correct:null,scores:{'en:man':25}}
 try{
  await act(async()=>h.render(<GeneratedClassroomPractice question={question} turn={turn}/>))
  expect(host.textContent).toContain('man');expect(playback.callbacks).toBeNull()
  await act(async()=>p.render(<GeneratedClassroomPractice question={question} turn={turn} onAnswer={answer}/>))
  const button=phone.querySelector<HTMLButtonElement>('.binary-answer')!
  expect(button.disabled).toBe(false)
  await act(async()=>playback.callbacks!.ended())
  expect(button.disabled).toBe(false)
  await act(async()=>button.click())
  expect(answer).toHaveBeenCalledWith('the man',{heard:true,plays:1,assisted:false})
 }finally{await act(async()=>{h.unmount();p.unmount()})}
})
it('counts only student presentation, including hidden audio, once per mounted turn',async()=>{
 const host=document.createElement('div'),root=createRoot(host),present=vi.fn(()=>true)
 const turn={id:'served',learner:'student',questionId:question.id,english:question.document.english,choices:question.choices,answer:null,correct:null,scores:{'en:the':25,'en:man':25}}
 try{
  await act(async()=>root.render(<GeneratedClassroomPractice question={question} turn={turn} onPresented={present}/>))
  expect(present).not.toHaveBeenCalled()
  await act(async()=>root.render(<GeneratedClassroomPractice question={question} turn={turn} onAnswer={()=>{}} onPresented={present}/>))
  expect(present).toHaveBeenCalledOnce()
  await act(async()=>playback.callbacks!.started())
  expect(present).toHaveBeenCalledOnce()
 }finally{await act(async()=>root.unmount())}
})

it('keeps answers available after audio failure without claiming listening proof',async()=>{
 const host=document.createElement('div'),root=createRoot(host),answer=vi.fn()
 const turn={id:'failed-audio',learner:'student',questionId:question.id,english:question.document.english,choices:question.choices,answer:null,correct:null,scores:{}}
 try{
  await act(async()=>root.render(<GeneratedClassroomPractice question={question} turn={turn} onAnswer={answer}/>))
  await act(async()=>playback.callbacks!.error())
  const button=host.querySelector<HTMLButtonElement>('.binary-answer')!
  expect(button.disabled).toBe(false)
  await act(async()=>button.click())
  expect(answer).toHaveBeenCalledWith('the man',{heard:false,plays:1,assisted:true})
 }finally{await act(async()=>root.unmount())}
})

it('does not restart or cancel speech when classroom polling returns a fresh copy of the same question',async()=>{
 const host=document.createElement('div'),root=createRoot(host),answer=vi.fn(),turn={id:'stable-turn',learner:'student',questionId:question.id,english:question.document.english,choices:question.choices,answer:null,correct:null,scores:{}}
 try{
  await act(async()=>root.render(<GeneratedClassroomPractice question={question} turn={turn} onAnswer={answer}/>))
  for(let poll=0;poll<5;poll++)await act(async()=>root.render(<GeneratedClassroomPractice question={{...question,document:{...question.document}}} turn={{...turn}} onAnswer={answer}/>))
  expect(playback.calls).toBe(1);expect(playback.stops).toBe(0)
  await act(async()=>playback.callbacks!.ended())
  expect(playback.calls).toBe(1)
 }finally{await act(async()=>root.unmount())}
})
