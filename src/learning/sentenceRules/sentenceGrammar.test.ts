import {expect,it} from 'vitest'
import {activeActionBlueprints} from './actionBlueprints'
import {practiceBlueprintRequest} from './practiceBlueprintRequest'
it('declares present continuous and the correct finite and non-finite verb forms on the real action requests',()=>{
 for(const level of [4,5,6] as const){
  const request=practiceBlueprintRequest(level)
  expect(request.grammar?.tense).toBe('present')
  expect(request.grammar?.aspect).toBe('continuous')
  expect(request.grammar?.finiteVerb).toEqual({role:'auxiliary-verb',tense:'present',forms:['am','is','are']})
  expect(request.grammar).toHaveProperty('mainVerb.form','present-participle')
 }
 for(const frame of activeActionBlueprints)expect(frame.grammar).toBe(practiceBlueprintRequest(6).grammar)
})
it('keeps present-simple linking be distinct from continuous auxiliaries and leaves noun-only phrases untensed',()=>{
 expect(practiceBlueprintRequest(1).grammar).toBeUndefined()
 for(const structure of ['location','identify'] as const){
  const request=practiceBlueprintRequest(6,structure)
  expect(request.grammar?.aspect).toBe('simple')
  expect(request.grammar?.finiteVerb.role).toBe('linking-verb')
  expect(request.grammar).not.toHaveProperty('mainVerb')
 }
})
