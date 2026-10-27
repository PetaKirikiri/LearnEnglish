// @vitest-environment node
import { readFileSync, existsSync } from 'node:fs'
import { expect, it } from 'vitest'
import { lessonTwoNumberQuestions, lessonTwoOwnerQuestions, lessonTwoReviewQuestions, lessonTwoRecordings } from './lessonTwoQuestions'
import { lessonTwoWords, lessonTwoPairs } from '../classroom/lessonTwoContent'
import { racePools } from './pools'
import { holidayMeaningQuestions } from './holidayQuestions'
import { numberSentence, owners } from '../classroom/lessonTwoContent'
import { selectQuestions } from '../../server/classroomRace'

it('covers every lesson two noun in round one with both correct and incorrect agreement',()=>{
  expect(lessonTwoNumberQuestions).toHaveLength(228)
  const expectedNouns = [...lessonTwoWords.flatMap(item=>[item.singular,item.plural]),...lessonTwoPairs.map(item=>item.plural)]
  expect(new Set(lessonTwoNumberQuestions.map(q=>q.english.split(' ').at(-1)))).toEqual(new Set(expectedNouns.map(noun=>`${noun}?`)))
  expect(lessonTwoNumberQuestions.every(q=>/^Where (is|are) (the|my|your) [a-z]+\?$/.test(q.english))).toBe(true)
  for(const noun of expectedNouns) for(const owner of ['the','my','your']) {
    const variants=lessonTwoNumberQuestions.filter(q=>q.english.endsWith(`${owner} ${noun}?`))
    expect(variants).toHaveLength(2)
    expect(variants.map(q=>q.correct).sort()).toEqual([0,1])
    const plural=[...lessonTwoWords,...lessonTwoPairs].some(item=>item.plural===noun)
    expect(variants.find(q=>q.correct===0)!.english).toBe(`Where ${plural?'are':'is'} ${owner} ${noun}?`)
  }
  const pool=racePools.find(p=>p.id==='lesson-two-number')!
  expect(pool.kind).toBe('judgement')
  const selected=selectQuestions({...pool,questions:pool.questions.map(q=>({...q,audioUrl:q.audioUrl??'',choices:q.answers.map(a=>a.map(p=>p.text).join(''))}))})
  expect(selected.questions).toHaveLength(228)
  expect(selected.questions.every(q=>q.choices.join('|')==='Correct|Wrong')).toBe(true)
})
it('makes round three correct English with two distinct Thai translations covering both lessons',()=>{
  expect(lessonTwoReviewQuestions).toHaveLength(134)
  expect(new Set(lessonTwoReviewQuestions.map(q=>q.id)).size).toBe(134)
  for(const item of [...lessonTwoWords,...lessonTwoPairs]) for(const plural of ('singular' in item?[false,true]:[true])) for(const owner of owners){
    const expected=numberSentence(item,plural,owner)
    const q=lessonTwoReviewQuestions.find(q=>q.english===expected.english)!
    expect(q).toBeTruthy()
    expect(q.answers[q.correct][0].text).toBe(expected.thai)
    expect(q.meaningDistractor).not.toBe(expected.thai)
    if(owner==='the' && 'singular' in item) expect(q.meaningDistractor).toBe(numberSentence(item,!plural,owner).thai)
    expect(existsSync(`public${q.audioUrl}`)).toBe(true)
  }
  for(const q of holidayMeaningQuestions) expect(lessonTwoReviewQuestions.some(item=>item.english===q.english && item.audioUrl===q.audioUrl)).toBe(true)
  const pool=racePools.find(p=>p.id==='lesson-two-review')!
  expect(pool.kind).toBe('meaning')
  const selected=selectQuestions({...pool,questions:pool.questions.map(q=>({...q,audioUrl:q.audioUrl??'',choices:q.answers.map(a=>a.map(p=>p.text).join(''))}))})
  for(const question of selected.questions){
    const authored=lessonTwoReviewQuestions.find(q=>q.id===question.id)!
    expect(question.choices).toEqual(authored.answers.map(a=>a.map(p=>p.text).join('')))
    expect(question.choices).toHaveLength(2)
    expect(question.choices.every(choice=>/[ก-๙]/.test(choice))).toBe(true)
    expect(question.choices[0]).not.toBe(question.choices[1])
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

it('tests your as ownership rather than changing the object', () => {
  for (const item of [...lessonTwoWords,...lessonTwoPairs]) for (const plural of item.singular ? [false,true] : [true]) {
    const expected=numberSentence(item,plural,'your')
    const question=lessonTwoReviewQuestions.find(q=>q.english===expected.english)!
    expect(question.answers[1][0].text).toBe(numberSentence(item,plural,'my').thai)
  }
})
