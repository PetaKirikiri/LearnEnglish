// @vitest-environment happy-dom
import {renderToStaticMarkup} from 'react-dom/server'
import {expect,it} from 'vitest'
import LanguageQuadrant from './LanguageQuadrant'
import type {LanguageDocument} from './LanguageQuadrant'
import {lessonThreeMatrixCatalogue} from '../../classroom/wordCatalogue'
import {actionDialogue} from '../sentenceRules/actionDialogue'
import PictureSentence from '../../race/PictureSentence'

it('hides a combined icon when any word it depicts is hidden, even if the rest are still new',()=>{
 const document:LanguageDocument={english:'that over there bag',thai:'',construction:'noun-phrase',units:[
  {english:'that over there',thai:'',role:'determiner'}, {english:'bag',thai:'',role:'object'},
 ]}
 const host=window.document.createElement('div')
 host.innerHTML=renderToStaticMarkup(<LanguageQuadrant request={{document,presentation:{fadeMode:true,keepIconsWhenFading:true}}} scores={{'en:that':25}}/>)
 const icon=host.querySelector<HTMLElement>('.cw-slot-role')!
 expect(icon.style.opacity).toBe('0')
 expect(host.querySelector<HTMLElement>('[data-word=that]')?.style.opacity).toBe('0')
 expect(host.querySelector<HTMLElement>('[data-word=over]')?.style.opacity).toBe('1')
 expect(host.querySelector('.example-gloss,.example-translation,.cw-slot-count')).toBeNull()
})
it('fades every icon as well as every word in a fully faded action sentence',()=>{
 const document:LanguageDocument={...actionDialogue('i','holding',{vocabulary:lessonThreeMatrixCatalogue,object:'a phone',determiner:'the'}).answer,construction:'action-answer'}
 const scores=Object.fromEntries((document.english.toLowerCase().match(/[a-z]+/g)??[]).map(w=>['en:'+w,25]))
 const host=window.document.createElement('div')
 host.innerHTML=renderToStaticMarkup(<LanguageQuadrant request={{document:{...document,construction:'action-answer'},presentation:{fadeMode:true,keepIconsWhenFading:true}}} scores={scores}/>)
 const icons=[...host.querySelectorAll<HTMLElement>('.cw-slot-role')]
 expect(icons.length).toBeGreaterThan(0)
 expect(icons.every(icon=>icon.style.opacity==='0')).toBe(true)
 expect([...host.querySelectorAll<HTMLElement>('.matrix-fading-word[data-word]')].every(word=>word.style.opacity==='0')).toBe(true)
})
it('uses semantic coloured answer tiles by default, including subjects and objects',()=>{
 const document:LanguageDocument={...actionDialogue('i','holding',{vocabulary:lessonThreeMatrixCatalogue,object:'a phone',determiner:'the'}).answer,construction:'action-answer'}
 const host=window.document.createElement('div')
 host.innerHTML=renderToStaticMarkup(<PictureSentence document={{...document,construction:'action-answer'}}/>)
 expect(host.querySelector('.picture-sentence')?.getAttribute('data-coloured')).toBe('true')
 for(const role of ['person','action','object'])expect(host.querySelector(`[data-role="${role}"]`)).not.toBeNull()
})

it('fades the noun inside an identification reference scene along with its noun card',async()=>{
 const {identificationAnswer}=await import('../sentenceRules/identification')
 const phone=lessonThreeMatrixCatalogue.find(word=>word.word==='phone')!
 const document=identificationAnswer('this',phone)
 const host=window.document.createElement('div')
 host.innerHTML=renderToStaticMarkup(<LanguageQuadrant request={{document,presentation:{fadeMode:true,keepIconsWhenFading:true}}} scores={{'en:phone':25}}/>)
 expect(host.querySelector<HTMLElement>('[data-reference-artwork]')?.style.opacity).toBe('0')
 expect(host.querySelector<HTMLElement>('.matrix-fading-word[data-word=phone]')?.style.opacity).toBe('0')
 expect(host.querySelector('[data-reference-artwork] [role=img]')?.getAttribute('aria-label')).toContain('phone')
 expect(host.querySelector<HTMLElement>('.matrix-fading-word[data-word=this]')?.style.opacity).toBe('1')
})
