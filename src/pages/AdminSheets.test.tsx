import { act } from 'react'
import { createRoot,type Root } from 'react-dom/client'
import { afterEach,beforeEach,expect,it,vi } from 'vitest'
import MembersTablePage from './MembersTablePage'
import QuestionsTablePage from './QuestionsTablePage'
import { orderedQuestionBank, questionExampleCount } from '../learning/questionSheet'
import { createPracticeRound } from '../learning/quizContent'
it('previews the next focus pair together with earlier targets for review',()=>{
  act(()=>root.render(<QuestionsTablePage/>))
  const view=container.querySelector('select')!
  act(()=>{view.value='round';view.dispatchEvent(new Event('change',{bubbles:true}))})
  const pair=container.querySelector<HTMLInputElement>('input[aria-label="Focus pair"]')!
  act(()=>{
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!
    setter.call(pair,'2')
    pair.dispatchEvent(new Event('input',{bubbles:true}))
    pair.dispatchEvent(new Event('change',{bubbles:true}))
  })
  const targets=[...container.querySelectorAll('tbody tr')].map(row=>row.querySelectorAll('td')[2].textContent)
  expect(targets.filter(target=>target==='the'||target==='a')).toHaveLength(3)
  expect(targets).toContain('the')
  expect(targets).toContain('a')
  expect(new Set(targets.filter(target=>target!=='the'&&target!=='a')).size).toBe(2)
})
const {rpc}=vi.hoisted(()=>({rpc:vi.fn()}))
vi.mock('../lib/supabase',()=>({supabase:{rpc}}))
let root:Root,container:HTMLDivElement
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});container=document.createElement('div');root=createRoot(container);vi.clearAllMocks()})
afterEach(()=>{act(()=>root.unmount())})
it('shows joined members even if they have never answered a question',async()=>{
  rpc.mockResolvedValue({data:[{id:'1',name:'New member',firstSeen:'2026-09-13T00:00:00Z',lastActive:null,logins:0,answers:0,correct:0,weeklyPoints:0,groups:[{name:'Friends',joinedAt:'2026-09-13T00:00:00Z'}]}],error:null})
  await act(async()=>root.render(<MembersTablePage/>))
  expect(container.querySelectorAll('tbody tr')).toHaveLength(1)
  expect(container.textContent).toContain('New member')
  expect(container.textContent).toContain('Friends')
  expect(container.querySelector('h1,select')).toBeNull()
  expect(container.querySelector('button')?.getAttribute('aria-label')).toBe('Open New member profile')
  expect(container.querySelector('input')?.getAttribute('placeholder')).toBe('Search')
  expect(container.textContent).not.toMatch(/People who|Dates are|members shown|Filter group/)
  expect(container.querySelectorAll('tbody td')[4].textContent).toBe('0')
})
it('does not fabricate members when access or network fails',async()=>{
  rpc.mockResolvedValue({data:null,error:{message:'Forbidden'}})
  await act(async()=>root.render(<MembersTablePage/>))
  expect(container.querySelector('[role="alert"]')).toBeTruthy()
  expect(container.querySelectorAll('tbody tr')).toHaveLength(0)
})
it('renders the complete ordered bank and previews the same round as the learner',()=>{
  act(()=>root.render(<QuestionsTablePage/>))
  expect(container.querySelectorAll('tbody tr')).toHaveLength(orderedQuestionBank().length)
  const view=container.querySelector('select')!
  act(()=>{view.value='round';view.dispatchEvent(new Event('change',{bubbles:true}))})
  const rows=[...container.querySelectorAll('tbody tr')]
  expect(rows).toHaveLength(10)
  expect(rows.map(r=>r.querySelector('.question-cell')?.textContent)).toEqual(createPracticeRound().map(q=>q.prompt))
  rows.forEach((row,index)=>{
    const q=createPracticeRound()[index]
    const cells=row.querySelectorAll('td')
    expect(cells[3].className).toBe('other-options-cell')
    expect(cells[3].textContent).toBe(q.choices.filter(choice=>choice!==q.answer).join(' · '))
    expect(cells[4].textContent).toBe(q.answer)
    expect(cells[7].textContent).toBe(String(questionExampleCount(q)))
  })
})
