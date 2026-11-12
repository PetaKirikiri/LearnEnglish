// @vitest-environment happy-dom
import {act,useRef} from 'react'
import {createRoot} from 'react-dom/client'
import {afterEach,expect,it,vi} from 'vitest'
import useMatrixSizing from './useMatrixSizing'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
afterEach(()=>vi.restoreAllMocks())

it('allocates real space to picker-wrapped cards and rebalances when text changes',async()=>{
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({measureText:(text:string)=>({width:text.length*12})} as CanvasRenderingContext2D)
 vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue({width:900} as DOMRect)
 const host=document.createElement('div'),root=createRoot(host)
 document.body.append(host)
 function Example({text}:{text:string}){
  const ref=useRef<HTMLDivElement>(null)
  useMatrixSizing(ref,true,text)
  const card=(word:string)=><span className="cw-slot-shell"><button className="tonight-slot"><span className="example-source">{word}</span><span className="example-gloss">meaning</span></button><button>Change word</button></span>
  return <div ref={ref}><div className="tonight-slots"><div className="matrix-layout-leading">{card(text)}{card('is')}</div><span className="cw-noun-group">{card('the')}{card('phone')}</span></div></div>
 }
 try{
  await act(async()=>root.render(<Example text="That over there"/>))
  const tracks=(selector:string)=>host.querySelector<HTMLElement>(selector)!.style.gridTemplateColumns.match(/[\d.]+px/g)!.map(parseFloat)
  const long=tracks('.matrix-layout-leading')[0]
  expect(tracks('.cw-noun-group').every(width=>width>70)).toBe(true)
  expect(long).toBeGreaterThan(tracks('.matrix-layout-leading')[1])
  await act(async()=>root.render(<Example text="This"/>))
  expect(tracks('.matrix-layout-leading')[0]).toBeLessThan(long)
 }finally{await act(async()=>root.unmount());host.remove()}
})
