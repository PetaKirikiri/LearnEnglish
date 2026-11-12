// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it} from 'vitest'
import {writeFileSync,mkdirSync} from 'node:fs'
import SentenceMatrix,{type SentenceMatrixProps} from './SentenceMatrix'
import {requestLesson} from '../lessonRegistry'
import {lessonNumbers} from '../lessonRequests'
import {actionCapabilities} from '../sentenceRules/actionCapabilities'
import {locationWords} from './peopleLocation'
import {meaningForWord} from '../sentenceRules/blueprints'
import {grammaticalNumber} from './vocabularyCategories'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
const modes=['noun','pronoun','name'] as const
it('audits every offered noun across the real builders and exercises every grammatically supported mode',async()=>{
 const host=document.createElement('div'),root=createRoot(host)
 const results:{lesson:string;pattern:string;noun:string;slot:string;enabled:string[];switched:string[];missing:string[]}[]=[]
 const cases:{lesson:string;pattern:string;noun:string;props:SentenceMatrixProps}[]=[]
 for(const number of lessonNumbers){
  const lesson=requestLesson(number)
  const add=(noun:string,pattern:'question'|'answer',extra:Partial<SentenceMatrixProps>={})=>cases.push({lesson:number,pattern,noun,props:{lesson:{...lesson,initialWord:noun},word:noun,settings:{audio:false,initialPattern:pattern},...extra}})
  if(lesson.pattern==='present-action'){
   const capabilities=actionCapabilities(lesson)
   for(const action of capabilities.actions)for(const object of capabilities.objects(action.word))add(object.noun,'answer',{initialAction:{action:action.word,object:object.word,subject:'i'}})
  }else if(lesson.pattern==='people-location'){
   for(const noun of lesson.vocabulary)add(noun.word,'question')
   for(const noun of locationWords(lesson.vocabulary))add(noun.word,'answer')
  }else if(lesson.pattern==='identification'){
   for(const noun of lesson.vocabulary.filter(item=>grammaticalNumber(item)==='singular'&&meaningForWord(item)?.kind==='physical-object'&&item.plural))add(noun.word,'answer')
  }else for(const noun of lesson.vocabulary)add(noun.word,'question')
 }
 try{
  for(const [index,item] of cases.entries()){
   await act(async()=>root.render(<SentenceMatrix key={index} {...item.props}/>))
   const groups=[...new Map([...host.querySelectorAll<HTMLElement>('.cw-noun-mode-toggle')].map(group=>[group.getAttribute('aria-label'),group])).values()]
   if(!groups.length){results.push({lesson:item.lesson,pattern:item.pattern,noun:item.noun,slot:'noun slot (no mode control)',enabled:[],switched:[],missing:[...modes]});continue}
   for(const group of groups){
    const label=group.getAttribute('aria-label')!,enabled=modes.filter(mode=>!group.querySelector<HTMLButtonElement>(`[data-noun-mode="${mode}"]`)?.disabled&&!!group.querySelector(`[data-noun-mode="${mode}"]`)),switched:string[]=[]
    const initial=group.querySelector('[aria-pressed=true]')?.getAttribute('data-noun-mode')
    const current=()=>[...host.querySelectorAll<HTMLElement>('.cw-noun-mode-toggle')].find(g=>g.getAttribute('aria-label')===label)
    const source=item.props.lesson.vocabulary.find(noun=>noun.word===item.noun)
    const physicalObjectSlot=item.pattern==='answer'&&label==='Object block mode'&&source&&meaningForWord(source)?.kind==='physical-object'
    if(physicalObjectSlot)expect(enabled,`${item.noun} cannot be replaced with a person’s name in this object slot`).not.toContain('name')
    const expected=physicalObjectSlot?modes.filter(mode=>mode!=='name'):modes
    for(const mode of enabled){
     await act(async()=>current()?.querySelector<HTMLButtonElement>(`[data-noun-mode="${mode}"]`)?.click())
     if(current()?.querySelector(`[data-noun-mode="${mode}"]`)?.getAttribute('aria-pressed')==='true'&&host.querySelector('.example-source'))switched.push(mode)
     if(mode==='name')expect([...host.querySelectorAll('.example-source')].map(e=>e.textContent).join(' ')).not.toMatch(/[’']s\b/)
    }
    if(initial)await act(async()=>current()?.querySelector<HTMLButtonElement>(`[data-noun-mode="${initial}"]`)?.click())
    results.push({lesson:item.lesson,pattern:item.pattern,noun:item.noun,slot:label,enabled,switched,missing:expected.filter(mode=>!switched.includes(mode))})
   }
  }
 }finally{await act(async()=>root.unmount())}
 const missing=results.filter(row=>row.missing.length),summary={nounContexts:cases.length,nounForms:new Set(cases.map(c=>c.noun)).size,slotChecks:results.length,supportedModesWorking:results.length-missing.length,allThreeWorking:results.filter(row=>row.switched.length===3).length,missingModes:missing.length,bySlot:Object.fromEntries([...new Set(results.map(r=>r.lesson+':'+r.pattern+':'+r.slot))].map(key=>{const rows=results.filter(r=>r.lesson+':'+r.pattern+':'+r.slot===key);return [key,{checked:rows.length,complete:rows.filter(r=>!r.missing.length).length,enabled:[...new Set(rows.map(r=>r.enabled.join(',')))]}]}))}
 mkdirSync('reports',{recursive:true});writeFileSync('reports/noun-mode-audit.json',JSON.stringify({summary,results},null,2)+'\n')
 console.log(JSON.stringify(summary,null,2))
 expect(missing.length,`${missing.length} noun-slot contexts cannot switch through all grammatically supported modes; see reports/noun-mode-audit.json`).toBe(0)
},120000)
