import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import QuizPage from './QuizPage'
import { buildWordCollection } from './wordCollection'
import { getQuizCatalogue } from './quizContent'
import { examPracticeQuestions } from './examPracticeContent'
import { trackProgress } from './progressSync'
import { speakEnglish } from './speech'
import type { ProgressEvent } from './progressData'
const state=vi.hoisted(()=>({events:[] as ProgressEvent[]}))
vi.mock('./useWordCollection',()=>({useWordCollection:()=>{const bank=getQuizCatalogue();return {events:state.events,collection:buildWordCollection(state.events,[...bank.vocabulary,...bank.sentences],Date.now()),ready:true,serverReady:true,error:false}}}))
vi.mock('./progressSync',()=>({trackProgress:vi.fn((learnerId:string,kind:ProgressEvent['kind'],payload:ProgressEvent['payload'],id?:string)=>{state.events.push({id:id??crypto.randomUUID(),learner_id:learnerId,kind,payload,occurred_at:new Date().toISOString()})}),pending:()=>[],loadLearnerEvents:async()=>[]}))
vi.mock('../lib/supabase',()=>({supabase:null}))
vi.mock('./LeaderboardButton',()=>({default:()=>null}))
vi.mock('./QuestionFlag',()=>({default:()=>null}))
vi.mock('./speech',()=>({canSpeakEnglish:()=>true,speakEnglish:vi.fn(),stopEnglishSpeech:vi.fn()}))
vi.mock('./WordHelp',()=>({default:({text}:{text:string})=><span>{text}</span>}))
let root:Root,container:HTMLDivElement
beforeEach(()=>{vi.clearAllMocks();localStorage.clear();state.events=[];Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});container=document.createElement('div');document.body.append(container);root=createRoot(container);act(()=>root.render(<QuizPage learnerId="QA" userId="qa" onSignOut={()=>{}}/>))})
afterEach(()=>{act(()=>root.unmount());container.remove()})
function click(text:string){const button=[...container.querySelectorAll('button')].find(b=>b.textContent===text || (text==='ทดสอบ 40 ข้อ'&&b.textContent?.startsWith(text)));expect(button).toBeTruthy();act(()=>button!.click())}
it('uses the same dark exercise card for a 40-question assessment without revealing correctness or answer audio',()=>{
 click('Your profile');expect(container.querySelector('.game-surface')).toBeTruthy();click('ทดสอบ 40 ข้อ')
 const start=vi.mocked(trackProgress).mock.calls.find(c=>c[1]==='visit')!
 expect(start[2]?.assessmentQuestionIds).toHaveLength(40)
 const questions=start[2]!.assessmentQuestionIds!.map(id=>examPracticeQuestions.find(q=>q.id===id)!)
 for(const [index,q] of questions.entries()){
  expect(container.querySelector('.question-meta')?.textContent).toContain(`${index+1} / 40`)
  expect(vi.mocked(speakEnglish).mock.calls.at(-1)?.[0]).toBe(q.prompt)
  const choice=q.choices.find(c=>c!==q.answer)!
  const option=[...container.querySelectorAll<HTMLButtonElement>('.answer-option')].find(b=>b.textContent===choice)!
  act(()=>option.click())
  expect(container.querySelector('[data-state="correct"], [data-state="incorrect"]')).toBeNull()
  expect(container.textContent).not.toContain('Correct answer:')
  expect(container.textContent).not.toContain('Why?')
  expect(container.querySelector('[data-state="chosen"]')?.textContent).toBe(choice)
  expect(vi.mocked(speakEnglish).mock.calls.at(-1)?.[0]).toBe(q.prompt)
  click(index===39?'ดูผล':'Next')
 }
 expect(vi.mocked(trackProgress).mock.calls.filter(c=>c[1]==='answer'&&c[2]?.assessment)).toHaveLength(40)
 expect(container.querySelector('.learner-profile')).toBeTruthy()
 expect(container.querySelector('.exam-progress')?.textContent).toContain('0 / 40')
})
