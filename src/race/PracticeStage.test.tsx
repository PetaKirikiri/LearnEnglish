import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
import PracticeStage from './PracticeStage'
it('places replay beside help and keeps classroom progression with the teacher',async()=>{
 const host=document.createElement('div'),root=createRoot(host),replay=vi.fn()
 await act(async()=>root.render(<PracticeStage question="Question" prompt="Listen, then choose" correct={null} onNext={()=>{}} onReplay={replay} teacherControlled explanation={()=>null} answers={{choices:[{id:'a',label:'A',content:'A'},{id:'b',label:'B',content:'B'}],selected:null,disabled:false,onChoose:()=>{}}}/>))
 const controls=host.querySelector('.foundation-controls')!
 expect(controls.querySelector('.foundation-help')?.nextElementSibling?.className).toBe('foundation-replay');expect(controls.querySelector('.foundation-next')).toBeNull();expect(host.textContent).not.toContain('👆')
 await act(async()=>controls.querySelector<HTMLButtonElement>('.foundation-replay')!.click());expect(replay).toHaveBeenCalledOnce()
 await act(async()=>root.unmount())
})

it('keeps every authored grammar card in the shared fitting stage, including faded cards',async()=>{
 const {default:LanguageQuadrant}=await import('../learning/sentenceMatrix/LanguageQuadrant')
 const {actionDialogue}=await import('../learning/sentenceRules/actionDialogue')
 const {generatedNumberCatalogue}=await import('./numberCatalogue')
 const document={...actionDialogue('i','holding',{vocabulary:generatedNumberCatalogue,object:'a bag',determiner:'the',description:{english:'red',thai:'สีแดง'}}).answer,construction:'action-answer' as const}
 const host=window.document.createElement('div'),root=createRoot(host)
 const question=<div className="classroom"><div className="cw-sentence-board"><LanguageQuadrant scores={{'en:the':25,'en:bag':25}} request={{document,presentation:{fadeMode:true,keepIconsWhenFading:true,audio:false,wordPicker:false,explanations:false}}}/></div></div>
 const props={question,prompt:'Choose',correct:null,onNext:()=>{},explanation:()=>null,answers:{choices:[{id:'a',label:document.english,content:question},{id:'b',label:document.english,content:question}] as const,selected:null,disabled:false,onChoose:()=>{}}}
 await act(async()=>root.render(<PracticeStage {...props}/>))
 expect(host.querySelectorAll('.assessment-sentence-viewport')).toHaveLength(3)
 const matrix=host.querySelector('.practice-question .matrix-layout')!
 expect(matrix.getAttribute('data-adaptive')).toBe('true')
 expect(matrix.querySelectorAll('.tonight-slot')).toHaveLength(6)
 expect(Array.from(matrix.querySelectorAll('.example-source')).map(e=>e.textContent)).toEqual(['I','am','holding','the','red','bag.'])
 await act(async()=>root.unmount())
})

it('waits for a separate complete tap after answering and clears the continuation surface for the next question',async()=>{
 const host=document.createElement('div'),root=createRoot(host),next=vi.fn(),replay=vi.fn(),choose=vi.fn()
 const render=async(correct:boolean|null,teacherControlled=false)=>act(async()=>root.render(<PracticeStage question="Question" prompt="Choose" correct={correct} onNext={next} onReplay={replay} teacherControlled={teacherControlled} explanation={close=><div role="dialog"><button onClick={close}>Close</button></div>} answers={{choices:[{id:'a',label:'A',content:'A'},{id:'b',label:'B',content:'B'}],selected:correct===null?null:0,disabled:correct!==null,onChoose:choose}}/>))
 await render(null)
 expect(host.querySelector('.foundation-next')).toBeNull()
 expect(host.querySelector('.practice-continue-surface')).toBeNull()
 await act(async()=>host.querySelector<HTMLButtonElement>('.binary-answer')!.click())
 expect(choose).toHaveBeenCalledOnce();expect(next).not.toHaveBeenCalled()
 await render(true)
 await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-replay')!.click())
 expect(replay).toHaveBeenCalledOnce();expect(next).not.toHaveBeenCalled()
 await act(async()=>host.querySelector<HTMLButtonElement>('.foundation-help')!.click())
 expect(host.querySelector('.practice-continue-surface')).toBeNull()
 await act(async()=>host.querySelector<HTMLButtonElement>('[role="dialog"] button')!.click())
 await act(async()=>host.querySelector<HTMLButtonElement>('.practice-continue-surface')!.click())
 expect(next).toHaveBeenCalledOnce();expect(choose).toHaveBeenCalledOnce()
 await render(null)
 expect(host.querySelector('.practice-continue-surface')).toBeNull()
 expect(host.querySelector('[aria-pressed="true"]')).toBeNull()
 await render(false)
 expect(host.querySelector('.practice-continue-surface')).not.toBeNull()
 await render(true,true)
 expect(host.querySelector('.practice-continue-surface')).toBeNull()
 await act(async()=>root.unmount())
})
