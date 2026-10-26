// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import ClassOneMaterial from './ClassOneMaterial'
const audio=vi.hoisted(()=>({speakEnglish:vi.fn(),stopEnglishSpeech:vi.fn()}))
vi.mock('../learning/speech',()=>audio)
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
const container=document.createElement('div');document.body.append(container)
let root=createRoot(container)
afterEach(async()=>{await act(()=>root.unmount());root=createRoot(container);vi.clearAllMocks()})
it('shows question words first, then vocabulary, then the stable frame with aligned meanings',async()=>{
  await act(()=>root.render(<ClassOneMaterial/>))
  expect([...container.querySelectorAll('h2')].map(h=>h.textContent)).toEqual(['1. Question words','2. People & everyday things','3. Who is this? · What is this?'])
  expect(container.querySelector('button')?.getAttribute('aria-label')).toBe('Listen: Who?')
  expect(container.querySelectorAll('.class-one-example')).toHaveLength(2)
  expect(container.querySelectorAll('.example-gloss')).toHaveLength(4)
  await act(()=>container.querySelector<HTMLButtonElement>('[aria-label="Listen: A person"]')!.click())
  expect(audio.speakEnglish).toHaveBeenCalledWith('A person','/audio/class-one/word-1.wav')
  await act(()=>container.querySelector<HTMLButtonElement>('[aria-label="Listen: Who?"]')!.click())
  expect(audio.speakEnglish).toHaveBeenCalledWith('Who?','/audio/class-one/question-word-1.wav')
  expect(container.querySelector('[aria-label="Listen: Who is this?"]')).toBeTruthy()
  expect(container.textContent).not.toMatch(/in the house|at the door|do we|are the/)
  expect(container.textContent).not.toMatch(/padel|racket|court/i)
})
