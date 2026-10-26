import {expect,it} from 'vitest'
import {englishAlignment,alignEnglish} from './englishAlignment'
import {curriculumSchema,levels} from './schema'
import {scopeCurriculum} from './courseScope'
import snapshot from './syllabus.snapshot.json'

const data=curriculumSchema.parse(snapshot)
const english=scopeCurriculum(data,'english')
it('reviews every topic and orders the actual English catalogue by teaching band',()=>{
  expect(english.skills.map(s=>s.id)).toEqual(englishAlignment.map(s=>s.id))
  const bands=english.skills.map(s=>levels.indexOf(s.level))
  expect(bands).toEqual([...bands].sort((a,b)=>a-b))
  expect(english.skills.filter(s=>s.level==='A1')).toHaveLength(18)
  expect(english.skills.filter(s=>s.level==='A2')).toHaveLength(6)
  expect(english.skills.filter(s=>s.level==='B1')).toHaveLength(8)
  expect(english.skills.filter(s=>s.level==='B2')).toHaveLength(8)
  expect(()=>alignEnglish([...data.skills,{...data.skills[0],id:'unreviewed'}])).toThrow()
})
it('unlocks two topics at a time without skipping earlier bands',()=>{
  english.skills.forEach((s,i)=>{
    const start=Math.floor(i/2)*2
    expect(s.prerequisites).toEqual(english.skills.slice(Math.max(0,start-2),start).map(n=>n.id))
    expect(s.references[0].locator).toContain(s.level)
  })
})
it('only shows patterns present in this course, not harder Hotel patterns',()=>{
  const frames=(id:string)=>english.structures.find(s=>s.nodeId===id)!.frames.join(' ')
  expect(frames('negation')).not.toContain('participle')
  expect(frames('participants')).not.toContain('asked')
  expect(frames('focus')).not.toContain('Never have')
  expect(frames('past-events')).toContain('[past verb]')
  expect(english.skills.find(s=>s.id==='verb-shapes')!.level).toBe('B1')
  expect(english.skills.find(s=>s.id==='nuance')!.level).toBe('B1')
  // The English bank does not test the C1 inversion in the separate Hotel bank.
  expect(english.skills.some(s=>s.level==='C1'||s.level==='C2')).toBe(false)
  expect(levels.at(-1)).toBe('C2')
})
it('preserves Hotel ordering, levels, prerequisites, and every question identity',()=>{
  const hotel=scopeCurriculum(data,'hotel')
  for(const node of hotel.skills){
    const source=data.skills.find(s=>s.id===node.id)!
    expect(node.level).toBe(source.level)
    expect(node.order).toBe(source.order)
    expect(node.prerequisites).toEqual(source.prerequisites)
  }
  expect(english.questions).toHaveLength(2336)
  expect(hotel.questions).toHaveLength(294)
})
