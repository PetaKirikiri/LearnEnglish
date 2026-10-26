// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest'
import { homeworkQuestion, lessonQuestions, lessonSchema, readLessons, saveLesson, type ClassLesson } from './lessons'
import { bundledHotelQuestions, type Progress } from '../hotel/course'
const db=vi.hoisted(()=>({from:vi.fn()}))
vi.mock('../lib/supabase',()=>({supabase:db}))
const lesson:ClassLesson={id:'e3139a00-2222-4333-8444-a12345678901',number:1,title:'First class',date:'2026-10-24',skills:[bundledHotelQuestions[0].skill],published:true}
afterEach(()=>{localStorage.clear();vi.clearAllMocks()})
it('uses internal documents and requires assigned homework',()=>{
  expect(lessonSchema.safeParse(lesson).success).toBe(true)
  expect(lessonSchema.safeParse({...lesson,skills:[]}).success).toBe(false)
  expect(lessonSchema.parse({...lesson,document:'https://docs.google.com/document/d/old'})).not.toHaveProperty('document')
})
it('persists and edits preview lessons without touching the shared database',async()=>{
  await saveLesson(lesson,true)
  await saveLesson({...lesson,title:'Updated'},true)
  expect(await readLessons(true)).toEqual([{...lesson,title:'Updated'}])
  expect(db.from).not.toHaveBeenCalled()
})
it('filters homework to the assigned skills and cycles distinct questions',()=>{
  const pool=lessonQuestions(lesson,bundledHotelQuestions)
  expect(pool.length).toBeGreaterThan(1)
  expect(pool.every(q=>lesson.skills.includes(q.skill))).toBe(true)
  expect(homeworkQuestion(pool,{}).id).toBe(pool[0].id)
  expect(homeworkQuestion(pool,{},pool[0].id).id).toBe(pool[1].id)
  const progress:Progress={[pool[0].skill]:{seen:[],correct:1,attempts:1,items:{[pool[0].id]:{attempts:1,streak:1,firstCorrect:1,lastCorrect:1,retained:false}}}}
  expect(homeworkQuestion(pool,progress).id).toBe(pool[1].id)
  expect(homeworkQuestion([pool[0]],{},pool[0].id)).toBe(pool[0])
  expect(()=>homeworkQuestion([],{})).toThrow('No questions assigned')
})
