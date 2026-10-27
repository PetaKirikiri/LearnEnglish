// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import SentenceMatrix from './SentenceMatrix'
import CompactMatrix from './CompactMatrix'
import { classroomMatrices } from '../../classroom/matrixLessons'
import type { MatrixLesson } from './model'
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT:true })
const host=document.createElement('div')
document.body.append(host)
let root=createRoot(host)
afterEach(async()=>{await act(async()=>root.unmount());host.replaceChildren();root=createRoot(host);vi.restoreAllMocks()})
const click=async(selector:string)=>act(async()=>host.querySelector<HTMLButtonElement>(selector)!.click())
const words=(selector:string)=>[...host.querySelectorAll(`${selector} strong`)].map(e=>e.textContent)
const choose=async(word:string)=>act(async()=>[...host.querySelectorAll<HTMLButtonElement>('.cw-word-chip')].find(b=>b.querySelector('strong')?.textContent===word)!.click())
it('can disable explanations independently while keeping dropdowns, noun pictures and correct agreement',async()=>{
 await act(async()=>root.render(<SentenceMatrix lesson={classroomMatrices['lesson-2']} settings={{explanations:false}}/>))
 expect(host.querySelectorAll('.tonight-slot')).toHaveLength(4)
 expect(host.querySelector('.example-unit-trigger')).toBeNull()
 expect(host.querySelectorAll('.slot-3 .vocabulary-picture')).toHaveLength(1)
 await click('[data-picker-slot="3"]'); await choose('keys')
 expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('Where are the keys?')
 await click('[data-picker-slot="1"]'); await choose('is')
 expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('Where is the key?')
})
it('can disable dropdowns and explanation editing without disabling educational windows',async()=>{
 await act(async()=>root.render(<SentenceMatrix lesson={classroomMatrices['lesson-2']} settings={{wordPicker:false,explanationSelection:false,audio:false}}/>))
 expect(host.querySelector('.cw-slot-picker')).toBeNull()
 expect(host.querySelector('.cw-word-conveyor')).toBeNull()
 expect(host.querySelector('.cw-sound')).toBeNull()
 await click('[aria-label="Slot 4: shoes"]')
 expect(host.querySelector('.cw-word-explanation h1')?.textContent).toBe('shoes')
 expect(host.querySelector('.cw-word-options')).toBeNull()
 await click('.cw-word-return')
 expect(document.activeElement).toBe(host.querySelector('[aria-label="Slot 4: shoes"]'))
})
it('restricts both selection surfaces and counterpart forms to the supplied lesson vocabulary',async()=>{
 const lesson:MatrixLesson={...classroomMatrices['lesson-2'],id:'limited',vocabulary:classroomMatrices['lesson-2'].vocabulary.filter(w=>['shoes','keys'].includes(w.word))}
 await act(async()=>root.render(<SentenceMatrix lesson={lesson}/>))
 await click('[data-picker-slot="3"]')
 expect(words('.cw-word-chip')).toEqual(['shoes','keys'])
 await choose('keys')
 await click('[data-picker-slot="1"]')
 expect([...host.querySelectorAll<HTMLButtonElement>('.cw-word-chip')].find(b=>b.textContent?.includes('is'))?.disabled).toBe(true)
 await click('.cw-belt-close'); await click('[aria-label="Slot 4: keys"]')
 expect(words('.cw-word-options button')).toEqual(['shoes','keys'])
})
it('resets a removed selection and open explanation when switching lessons without remounting the caller',async()=>{
 await act(async()=>root.render(<SentenceMatrix lesson={classroomMatrices['lesson-2']}/>))
 await click('[data-picker-slot="3"]'); await choose('glasses')
 await click('[aria-label="Slot 4: glasses"]')
 await act(async()=>root.render(<SentenceMatrix lesson={classroomMatrices['lesson-1']}/>))
 expect(host.querySelector('.cw-word-explanation')).toBeNull()
 expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('Where is the hotel?')
 await click('[data-picker-slot="3"]')
 expect(words('.cw-word-chip')).toHaveLength(20)
 expect(words('.cw-word-chip')).not.toContain('glasses')
})
it('keeps two matrix instances independent with distinct explanation targets',async()=>{
 await act(async()=>root.render(<><SentenceMatrix lesson={classroomMatrices['lesson-1']}/><SentenceMatrix lesson={classroomMatrices['lesson-2']}/></>))
 const targets=[...host.querySelectorAll('[aria-label^="Slot 4:"]')].map(e=>e.getAttribute('aria-controls'))
 expect(new Set(targets).size).toBe(2)
 await click('[aria-label="Slot 4: hotel"]')
 expect(host.querySelector('.cw-word-explanation')?.id).toBe(targets[0])
 expect(host.querySelector('.cw-sentence-board')?.getAttribute('aria-label')).toBe('Where are the shoes?')
})
it('uses the selected noun and owner for recorded audio',async()=>{
 const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue()
 await act(async()=>root.render(<SentenceMatrix lesson={classroomMatrices['lesson-2']}/>))
 await click('[data-picker-slot="2"]');await choose('your')
 await click('[data-picker-slot="3"]');await choose('keys')
 await click('.cw-sound')
 expect(host.querySelector('audio')?.getAttribute('src')).toBe(classroomMatrices['lesson-2'].audio('keys','your','are'))
 expect(play).toHaveBeenCalledOnce()
})
it('leaves intentionally incorrect assessment sentences untouched and hides all help',async()=>{
 const slots=[{label:'Question',options:[['Where','ที่ไหน']]},{label:'Verb',options:[['is','อยู่']]},{label:'Owner',options:[['my','ของฉัน']]},{label:'Noun',options:[['shoe','รองเท้า']]}] as const
 await act(async()=>root.render(<CompactMatrix slots={slots} values={['Where','is','my','shoes']} assessment label="Question"/>))
 expect([...host.querySelectorAll('.tonight-slot > strong')].map(e=>e.textContent)).toEqual(['Where','is','my','shoes'])
 expect(host.querySelector('[lang="th"]')).toBeNull()
 expect([...host.querySelectorAll<HTMLButtonElement>('.tonight-slot')].every(b=>b.disabled)).toBe(true)
 expect(host.querySelector('.tonight-choices')).toBeNull()
})
it('can lock the compact picker without hiding its teaching translation',async()=>{
 await act(async()=>root.render(<CompactMatrix slots={[{label:'word',options:[['hotel','โรงแรม'],['shop','ร้าน']]}]} settings={{wordPicker:false}} label="Example" translation={()=>'โรงแรม'}/>))
 expect(host.querySelector<HTMLButtonElement>('.tonight-slot')?.disabled).toBe(true)
 expect(host.querySelector('.tonight-sentence')?.textContent).toBe('โรงแรม')
})
