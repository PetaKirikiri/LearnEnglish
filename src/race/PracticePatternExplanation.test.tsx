// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {beforeEach,afterEach,expect,it,vi} from 'vitest'
import PracticePatternExplanation from './PracticePatternExplanation'
import NumberFoundation from './NumberFoundationCourse'
import {numberDeck} from './numberFoundation'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
beforeEach(()=>{
 localStorage.clear()
 vi.spyOn(HTMLDialogElement.prototype,'showModal').mockImplementation(function(){this.open=true})
 vi.spyOn(HTMLDialogElement.prototype,'close').mockImplementation(function(){this.open=false})
})
afterEach(()=>vi.restoreAllMocks())
it('explains every noun form in every round using matching pictures, endings and agreement',async()=>{
 const host=document.createElement('div');const root=createRoot(host)
 try{
  for(const module of [1,2,3] as const){
   for(const question of numberDeck(module)){
    await act(async()=>root.render(<PracticePatternExplanation question={question} module={module} onClose={()=>{}}/>))
    const dialog=document.querySelector('dialog')!
    expect(dialog.querySelectorAll('.cw-number-example')).toHaveLength(2)
    expect(dialog.querySelector('.cw-number-example.is-current')?.getAttribute('aria-label')).toContain(question.word+':')
    expect(dialog.querySelector('.cw-form-word mark')?.textContent).toBe(question.word.startsWith('watch')?'es':'s')
    expect(dialog.querySelectorAll('.cw-verb-match')).toHaveLength(module===1?0:2)
    expect(dialog.querySelector('.pronunciation-comparison')).not.toBeNull()
    expect(dialog.querySelector('.cw-education-edit')).toBeNull()
   }
  }
 }finally{await act(async()=>root.unmount())}
})
it('reserves controls and opens and closes help without recording or changing an answer',async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
 try{
  await act(async()=>root.render(<NumberFoundation/>))
  const controls=host.querySelector('.foundation-controls')!
  const next=host.querySelector<HTMLButtonElement>('.foundation-next')!
  const help=host.querySelector<HTMLButtonElement>('.foundation-help')!
  expect(controls.hasAttribute('hidden')).toBe(false);expect(next.disabled).toBe(true)
  const progress=host.querySelector('progress')?.value
  help.focus()
  await act(async()=>help.click())
  expect(document.querySelector('dialog')?.open).toBe(true)
  expect(document.body.style.overflow).toBe('hidden')
  await act(async()=>document.querySelector<HTMLButtonElement>('.practice-pattern-close')!.click())
  expect(document.querySelector('dialog')).toBeNull()
  expect(document.activeElement).toBe(help)
  expect(host.querySelector('progress')?.value).toBe(progress)
  expect(next.disabled).toBe(true)
  expect(host.querySelector('.foundation-controls')).toBe(controls)
 }finally{await act(async()=>root.unmount());host.remove()}
})
