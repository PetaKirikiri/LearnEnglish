import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import PronunciationComparison from './PronunciationComparison'
import { readGuide } from './guides'
it('edits and saves a sketch, restores it on reopen and resets when the word changes',async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 localStorage.clear()
 const host=document.createElement('div'),root=createRoot(host)
 const click=async(text:string)=>act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent===text)!.click())
 try {
  await act(async()=>root.render(<PronunciationComparison word="computer"/>))
  expect(host.querySelector('.pronunciation-content')?.hasAttribute('hidden')).toBe(false)
  expect(host.querySelector('.pronunciation-content')?.hasAttribute('hidden')).toBe(false)
  expect(host.querySelectorAll('.pronunciation-side')).toHaveLength(2)
  await click('Edit')
  const dot=host.querySelector('[aria-label="thai: คอม pitch"]')!
  await act(async()=>dot.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true})))
  expect(dot.getAttribute('aria-valuenow')).toBe('55')
  await click('Save')
  expect(readGuide('computer').thai.pitch[0]).toBeCloseTo(.55)
  await act(async()=>root.render(<PronunciationComparison word="hotel"/>))
  expect(host.querySelectorAll('.pronunciation-path.is-unset')).toHaveLength(1)
  expect(host.querySelector('.pronunciation-content')?.hasAttribute('hidden')).toBe(false)
  await act(async()=>root.render(<PronunciationComparison word="computer"/>))
  await click('Edit')
  expect(host.querySelector('[aria-label="thai: คอม pitch"]')?.getAttribute('aria-valuenow')).toBe('55')
  await click('Cancel')
  expect(host.querySelector('[role=slider]')).toBeNull()
 } finally {await act(async()=>root.unmount());localStorage.clear()}
})
