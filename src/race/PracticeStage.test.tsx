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
