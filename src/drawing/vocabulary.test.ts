import {it,expect} from 'vitest'
import {drawingVocabulary} from './vocabulary'
import {lessonThreeMatrixCatalogue} from '../classroom/wordCatalogue'
it('draws only singular course nouns with matching Thai prompts',()=>{for(const v of drawingVocabulary){const course=lessonThreeMatrixCatalogue.find(w=>w.word===v.word)!;expect(course).toBeDefined();expect(v.thai).toBe(course.thai);expect(course.number).not.toBe('plural');expect(v.english).toMatch(/^an? /)}expect(drawingVocabulary.some(w=>['cat','dog','flower','house','water','glasses'].includes(w.word))).toBe(false)})
it('uses only the six existing core words as the new-learner fallback',()=>{expect(drawingVocabulary.filter(w=>w.starter).map(w=>w.word).sort()).toEqual(['bag','book','key','pen','shoe','sock']);expect(drawingVocabulary.find(w=>w.word==='apple')?.english).toBe('an apple')})
