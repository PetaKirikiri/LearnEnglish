// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
import LessonDocument from './LessonDocument'
vi.mock('./documentSync',()=>({connectDocument:(_doc:unknown,options:{status:(value:string)=>void})=>{options.status('Saved on this device');return ()=>{}}}))
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('opens lesson notes without page management or formatting clutter',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
  try {
    await act(async()=>root.render(<LessonDocument lessonId="lesson" userId="teacher" teacher preview/>))
    expect(host.textContent).not.toContain('Saved on this device')
    expect(host.textContent).not.toContain('Rename page')
    expect(host.querySelector('[aria-label="Add page"]')).toBeNull()
    expect(host.querySelector('[role="tablist"]')).toBeNull()
    expect(host.querySelector('[role="toolbar"]')).toBeNull()
    expect(host.querySelector('[contenteditable]')?.getAttribute('contenteditable')).toBe('false')
    await act(async()=>host.querySelector<HTMLButtonElement>('.document-edit')!.click())
    expect(host.querySelector('[role="toolbar"]')).not.toBeNull()
    expect(host.querySelector('[contenteditable]')?.getAttribute('contenteditable')).toBe('true')
  } finally {await act(()=>root.unmount());host.remove()}
})
