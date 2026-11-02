import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import RandomMatrix,{randomExample} from './RandomMatrix'
import {classroomMatrices} from '../../classroom/matrixLessons'
it('uses valid cumulative sentence compositions without exposing Thai or help',()=>{
 for(const lesson of Object.values(classroomMatrices)){
  for(let i=0;i<100;i++){
   const example=randomExample(lesson)
   expect(example.english).not.toMatch(/undefined|eating.*hotel|sleeping.*the/)
   expect(example.units.map(unit=>unit.english).join(' ')).toBe(example.english)
  }
  const html=renderToStaticMarkup(<RandomMatrix lesson={lesson}/> )
  expect(html).not.toMatch(/[\u0E00-\u0E7F]/)
  expect(html).toContain('Randomise sentence')
  expect(html).not.toContain('example-unit-trigger')
 }
})
