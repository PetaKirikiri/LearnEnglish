// @vitest-environment node
import { readFileSync, existsSync } from 'node:fs'
import { expect, it } from 'vitest'
import { lessonTwoNumberQuestions, lessonTwoOwnerQuestions, lessonTwoReviewQuestions, lessonTwoRecordings } from './lessonTwoQuestions'
import { lessonTwoWords, lessonTwoPairs } from '../classroom/lessonTwoContent'
import { racePools } from './pools'
import { selectQuestions } from '../../server/classroomRace'

it('covers every lesson two noun in round one with both correct and incorrect agreement',()=>{
  expect(lessonTwoNumberQuestions).toHaveLength(76)
  const expectedNouns = [...lessonTwoWords.flatMap(item=>[item.singular,item.plural]),...lessonTwoPairs.map(item=>item.plural)]
  expect(new Set(lessonTwoNumberQuestions.map(q=>q.english.split(' ').at(-1)))).toEqual(new Set(expectedNouns.map(noun=>`${noun}?`)))
  expect(lessonTwoNumberQuestions.every(q=>q.english.includes(' the '))).toBe(true)
  for(const noun of expectedNouns) {
    const variants=lessonTwoNumberQuestions.filter(q=>q.english.endsWith(`the ${noun}?`))
    expect(variants).toHaveLength(2)
    expect(variants.map(q=>q.correct).sort()).toEqual([0,1])
    const plural=[...lessonTwoWords,...lessonTwoPairs].some(item=>item.plural===noun)
    expect(variants.find(q=>q.correct===0)!.english).toBe(`Where ${plural?'are':'is'} the ${noun}?`)
  }
  const pool=racePools.find(p=>p.id==='lesson-two-number')!
  expect(pool.kind).toBe('judgement')
  const selected=selectQuestions({...pool,questions:pool.questions.map(q=>({...q,audioUrl:q.audioUrl??'',choices:q.answers.map(a=>a.map(p=>p.text).join(''))}))})
  expect(selected.questions).toHaveLength(76)
  expect(selected.questions.every(q=>q.choices.join('|')==='Correct|Wrong')).toBe(true)
})
it('tests agreement fairly for every noun and owner, including pair nouns',()=>{
  expect(lessonTwoReviewQuestions).toHaveLength(228)
  for(const item of [...lessonTwoWords,...lessonTwoPairs]) for(const owner of ['the','my','your']) {
    const forms = 'singular' in item ? [item.singular,item.plural] : [item.plural]
    for(const noun of forms){
      const variants=lessonTwoReviewQuestions.filter(q=>q.english.endsWith(`${owner} ${noun}?`))
      expect(variants).toHaveLength(2)
      expect(variants.map(q=>q.correct).sort()).toEqual([0,1])
      const verb=noun===item.plural?'are':'is'
      expect(variants.find(q=>q.correct===0)!.english).toBe(`Where ${verb} ${owner} ${noun}?`)
    }
  }
  expect(lessonTwoReviewQuestions.some(q=>/\bglass\?|\btrouser\?/.test(q.english))).toBe(false)
})
it('changes only ownership in round two even after server question selection',()=>{
  const pool=racePools.find(p=>p.id==='lesson-two-owner')!
  const selected=selectQuestions({...pool,questions:pool.questions.map(q=>({...q,audioUrl:q.audioUrl??'',choices:q.answers.map(a=>a.map(p=>p.text).join(''))}))})
  expect(selected.questions).toHaveLength(24)
  for(const question of selected.questions){
    expect(question.choices[0].replace('ของฉัน','').replace('ของคุณ','')).toBe(question.choices[1].replace('ของฉัน','').replace('ของคุณ',''))
    expect(question.choices[question.correct]).toContain(question.english.includes(' my ')?'ของฉัน':'ของคุณ')
  }
})
it('has real matching speech for every question and no missing taught noun pictures',()=>{
  const manifest=JSON.parse(readFileSync('public/audio/race-lesson-two/voice-manifest.json','utf8'))
  expect(lessonTwoRecordings).toHaveLength(228)
  for(const item of lessonTwoRecordings){
    expect(existsSync(`public${item.audioUrl}`)).toBe(true)
    expect(manifest[item.audioUrl!.split('/').at(-1)!].text).toBe(item.spokenText)
    expect(manifest[item.audioUrl!.split('/').at(-1)!].seconds).toBeGreaterThan(.5)
  }
  const drawings=readFileSync('src/learning/VocabularyPicture.tsx','utf8')
  for(const item of [...lessonTwoWords,...lessonTwoPairs]) expect(drawings).toContain(`${'singular' in item?item.singular:item.plural}:`)
  expect(new Set(lessonTwoOwnerQuestions.map(q=>q.id)).size).toBe(24)
})
