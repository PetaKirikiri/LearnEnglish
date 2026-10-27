// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect,it } from 'vitest'
import WordUsageVisual from './WordUsageVisual'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('shows number agreement without inventing singular forms or plural endings',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 try {
  await act(async()=>root.render(<WordUsageVisual item={{word:'shoes',thai:'รองเท้า',singular:'shoe',plural:'shoes',number:'plural'}}/>))
  expect([...host.querySelectorAll('figure')].map(e=>e.getAttribute('aria-label'))).toEqual(['shoe: is','shoes: are'])
  expect(host.querySelector('mark')?.textContent).toBe('s')
  expect(host.querySelector('.is-current .cw-form-word')?.textContent).toBe('shoes')
  await act(async()=>root.render(<WordUsageVisual item={{word:'glasses',thai:'แว่นตา',pairOnly:true,number:'plural'}}/>))
  expect(host.querySelectorAll('figure')).toHaveLength(1)
  expect(host.querySelector('.cw-verb-match strong')?.textContent).toBe('are')
  expect(host.querySelector('.cw-quantity')?.textContent).toBe('1')
  expect(host.querySelector('mark')).toBeNull()
  await act(async()=>root.render(<WordUsageVisual item={{word:'hotel',thai:'โรงแรม'}}/>))
  expect(host.querySelectorAll('figure')).toHaveLength(1)
  expect(host.querySelector('.cw-form-word')?.textContent).toBe('hotel')
  expect(host.querySelector('.cw-verb-match strong')?.textContent).toBe('is')
 }finally{await act(async()=>root.unmount())}
})
