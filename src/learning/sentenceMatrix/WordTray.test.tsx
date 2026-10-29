// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import WordTray from './WordTray'
import type { ClassroomWord } from './model'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('combines apple and category filters without changing the sentence until a word is chosen',async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
 const words:ClassroomWord[]=[{word:'shoe',thai:'',categories:['clothing']},{word:'shoes',thai:'',number:'plural',categories:['clothing']},{word:'hotel',thai:'',categories:['places']}]
 const choose=vi.fn()
 const click=async(selector:string)=>act(async()=>host.querySelector<HTMLButtonElement>(selector)!.click())
 const visible=()=>[...host.querySelectorAll('.cw-word-chip')].map(e=>e.getAttribute('data-word'))
 try{
  await act(async()=>root.render(<WordTray id="test" active={3} choices={words} vocabulary={words} selected="hotel" canChoose={()=>true} onChoose={choose} onClose={()=>{}}/>))
  expect(visible()).toEqual(['shoe','shoes','hotel'])
  await click('[aria-label="Plural words"]')
  expect(visible()).toEqual(['shoes'])
  await click('[data-category="places"]')
  expect(visible()).toEqual(['hotel'])
  expect(choose).not.toHaveBeenCalled()
  await click('[data-category="clothing"]')
  await click('[aria-label="Singular words"]')
  expect(visible()).toEqual(['shoe'])
  await click('.cw-word-chip')
  expect(choose).toHaveBeenCalledWith('shoe')
 }finally{await act(async()=>root.unmount());host.remove()}
})
