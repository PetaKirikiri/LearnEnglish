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
