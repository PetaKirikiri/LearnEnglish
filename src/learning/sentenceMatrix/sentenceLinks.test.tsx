// @vitest-environment happy-dom
import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import LanguageQuadrant,{type LanguageDocument} from './LanguageQuadrant'
import ExampleLanguage from './ExampleView'
import PictureSentence from '../../race/PictureSentence'
import {sentenceLinks} from './sentenceLinks'
import {actionDialogue} from '../sentenceRules/actionDialogue'
import {lessonThreeMatrixCatalogue} from '../../classroom/wordCatalogue'
const pair=actionDialogue('you','holding',{vocabulary:lessonThreeMatrixCatalogue,object:'a phone',determiner:'the'})
const docs:LanguageDocument[]=[
 {...pair.question,construction:'action-question'}, {...pair.answer,construction:'action-answer'},
 {english:'I am at the hotel',thai:'',construction:'location-answer',units:[{english:'I',thai:'',role:'person'},{english:'am',thai:'',role:'be'},{english:'at',thai:'',role:'preposition'},{english:'the',thai:'',role:'determiner'},{english:'hotel',thai:'',role:'object'}]},
 {english:'Where are you?',thai:'',construction:'question',units:[{english:'Where',thai:'',role:'question'},{english:'are',thai:'',role:'be'},{english:'you?',thai:'',role:'person'}]},
 {english:'What is this?',thai:'',construction:'identification-question',units:[{english:'What',thai:'',role:'question'},{english:'is',thai:'',role:'be'},{english:'this?',thai:'',role:'reference'}]},
 {english:'the red bag',thai:'',construction:'noun-phrase',units:[{english:'the',thai:'',role:'determiner'},{english:'red',thai:'',role:'description'},{english:'bag',thai:'',role:'object'}]},
]
const groups=(host:HTMLElement,words:string)=>[...host.querySelectorAll('[data-link]')].map(group=>({kind:group.getAttribute('data-link'),words:[...group.querySelectorAll(words)].map(word=>word.textContent)}))
it.each(['comfortable','compact','content','briefing','thumbnail'] as const)('preserves the same semantic links in question boxes and answer pictures at %s size',density=>{
 for(const document of docs){
  const expected=sentenceLinks(document.units).map(link=>({kind:link.kind,words:document.units.slice(link.start,link.end).map(u=>u.english)}))
  const host=window.document.createElement('div')
  host.innerHTML=renderToStaticMarkup(<LanguageQuadrant request={{document,presentation:{layout:{density}}}}/>)
  expect(groups(host,'.example-source'),document.english).toEqual(expected)
  host.innerHTML=renderToStaticMarkup(<PictureSentence document={document}/>)
  expect(groups(host,'.picture-sentence-word'),document.english).toEqual(expected)
 }
})
it('keeps THE visible as its own icon and label inside the linked noun phrase',()=>{
 const document=docs[1],host=window.document.createElement('div')
 host.innerHTML=renderToStaticMarkup(<PictureSentence document={document}/>)
 const determiner=[...host.querySelectorAll('.picture-sentence-part')].find(part=>part.querySelector('.picture-sentence-word')?.textContent==='the')
 expect(determiner?.querySelector('.picture-sentence-art [data-determiner=the] img')).not.toBeNull()
 expect(determiner?.parentElement?.getAttribute('data-link')).toBe('noun')
 expect(determiner?.parentElement?.querySelectorAll('.picture-sentence-art')).toHaveLength(2)
})
it('keeps links in legacy examples and when all their words and pictures are faded',()=>{
 const document=docs[2],host=window.document.createElement('div')
 host.innerHTML=renderToStaticMarkup(<ExampleLanguage matrix {...document}/>)
 expect(groups(host,'.example-source').map(g=>g.words)).toEqual([['I','am'],['the','hotel']])
 const scores=Object.fromEntries(document.units.map(u=>['en:'+u.english.toLowerCase(),25]))
 host.innerHTML=renderToStaticMarkup(<LanguageQuadrant scores={scores} request={{document,presentation:{fadeMode:true,keepIconsWhenFading:true}}}/>)
 expect(groups(host,'.example-source').map(g=>g.words)).toEqual([['I','am'],['the','hotel']])
 expect([...host.querySelectorAll<HTMLElement>('.cw-slot-role')].every(icon=>icon.style.opacity==='0')).toBe(true)
})
it('distinguishes the auxiliary from the main verb without changing their green colour or subject link',()=>{
 const action=docs[1],location=docs[2],host=window.document.createElement('div')
 for(const render of [(document:LanguageDocument)=><LanguageQuadrant request={{document}}/>,(document:LanguageDocument)=><PictureSentence document={document}/>]){
  host.innerHTML=renderToStaticMarkup(render(action))
  expect(host.querySelector('[data-word-type=auxiliary-verb]')?.getAttribute('title')).toBe('Auxiliary verb')
  expect(host.querySelector('[data-word-type=main-verb]')?.getAttribute('title')).toBe('Main verb')
  expect(host.querySelector('[data-word-type=auxiliary-verb]')?.closest('[data-link]')?.getAttribute('data-link')).toBe('agreement')
  host.innerHTML=renderToStaticMarkup(render(location))
  expect(host.querySelector('[data-word-type=linking-verb]')?.getAttribute('title')).toBe('Linking verb')
  expect(host.querySelector('[data-word-type=auxiliary-verb]')).toBeNull()
 }
})
it('wraps whole linked groups at narrow widths instead of splitting their words into separate rows',async()=>{
 const {act}=await import('react'),{createRoot}=await import('react-dom/client'),{vi}=await import('vitest')
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 const canvas=vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({measureText:(text:string)=>({width:text.length*10})} as unknown as CanvasRenderingContext2D)
 const bounds=vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(()=>({width:120,height:400,left:0,right:120,top:0,bottom:400,x:0,y:0,toJSON(){return {}}}))
 const host=window.document.createElement('div'),root=createRoot(host)
 try{
  await act(async()=>root.render(<LanguageQuadrant request={{document:docs[2],presentation:{size:'phone'}}}/>))
  const groups=[...host.querySelectorAll<HTMLElement>('[data-link]')]
  expect(groups.length).toBe(2)
  for(const group of groups)expect(group.style.gridTemplateColumns.match(/minmax/g),group.outerHTML).toHaveLength(2)
 }finally{await act(async()=>root.unmount());canvas.mockRestore();bounds.mockRestore()}
})
