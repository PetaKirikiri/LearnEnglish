import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import PictureSentence,{pictureChunks} from './PictureSentence'
import {actionPracticeQuestions,pictureActionPracticeQuestions,actionPracticeDeck} from './actionPracticeContent'
import {actionStarDeck} from './actionStarContent'
import {practiceDeck} from './practiceDeck'
import {numberCatalogue} from './numberCatalogue'
import VocabularyPicture from '../learning/VocabularyPicture'
import {languageRoleIcon,type LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'
function check(document:LanguageDocument){
 const html=renderToStaticMarkup(<PictureSentence document={document}/>)
 expect(html).not.toMatch(/[\u0e00-\u0e7f]/)
 for(const chunk of pictureChunks(document.units)){
  const icon=renderToStaticMarkup(<>{languageRoleIcon(chunk.unit,document.construction)}</>)
  expect(icon,`${document.english}: ${chunk.english}`).not.toBe('')
  for(const match of icon.matchAll(/src="([^"?]+)/g))expect(existsSync(resolve('public',match[1].slice(1))),match[1]).toBe(true)
 }
 return html.replace(/<span class="picture-sentence-word">.*?<\/span>/g,'').replace(/aria-label="[^"]*"/g,'')
}
it('keeps picture alternatives structurally matched with one meaning changed',()=>{
 for(const q of pictureActionPracticeQuestions){
  expect(pictureChunks(q.units).length,q.english).toBe(pictureChunks(q.distractorUnits).length)
  const parts=(units:typeof q.units)=>['person-determiner','person','action','determiner','object'].map(role=>units.filter(u=>u.role===role).map(u=>u.english.toLowerCase().replace(/[?.!]$/,'').replace(/^(a|an)$/,'indefinite')).join(' '))
  const correct=parts(q.units)
  expect(parts(q.distractorUnits).filter((part,i)=>part!==correct[i]).length,q.english).toBe(1)
 }
})
it('covers every assessed action component, including shuffled and star-course alternatives',()=>{
 const questions=[...actionPracticeQuestions,...actionPracticeDeck(4),...actionPracticeDeck(5),...([1,2,3] as const).flatMap(star=>actionStarDeck(star,'picture-test'))]
 for(const q of questions){
  const documents=q.choices.map((_,side)=>{const units=side===q.correct?q.units:q.distractorUnits;return {english:units.map(u=>u.english).join(' '),thai:'',units,construction:q.level===4?'action-question' as const:'action-answer' as const}})
  expect(documents[q.correct].english).toBe(q.english)
  expect(check(documents[0]),q.id).not.toBe(check(documents[1]))
 }
})
it('resolves pictures for both answers across every lesson and reversed listening pass',()=>{
 for(let lesson=1;lesson<=5;lesson++)for(const q of practiceDeck(lesson)){
  expect(q.choiceDocuments[q.choices[q.correct]].english).toBe(q.english)
  expect(check(q.choiceDocuments[q.choices[0]]),q.id).not.toBe(check(q.choiceDocuments[q.choices[1]]))
 }
})
it('has real artwork for the entire noun practice catalogue',()=>{
 for(const item of numberCatalogue){
  const html=renderToStaticMarkup(<VocabularyPicture word={item.word}/>)
  expect(html,item.word).not.toBe('')
  for(const match of html.matchAll(/src="([^"?]+)/g))expect(existsSync(resolve('public',match[1].slice(1))),item.word).toBe(true)
 }
})
