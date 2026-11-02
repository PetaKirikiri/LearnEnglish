import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
const src=resolve('src')
function files(dir:string):string[] { return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(`${dir}/${entry.name}`):[`${dir}/${entry.name}`]) }
it('keeps all four-slot card markup in the shared engine',()=>{
 const offenders=files(src).filter(file=>file.endsWith('.tsx')&&!file.includes('.test.')&&!file.includes('/sentenceMatrix/')).filter(file=>/className=.{0,20}tonight-slot|<SentenceSlot[ >]/.test(readFileSync(file,'utf8')))
 expect(offenders).toEqual([])
})
it('keeps old lesson builders as import-compatible facades, not copied engines',()=>{
 for(const path of ['classroom/SentenceLine.tsx','classroom/WordExplanation.tsx','classroom/ActionDialogue.tsx','learning/ExampleLanguage.tsx','learning/SentenceSlotBuilder.tsx','learning/sentenceSlotEngine.ts','race/PluralWordExplorer.tsx','race/RaceLessonExamples.tsx']){
  const source=readFileSync(`${src}/${path}`,'utf8')
  expect(source).not.toMatch(/useState|useEffect|function |=>|<button/)
  expect(source).toContain('/sentenceMatrix/')
 }
})

it('allows only one implementation of noun groups, dropdown controls and vocabulary trays',()=>{
 const owners={'cw-noun-group':'NounGroup.tsx','cw-slot-picker':'MatrixPicker.tsx','cw-word-conveyor':'WordTray.tsx'}
 for(const [className,owner] of Object.entries(owners)){
  const implementations=files(src).filter(file=>file.endsWith('.tsx')&&!file.includes('.test.')).filter(file=>new RegExp(`className=.{0,20}${className}`).test(readFileSync(file,'utf8')))
  expect(implementations.map(file=>file.slice(src.length+1)),className).toEqual([`learning/sentenceMatrix/${owner}`])
 }
})
it('lesson hosts request complete matrices instead of assembling their internals',()=>{
 const internalImports=/from\s+['"][^'"]*sentenceMatrix\/(?:MatrixCard|MatrixPicker|MatrixLayout|NounGroup|WordTray|ActionMatrix)['"]/
 const offenders=files(`${src}/classroom`).filter(file=>file.endsWith('.tsx')&&!file.includes('.test.')&&!file.endsWith('/ActionDialogue.tsx')).filter(file=>internalImports.test(readFileSync(file,'utf8')))
 expect(offenders).toEqual([])
 const actionSource=readFileSync(`${src}/learning/sentenceMatrix/ActionMatrix.tsx`,'utf8')
 expect(actionSource).toContain('vocabulary:lesson.vocabulary')
 expect(actionSource).toContain('<MatrixExplanation')
 expect(actionSource).not.toMatch(/className=.{0,20}(?:cw-noun-group|cw-word-conveyor|cw-slot-picker)/)
})
