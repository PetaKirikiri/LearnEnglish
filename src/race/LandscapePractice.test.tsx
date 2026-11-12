// @vitest-environment happy-dom
import {act,useEffect,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {afterEach,expect,it,vi} from 'vitest'
import {readFileSync} from 'node:fs'
const native=vi.hoisted(()=>({expanded:false,enter:vi.fn()}))
vi.mock('../city/fullscreen',()=>({controllerExpanded:()=>native.expanded,enterControllerFullscreen:native.enter}))
import LandscapePractice from './LandscapePractice'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
afterEach(()=>{vi.unstubAllGlobals();native.enter.mockReset();native.expanded=false})
it('keeps a usable forced landscape canvas in LINE even without fullscreen or orientation APIs',async()=>{
 vi.stubGlobal('navigator',{userAgent:'iPhone Line/14.0.0'})
 native.enter.mockResolvedValue('unsupported')
 const host=document.createElement('div'),root=createRoot(host),choose=vi.fn()
 try{
  await act(async()=>root.render(<LandscapePractice><button onClick={choose}>Answer</button></LandscapePractice>))
  expect(host.querySelector('.practice-landscape-frame')).not.toBeNull()
  expect(host.textContent).not.toMatch(/turn|rotate|portrait/i)
  await act(async()=>host.querySelector('button')!.click())
  expect(native.enter).toHaveBeenCalledOnce();expect(choose).toHaveBeenCalledOnce()
  expect(host.querySelector('.practice-landscape-frame button')).not.toBeNull()
  await act(async()=>host.querySelector('button')!.click())
  expect(native.enter).toHaveBeenCalledOnce();expect(choose).toHaveBeenCalledTimes(2)
 }finally{await act(async()=>root.unmount())}
})
it('does not remount the question or reset its answer when the viewport rotates',async()=>{
 const mounted=vi.fn(),host=document.createElement('div'),root=createRoot(host)
 function Question(){const [picked,setPicked]=useState(false);useEffect(()=>{mounted()},[]);return <button onClick={()=>setPicked(true)}>{picked?'Answered':'Choose'}</button>}
 native.enter.mockResolvedValue('denied')
 try{
  await act(async()=>root.render(<LandscapePractice><Question/></LandscapePractice>))
  await act(async()=>host.querySelector('button')!.click())
  await act(async()=>{window.dispatchEvent(new Event('resize'));window.dispatchEvent(new Event('orientationchange'))})
  expect(mounted).toHaveBeenCalledOnce();expect(host.textContent).toBe('Answered')
 }finally{await act(async()=>root.unmount())}
})
it('never rotates or enters fullscreen for the teacher screen',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<LandscapePractice enabled={false}><button>Teacher</button></LandscapePractice>))
  expect(host.querySelector('.practice-landscape-viewport')).toBeNull()
  await act(async()=>host.querySelector('button')!.click());expect(native.enter).not.toHaveBeenCalled()
 }finally{await act(async()=>root.unmount())}
})
it('forces rotated portrait dimensions and applies compact fitting to the logical landscape canvas',()=>{
 const css=readFileSync('src/race/landscapePractice.css','utf8')
 expect(css).toMatch(/@media\(orientation:portrait\)/)
 expect(css).toContain('width:100dvh;height:100dvw')
 expect(css).toContain('rotate(90deg)')
 expect(css).toContain('@container forced-practice (max-height:600px)')
 expect(css).toContain('.practice-pattern-dialog')
})
