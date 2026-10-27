// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it} from 'vitest'
import ListeningMatrix from './ListeningMatrix'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('freezes support for the question, retains words in layout, and offers no reveal',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 await act(async()=>root.render(<ListeningMatrix sentence="Where are my shoes?" scores={{'en:where':25,'en:are':15,'en:shoes':25}} settings={{fadeMode:true}}/>))
 expect(host.querySelector<HTMLElement>('[data-word=where]')?.style.opacity).toBe('0')
 expect(host.querySelector<HTMLElement>('[data-word=are]')?.style.opacity).toBe('0.5')
 expect(host.querySelector<HTMLElement>('[data-word=shoes]')?.style.opacity).toBe('0')
 expect(host.querySelector('[data-word=shoes]')?.textContent).toBe('shoes?')
 expect(host.querySelectorAll('button,[title]')).toHaveLength(0)
 await act(async()=>root.render(<ListeningMatrix sentence="Where are my shoes?" scores={{'en:where':1}} settings={{fadeMode:true}}/>))
 expect(host.querySelector<HTMLElement>('[data-word=where]')?.style.opacity).toBe('0')
 await act(async()=>root.render(<ListeningMatrix sentence="Where are my shoes?" scores={{'en:where':25}} settings={{fadeMode:false}}/>))
 expect(host.querySelector<HTMLElement>('[data-word=where]')?.style.opacity).toBe('1')
 await act(async()=>root.unmount())
})
