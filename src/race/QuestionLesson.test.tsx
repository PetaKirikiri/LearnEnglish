// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {renderToStaticMarkup} from 'react-dom/server'
import LanguageQuadrant from '../learning/sentenceMatrix/LanguageQuadrant'
import {existsSync} from 'node:fs'
import {beforeEach,expect,it,vi} from 'vitest'
const {record}=vi.hoisted(()=>({record:vi.fn()}))
vi.mock('../learning/wordProgress/useWordProgress',()=>({useWordProgress:()=>({ready:true,error:'',scores:{'en:what':15},record,retry:vi.fn()})}))
vi.mock('./PracticeGold',()=>({default:()=>null,awardPracticeGold:vi.fn()}))
vi.mock('../audio/sentenceAudio',()=>({playTimedSentence:()=>()=>{},prepareSentenceAudio:()=>Promise.resolve()}))
import QuestionLesson from './QuestionLesson'
import {generalQuestionDeck,questionLessonDeck} from '../pages/generalQuestionDeck'
import {canonicalPracticeQuestion} from '../../server/practiceQuestionCatalogue'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
beforeEach(()=>{localStorage.clear();record.mockClear()})

it('includes every distinct picture cue in day 7 and all full questions in day 8, with stable canonical scoring',()=>{
 const seven=questionLessonDeck(7),eight=questionLessonDeck(8),general=generalQuestionDeck()
 expect(seven).toHaveLength(17)
 expect(eight).toHaveLength(19)
 expect(eight.map(q=>q.document.english)).toEqual(general.map(q=>q.document.english))
 expect(eight.some(q=>q.document.english==='Where are you going?')).toBe(true)
 expect(new Set(seven.map(q=>q.document.english))).toEqual(new Set(eight.map(q=>q.targetWords[0])))
 const artwork=new Set<string>()
 for(const q of [...seven,...eight]){
  expect(q.choices).toHaveLength(2)
  expect(q.choices[0]).not.toEqual(q.choices[1])
  expect(canonicalPracticeQuestion(q.id)).toEqual(q)
  expect(()=>renderToStaticMarkup(<LanguageQuadrant request={{document:q.document,presentation:{english:!q.id.startsWith('daily-question-7-'),icons:true}}}/>)).not.toThrow()
  for(const unit of [q.document,...q.alternatives!].flatMap(d=>d.units))if(unit.artwork&&'src' in unit.artwork)artwork.add(unit.artwork.src)
 }
 for(const src of artwork)expect(existsSync('public'+src),src).toBe(true)
 expect(canonicalPracticeQuestion('daily-question-7-fake')).toBeUndefined()
})

it('renders the shared landscape and two illustrated answers, hides day 7 captions and queues account progress',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 document.body.append(host)
 try{
  await act(async()=>root.render(<QuestionLesson level={7} userId="learner" onExit={vi.fn()} onComplete={vi.fn()}/>))
  expect(host.querySelector('.practice-landscape-frame')).not.toBeNull()
  const prompt=host.querySelector('.practice-question')!
  expect(prompt.textContent).not.toContain('What')
  expect(prompt.querySelector('img[src*="what.png"]')).not.toBeNull()
  const buttons=host.querySelectorAll<HTMLButtonElement>('.binary-answer')
  expect(buttons).toHaveLength(2)
  expect(host.querySelectorAll('.practice-answer-area .picture-sentence')).toHaveLength(2)
  await act(async()=>buttons[0].click())
  expect(record.mock.calls.map(c=>c[0])).toEqual(expect.arrayContaining([
   expect.objectContaining({questionId:'daily-question-7-interrogative-What',answer:expect.any(String),modality:'visible'}),
  ]))
  const snapshot=JSON.parse(localStorage.getItem('englishsuccess:question-lesson:v1:learner:7')!)
  expect(snapshot.picked).toBe(0)
  await act(async()=>root.render(<QuestionLesson level={8} userId="learner" onExit={vi.fn()} onComplete={vi.fn()}/>))
  expect(host.querySelector('.practice-question')?.textContent).toContain('name?')
  expect(host.querySelector('.practice-question .example-source')).not.toBeNull()
 }finally{await act(async()=>root.unmount());host.remove()}
})
