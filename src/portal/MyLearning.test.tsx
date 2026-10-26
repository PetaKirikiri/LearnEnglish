// @vitest-environment happy-dom
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import MyLearning from './MyLearning'
import type { ListeningCourse } from '../hotel/HotelPage'
import { classOneLesson, classOneSkill } from './classOne'
const store=vi.hoisted(()=>({readLessons:vi.fn(),saveLesson:vi.fn()}))
vi.mock('./lessons',async importOriginal=>({...await importOriginal<typeof import('./lessons')>(),...store}))
vi.mock('../hotel/HotelPage',()=>({HotelLesson:({active,course}:{active:boolean;course:ListeningCourse})=>{const [answered,setAnswered]=useState(0);return <div data-practice-active={active} data-skills={course.skills?.join(',')}><button onClick={()=>setAnswered(n=>n+1)}>Listening practice {answered}</button></div>}}))
vi.mock('../curriculum/CurriculumPage',()=>({default:({initialView,referenceOnly}:{initialView:string;referenceOnly:boolean})=><div data-reference={referenceOnly}>{initialView}</div>}))
vi.mock('../hotel/HotelContentPage',()=>({default:()=> <div>Answer content</div>}))
vi.mock('./LessonDocument',()=>({default:()=> <div>Custom lesson editor</div>}))
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
const host=document.createElement('div');document.body.append(host)
let root=createRoot(host)
const rows=[{id:'e3139a00-2222-4333-8444-a12345678901',number:1,title:'Published lesson',date:'2026-10-24',document:'https://docs.google.com/document/d/real-link/edit',skills:['x'],published:true},{id:'e3139a00-2222-4333-8444-a12345678902',number:2,title:'Draft lesson',date:'',document:'',skills:['x'],published:false}]
const course={} as ListeningCourse
it('routes Class 1 homework to its own everyday question bank',async()=>{
  location.href=`http://localhost:5185/english/preview/learning?view=homework&lesson=${classOneLesson.id}`
  store.readLessons.mockResolvedValue([classOneLesson])
  await act(async()=>{root.render(<MyLearning userId="test" teacher={false} preview course={course}/>);await new Promise(resolve=>setTimeout(resolve,0))})
  expect(host.querySelector('[data-practice-active]')?.getAttribute('data-skills')).toBe(classOneSkill)
  expect(host.textContent).not.toContain('assigned questions are not available')
})
afterEach(async()=>{await act(()=>root.unmount());root=createRoot(host);vi.clearAllMocks()})
async function render(teacher=false,view='lessons'){
  location.href=`http://localhost:5185/english/preview/learning?view=${view}`
  store.readLessons.mockResolvedValue(rows)
  await act(async()=>{root.render(<MyLearning userId="test" teacher={teacher} preview course={course}/>);await new Promise(resolve=>setTimeout(resolve,0))})
}
it('shows internal lesson documents with specific homework links',async()=>{
  await render()
  expect(host.textContent).toContain('Published lesson')
  expect(host.textContent).not.toContain('Draft lesson')
  expect(host.querySelector(`a[href*="view=document&lesson=${rows[0].id}"]`)).not.toBeNull()
  expect(host.querySelector('a[href*="docs.google.com"]')).toBeNull()
  expect(host.querySelector(`a[href*="lesson=${rows[0].id}"]`)).not.toBeNull()
  expect(host.textContent).not.toContain('Add lesson')
  expect(host.querySelector('nav')?.textContent).not.toContain('Content')
  expect(host.querySelector('.portal-lessons .portal-number')?.textContent).toBe('01')
  expect(host.textContent).toContain('Lesson notes')
  expect(host.textContent).not.toContain('Local preview')
  expect(host.querySelector('.my-learning-nav img')?.getAttribute('src')).toBe('/images/learning-nav/lessons-v1.png')
})
it('keeps teacher tools and drafts available to the teacher',async()=>{
  await render(true)
  expect(host.textContent).toContain('Draft lesson')
  expect(host.querySelector('.portal-lessons small')).toBeNull()
  expect(host.textContent).toContain('Add lesson')
  expect(host.querySelector('nav')?.textContent).toContain('Content')
})
it('does not expose content by changing the view query as a student',async()=>{
  await render(false,'content')
  expect(host.textContent).not.toContain('Answer content')
  expect(host.textContent).toContain('Published lesson')
})
it.each([false,true])('opens vocabulary in learner reference mode even for teachers (%s)',async(teacher)=>{
  await render(teacher,'vocabulary')
  expect(host.querySelector('[data-reference="true"]')?.textContent).toBe('vocabulary')
})
it('never invents preview leaderboard scores',async()=>{
  await render(false,'leaderboard')
  expect(host.textContent).toContain('Sign in on the live site to see real scores.')
  expect(host.querySelector('tbody')).toBeNull()
})
it('embeds homework and preserves the attempt when moving to lessons and back',async()=>{
  await render(false,'homework')
  const practice=host.querySelector<HTMLButtonElement>('[data-practice-active] button')!
  await act(()=>practice.click())
  expect(practice.textContent).toBe('Listening practice 1')
  await act(()=>host.querySelector<HTMLAnchorElement>('[aria-label="Back to My learning"]')!.click())
  expect(host.querySelector('.portal-homework')?.hasAttribute('hidden')).toBe(true)
  expect(host.querySelector('[data-practice-active]')?.getAttribute('data-practice-active')).toBe('false')
  expect(host.querySelector('h1')?.textContent).toBe('Lessons')
  await act(()=>host.querySelector<HTMLAnchorElement>('nav a[href*="view=homework"]')!.click())
  expect(host.querySelector('.portal-homework')?.hasAttribute('hidden')).toBe(false)
  expect(host.querySelector('[data-practice-active] button')).toBe(practice)
  expect(practice.textContent).toBe('Listening practice 1')
  expect(host.querySelector('iframe')).toBeNull()
})
it('responds to browser history without leaving the learning shell',async()=>{
  await render(false,'homework')
  await act(()=>{history.pushState(null,'','?view=vocabulary');window.dispatchEvent(new PopStateEvent('popstate'))})
  expect(host.querySelector('h1')?.textContent).toBe('Vocabulary')
  expect(host.querySelector('.portal-homework')?.hasAttribute('hidden')).toBe(true)
})
it.each(['homework','vocabulary','structures','leaderboard','content','document'])('reclaims navigation space inside %s',async(view)=>{
  await render(true,view)
  expect(host.querySelector('.my-learning-nav')).toBeNull()
  expect(host.querySelector('.english-learning-app.is-focused')).not.toBeNull()
  const back=host.querySelector<HTMLAnchorElement>('[aria-label="Back to My learning"]')!
  expect(back).not.toBeNull()
  await act(()=>back.click())
  expect(host.querySelector('.my-learning-nav')).not.toBeNull()
  expect(host.querySelector('.english-learning-app.is-focused')).toBeNull()
})
