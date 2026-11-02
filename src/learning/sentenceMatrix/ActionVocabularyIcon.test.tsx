import {lessonThreeMatrixCatalogue} from '../../classroom/wordCatalogue'
// @vitest-environment happy-dom
import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import {renderToStaticMarkup} from 'react-dom/server'
import {expect,it} from 'vitest'
import {ActionIcon,ActionObjectIcon} from './ActionVocabularyIcon'
import {objectsForAction,actionVocabulary} from '../sentenceRules/actionDialogue'

it('ships dedicated artwork for every action and object',()=>{
 for(const item of actionVocabulary){
  const host=document.createElement('div');host.innerHTML=renderToStaticMarkup(<ActionIcon word={item.word}/>)
  const src=host.querySelector('img')?.getAttribute('src')
  expect(src).toBe(item.icon)
  expect(existsSync(resolve('public',src!.slice(1)))).toBe(true)
 }
 for(const item of actionVocabulary.flatMap(action=>objectsForAction(action.word,lessonThreeMatrixCatalogue))){
  const host=document.createElement('div');host.innerHTML=renderToStaticMarkup(<ActionObjectIcon word={item.noun}/>)
  const src=host.querySelector('img')?.getAttribute('src')
  expect(src).toBeTruthy()
  expect(existsSync(resolve('public',src!.slice(1)))).toBe(true)
 }
 expect(renderToStaticMarkup(<ActionObjectIcon word="water"/>)).toContain('/actions/water.png')
})
