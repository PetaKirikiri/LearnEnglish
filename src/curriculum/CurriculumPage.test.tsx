// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import CurriculumPage from './CurriculumPage'
import { installCurriculum } from './database'
import snapshot from './syllabus.snapshot.json'

Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('shows reusable patterns under each topic without curriculum metadata',async()=>{
  installCurriculum(snapshot)
  const host=document.createElement('div'),root=createRoot(host)
  await act(()=>root.render(<CurriculumPage referenceOnly/>))
  expect(host.querySelector('.curriculum-search')).toBeNull()
  expect(host.textContent).toContain('She calls me.')
  expect(host.querySelector('[lang="th"]')).not.toBeNull()
  expect(host.querySelectorAll('.curriculum-topic .curriculum-pattern')).toHaveLength(snapshot.structures.length)
  expect(host.querySelector('.curriculum-pattern')?.getAttribute('aria-label')).toBe('[subject pronoun] [verb] [object pronoun]')
  expect(host.querySelector('.pattern-fixed')?.textContent).toBe('gave')
  expect(host.querySelector('[aria-label="Patterns for Who acts; who receives"]')?.textContent).toContain('asked')
  for(const selector of ['.curriculum-focus','.curriculum-frames','.curriculum-teaching','.curriculum-word-list','.curriculum-references','.curriculum-section summary small'])expect(host.querySelector(selector)).toBeNull()
  expect(host.querySelector('a[href*="focus="]')).toBeNull()
  expect(host.querySelector('.curriculum-tabs')).toBeNull()
  await act(()=>root.render(<CurriculumPage key="vocabulary" initialView="vocabulary" referenceOnly/>))
  expect(host.querySelector('.curriculum-search')?.getAttribute('placeholder')).toBe('Find a word')
  expect([...host.querySelectorAll('th')].map(el=>el.textContent)).toEqual(['Word','Thai meaning'])
  expect(host.querySelector('.curriculum-note')).toBeNull()
  expect(host.querySelectorAll('tbody tr')).toHaveLength(snapshot.vocabulary.length)
  await act(()=>root.unmount())
})
it('shows actual patterns, Thai examples, vocabulary and filtered question links', async()=>{
  installCurriculum(snapshot)
  window.location.href='http://localhost/hotel/preview/curriculum'
  const host=document.createElement('div'), root=createRoot(host)
  await act(()=>root.render(<CurriculumPage/>))
  expect(host.querySelectorAll('.curriculum-section')).toHaveLength(snapshot.structures.length)
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
