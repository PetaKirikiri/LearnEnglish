// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import ExampleLanguage from './ExampleView'
import LanguageQuadrant from './LanguageQuadrant'
import {actionDialogue} from '../sentenceRules/actionDialogue'
import {lessonThreeMatrixCatalogue} from '../../classroom/wordCatalogue'
import PictureSentence from '../../race/PictureSentence'

it.each([['I','am'],['he','is'],['they','are'],['he','was'],['they','were']])('keeps %s %s in the verb slot even without explicit role metadata',(subject,verb)=>{
 const words=[subject,verb,'at','the','hotel']
 const host=document.createElement('div')
 host.innerHTML=renderToStaticMarkup(<ExampleLanguage matrix english={words.join(' ')} thai="" units={words.map(english=>({english,thai:''}))}/>)
 const card=[...host.querySelectorAll('.tonight-slot')].find(card=>card.querySelector('.example-source')?.textContent===verb)
 expect(card?.classList.contains('slot-1')).toBe(true)
})
it.each(['i','he','they'] as const)('preserves the same verb classification in question, answer and picture choices for %s',subject=>{
 const pair=actionDialogue(subject,'holding',{vocabulary:lessonThreeMatrixCatalogue,object:'a phone',determiner:'the'})
 for(const construction of ['question','answer'] as const){
  const doc={...pair[construction],construction:construction==='question'?'action-question' as const:'action-answer' as const}
  const host=document.createElement('div')
  host.innerHTML=renderToStaticMarkup(<LanguageQuadrant request={{document:doc}}/>)
  for(const unit of doc.units.filter(u=>u.role==='be'||u.role==='action')){
   const card=[...host.querySelectorAll('.tonight-slot')].find(card=>card.querySelector('.example-source')?.textContent===unit.english)
   expect(card?.classList.contains('slot-1'),doc.english+': '+unit.english).toBe(true)
  }
  host.innerHTML=renderToStaticMarkup(<PictureSentence document={doc}/>)
  expect(host.querySelector('.picture-sentence')?.getAttribute('data-coloured')).toBe('true')
  expect(host.querySelector('[data-role=be],[data-role=action]')).not.toBeNull()
 }
})
