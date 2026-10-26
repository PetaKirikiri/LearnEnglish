import { expect, it } from 'vitest'
import { recordSuccessExposure, successWordOpacity, successWordUnits } from './familiarity'
import type { WordFamiliarity } from '../hotel/wordFamiliarity'

it('fades each encountered unit, not every word evenly',()=>{
  let memory=recordSuccessExposure({},'A b c d',true,false)
  memory=recordSuccessExposure(memory,'A c d',true,false)
  expect(memory.b.strength).toBe(1)
  for(const word of ['a','c','d'])expect(memory[word].strength).toBe(2)
  expect(successWordOpacity(memory,'a')).toBe(.75)
  expect(successWordOpacity(memory,'b')).toBe(.875)
})
it('evaporates completely and returns one step per wrong answer',()=>{
  let memory:WordFamiliarity={}
  for(let i=0;i<8;i++) memory=recordSuccessExposure(memory,'Where is the ball?',true,false)
  for(const word of ['where','is','the','ball'])expect(successWordOpacity(memory,word)).toBe(0)
  memory=recordSuccessExposure(memory,'Where is the ball?',false,false)
  expect(successWordOpacity(memory,'ball')).toBe(.125)
  memory=recordSuccessExposure(memory,'Where is the ball?',false,false)
  expect(successWordOpacity(memory,'ball')).toBe(.25)
  memory=recordSuccessExposure(memory,'Where is the ball?',true,true)
  expect(successWordOpacity(memory,'ball')).toBe(.25)
})
it('keeps how much and how many whole in real sentences without leaking progress',()=>{
  expect(successWordUnits('How many hours are you playing?')).toEqual(['How many','hours','are','you','playing'])
  const memory=recordSuccessExposure({},'How much is racket hire?',true,false)
  expect(memory['how much'].strength).toBe(1)
  expect(memory.how).toBeUndefined()
  expect(successWordOpacity(memory,'How many')).toBe(1)
})
