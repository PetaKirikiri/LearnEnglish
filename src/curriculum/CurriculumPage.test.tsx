// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import CurriculumPage from './CurriculumPage'
import { installCurriculum } from './database'
import snapshot from './syllabus.snapshot.json'

Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('shows actual patterns, Thai examples, vocabulary and filtered question links', async()=>{
  installCurriculum(snapshot)
  window.location.href='http://localhost/hotel/preview/curriculum'
  const host=document.createElement('div'), root=createRoot(host)
  await act(()=>root.render(<CurriculumPage/>))
  expect(host.querySelectorAll('.curriculum-section')).toHaveLength(34)
  expect(host.querySelector('a[href="/hotel/preview/content?focus=participants"]')).not.toBeNull()
  expect(host.textContent).toContain('not CEFR certification')
  expect(host.textContent).toContain('She calls me.')
  expect(host.textContent).toContain('[subject pronoun] [verb] [object pronoun]')
  const vocab=host.querySelectorAll<HTMLButtonElement>('.curriculum-tabs button')[1]
  await act(()=>vocab.click())
  expect(host.querySelectorAll('tbody tr')).toHaveLength(snapshot.vocabulary.length)
  expect(host.textContent).toContain('เธอ')
  await act(()=>host.querySelector<HTMLButtonElement>('.curriculum-tabs button')!.click())
  const select=host.querySelector('select')!
  await act(()=>{select.value='C1';select.dispatchEvent(new Event('change',{bubbles:true}))})
  expect(host.querySelectorAll('.curriculum-section')).toHaveLength(3)
  expect(host.textContent).toContain('Only after [event] did [subject] [base verb]')
  await act(()=>root.unmount())
})
