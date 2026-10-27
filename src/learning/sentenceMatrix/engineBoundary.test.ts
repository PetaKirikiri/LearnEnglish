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
 for(const path of ['classroom/SentenceLine.tsx','classroom/WordExplanation.tsx','learning/ExampleLanguage.tsx','learning/SentenceSlotBuilder.tsx','learning/sentenceSlotEngine.ts','race/PluralWordExplorer.tsx','race/RaceLessonExamples.tsx']){
  const source=readFileSync(`${src}/${path}`,'utf8')
  expect(source).not.toMatch(/useState|useEffect|function |=>|<button/)
  expect(source).toContain('/sentenceMatrix/')
 }
})
