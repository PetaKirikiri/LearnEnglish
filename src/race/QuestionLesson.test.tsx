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
 expect(seven).toHaveLength(20)
 expect(seven.slice(0,8).map(q=>q.document.english)).toEqual(['What','Who','Where','When','Which','Whose','Why','How'])
 expect(eight).toHaveLength(19)
 expect(eight.map(q=>q.document.english)).toEqual(general.map(q=>q.document.english))
 expect(eight.some(q=>q.document.english==='Where are you going?')).toBe(true)
 expect(seven.map(q=>q.document.english)).toEqual(expect.arrayContaining(['What is it called','What is she doing','How is Som feeling','How many','How long','How often']))
 for(const q of seven){
  expect(q.document.units.map(unit=>unit.english)).toEqual(q.document.english.split(' '))
  for(const unit of [...q.document.units,...q.alternatives!.flatMap(d=>d.units)])expect(unit.artwork).toBeDefined()
 }
 const duration=seven.find(q=>q.document.english==='How long')!
 expect(duration.choices).toEqual(['2 hours','School'])
 expect(duration.alternatives![0].units.map(u=>[u.english,u.artwork])).toEqual([
  ['2',{numeral:2}],['hours',{src:'/classroom/icons/question-deck/how-long.webp'}],
 ])
 const distance=seven.find(q=>q.document.english==='How far')!
 expect(distance.choices).toEqual(['5 kilometres','Happy'])
 expect(distance.alternatives![0].units.map(u=>u.artwork)).toEqual([{numeral:5},{src:'/classroom/icons/question-deck/kilometre-unit.svg'}])
 const helping=eight.find(q=>q.document.english==='Who is helping Som?')!
 expect(helping.choices).toEqual(['The teacher is helping Som.','Som is at school.'])
 expect(helping.alternatives![0].units.map(u=>u.english)).toEqual(['The','teacher','is','helping','Som.'])
 for(const q of [...seven,...eight].filter(q=>q!==duration&&q!==distance&&q!==helping))expect(q.choices.every(word=>/^\S+$/.test(word))).toBe(true)
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
  expect(prompt.querySelector('svg image[href*="what.png"]')).not.toBeNull()
  const buttons=host.querySelectorAll<HTMLButtonElement>('.binary-answer')
  expect(buttons).toHaveLength(2)
  expect(host.querySelectorAll('.practice-answer-area .picture-sentence')).toHaveLength(2)
  await act(async()=>buttons[0].click())
  expect(record.mock.calls.map(c=>c[0])).toEqual(expect.arrayContaining([
   expect.objectContaining({questionId:'daily-question-7-interrogative-What',answer:expect.any(String),modality:'visible'}),
  ]))
  const snapshot=JSON.parse(localStorage.getItem('englishsuccess:question-lesson:v3:learner:7')!)
  expect(snapshot.picked).toBe(0)
  expect(snapshot.streaks).toHaveLength(2)
  await act(async()=>root.render(<QuestionLesson level={8} userId="learner" onExit={vi.fn()} onComplete={vi.fn()}/>))
  expect(host.querySelector('.practice-question')?.textContent).toContain('name?')
  expect(host.querySelector('.practice-question .example-source')).not.toBeNull()
 }finally{await act(async()=>root.unmount());host.remove()}
})

it.each([7,8] as const)('requires two consecutive correct answers per type in level %i',async(level)=>{
 const host=document.createElement('div'),root=createRoot(host)
 const key=level===7?'englishsuccess:question-lesson:v3:learner:7':'englishsuccess:question-lesson:v2:learner:8'
 const saved=()=>JSON.parse(localStorage.getItem(key)!)
 const seed=(index:number,streaks:number[])=>localStorage.setItem(key,JSON.stringify({
  index,streaks,score:0,attempts:0,picked:null,id:crypto.randomUUID(),startedAt:new Date().toISOString()
 }))
 const render=async()=>{await act(async()=>root.render(<QuestionLesson level={level} userId="learner" onExit={vi.fn()} onComplete={vi.fn()}/>))}
 const answer=async(correct:boolean)=>{
  const side=Number(parseInt(saved().id[0],16)%2===1)
  await act(async()=>host.querySelectorAll<HTMLButtonElement>('.binary-answer')[correct?side:1-side].click())
  await act(async()=>host.querySelector<HTMLButtonElement>('.practice-continue-surface')!.click())
 }
 try{
  vi.spyOn(Math,"random").mockReturnValue(0.25)
  seed(0,[1,2])
  await render()
  await answer(false)
  expect(saved().streaks).toEqual([0,2])
  for(let i=0;i<4;i++)await answer(true)
  expect(saved()).toMatchObject({index:2,streaks:[2,2,0]})
  await answer(true)
  await answer(true)
  await answer(true)
  expect(saved()).toMatchObject({index:3,streaks:[2,2,2,0]})
 }finally{vi.restoreAllMocks();await act(async()=>root.unmount())}
})
