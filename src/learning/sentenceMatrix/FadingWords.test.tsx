// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
import ExampleLanguage from './ExampleView'

Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('pulses the active tile for each spoken word while words and icons remain faded',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 const units=[{english:'I',thai:'ฉัน'},{english:'see',thai:'เห็น'},{english:'my dog and my dog.',thai:'สุนัขของฉัน'}]
 const english='I see my dog and my dog.'
 const start=english.lastIndexOf('my')
 const frames:FrameRequestCallback[]=[]
 const request=vi.spyOn(window,'requestAnimationFrame').mockImplementation(callback=>{frames.push(callback);return frames.length})
 const cancel=vi.spyOn(window,'cancelAnimationFrame').mockImplementation(()=>{})
 const settings={audioWave:{level:.8,time:.4},fadeMode:true,keepIconsWhenFading:true,spokenWord:{start,end:start+2}}
 const scores=Object.fromEntries(['i','see','my','dog','and'].map(word=>['en:'+word,25]))
 const details=units.map(()=>({label:'',count:0,icon:<span data-test-icon/>}))
 try{
  await act(async()=>root.render(<ExampleLanguage matrix english={english} thai="" units={units} slotDetails={details} scores={scores} settings={settings}/>))
  const active=host.querySelector<HTMLElement>('.tonight-slot[data-speaking=true]')!
  expect(active).not.toBeNull()
  expect(active.dataset.spokenWord).toBe(String(start))
  expect(host.querySelectorAll('[data-wave-distance]')).toHaveLength(3)
  expect(active.dataset.waveDistance).toBe('0')
  expect(active.style.filter).toBe('')
  expect(active.style.background).toBe('transparent')
  expect(active.style.boxShadow).toBe('none')
  expect(active.style.getPropertyValue('--tile-wave-filter')).toMatch(/^url\(#speech-wave-/)
  const filter=host.querySelector(active.style.getPropertyValue('--tile-wave-filter').slice(4,-1))!
  expect(Number(filter.querySelector('feDisplacementMap')?.getAttribute('scale'))).toBeGreaterThan(.03)
  frames.forEach(callback=>callback(performance.now()+300))
  expect(Number(filter.querySelector('feDisplacementMap')?.getAttribute('scale'))).toBeGreaterThan(.03)
  expect(filter.querySelector('feImage')?.getAttribute('href')).toContain('data:image/svg+xml,')
  expect([...active.querySelectorAll<HTMLElement>('.matrix-fading-word')].every(word=>word.style.opacity==='0')).toBe(true)
  expect(active.querySelector<HTMLElement>('.cw-slot-role')?.style.opacity).toBe('0')
  expect(active.querySelector('.matrix-fading-word[data-speaking]')).toBeNull()
  await act(async()=>root.render(<ExampleLanguage matrix english={english} thai="" units={units} slotDetails={details} scores={scores} settings={{...settings,spokenWord:{start:start+3,end:start+6}}}/>))
  expect(request.mock.calls.length).toBeGreaterThanOrEqual(3)
  expect(cancel).not.toHaveBeenCalled()
  await act(async()=>root.render(<ExampleLanguage matrix english={english} thai="" units={units} scores={scores} settings={{fadeMode:true,spokenWord:null}}/>))
  expect(host.querySelector('.tonight-slot[data-speaking=true]')).toBeNull()
  expect(cancel).toHaveBeenCalled()
 }finally{
  await act(async()=>root.unmount())
  request.mockRestore();cancel.mockRestore()
 }
})

it('deforms only the speaking tile, with independent depth inside a joined phrase',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 const frame=vi.spyOn(window,'requestAnimationFrame').mockReturnValue(1)
 const cancel=vi.spyOn(window,'cancelAnimationFrame').mockImplementation(()=>{})
 try{
  await act(async()=>root.render(<ExampleLanguage matrix english="the man" thai="" units={[{english:'the',thai:''},{english:'man',thai:''}]} semanticSlots={[2,3]} layout={{construction:'noun-phrase',noun:'phrase'}} settings={{fadeMode:true,spokenWord:{start:0,end:3},audioWave:{level:1,time:.1}}}/>))
  const surface=host.querySelector<HTMLElement>('.cw-noun-group')!
  expect(surface.style.filter).toBe('')
  expect(surface.querySelector(':scope > svg')).toBeNull()
  expect(surface.firstElementChild?.classList.contains('tonight-slot')).toBe(true)
  expect(surface.lastElementChild?.classList.contains('tonight-slot')).toBe(true)
  expect(host.querySelector<HTMLElement>('.tonight-slot[data-speaking=true]')?.style.getPropertyValue('--tile-wave-filter')).toMatch(/^url\(#speech-wave-/)
  expect(host.querySelectorAll('.tonight-slot[style*="--tile-wave-filter"]')).toHaveLength(1)
  expect(host.querySelector('[data-audio-wave=true]')).not.toBeNull()
  expect(host.querySelector('feDisplacementMap')?.getAttribute('in')).toBe('SourceGraphic')
 }finally{await act(async()=>root.unmount());frame.mockRestore();cancel.mockRestore()}
})
