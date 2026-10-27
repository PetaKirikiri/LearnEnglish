// @vitest-environment node
import { existsSync } from 'node:fs'
import { expect,it } from 'vitest'
import { cumulativeCatalogue, lessonOneCatalogue,lessonTwoCatalogue,lessonTwoIntroducedCatalogue } from './wordCatalogue'
import { classroomMatrices } from './matrixLessons'
import { categoriesForWord } from '../learning/sentenceMatrix/vocabularyCategories'
it('accumulates lessons without future words or duplicate entries, preserving later grammar metadata',()=>{
 expect(lessonOneCatalogue).toHaveLength(20)
 expect(lessonOneCatalogue.some(w=>w.word==='shoes')).toBe(false)
 for(const word of [...lessonOneCatalogue,...lessonTwoIntroducedCatalogue])expect(lessonTwoCatalogue.some(w=>w.word===word.word)).toBe(true)
 expect(lessonTwoCatalogue).toHaveLength(57)
 expect(new Set(lessonTwoCatalogue.map(w=>w.word)).size).toBe(lessonTwoCatalogue.length)
 expect(lessonTwoCatalogue.find(w=>w.word==='phone')).toMatchObject({number:'singular',plural:'phones'})
 expect(cumulativeCatalogue([{word:'phone',thai:'โทรศัพท์'}],[{word:'phone',thai:'โทรศัพท์',plural:'phones'}])).toHaveLength(1)
 expect(lessonOneCatalogue.find(w=>w.word==='phone')?.plural).toBeUndefined()
})
it('includes earlier vocabulary categories and resolves existing audio for every cumulative word',()=>{
 const categories=new Set(lessonTwoCatalogue.flatMap(categoriesForWord))
 for(const category of ['places','buildings','clothing','everyday','furniture','sports','transport','people'] as const)expect(categories.has(category)).toBe(true)
 for(const item of lessonTwoCatalogue)for(const owner of ['the','my','your'] as const) {
  const url=classroomMatrices['lesson-2'].audio(item.word,owner,item.number==='plural'?'are':'is')
  expect(existsSync(`public${url}`),url).toBe(true)
 }
 expect(classroomMatrices['lesson-2'].audio('hotel','my','is')).toBe('/audio/race-class-one/hotel-my.wav')
 expect(classroomMatrices['lesson-2'].audio('shoes','my','are')).toBe('/audio/race-lesson-two/shoes-my-are.wav')
})
