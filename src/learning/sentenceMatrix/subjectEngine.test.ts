import { expect,it } from 'vitest'
import { subjectQuestion,subjectModes,subjectVerb,subjectForVerb,subjectVerbChoices,subjectPronouns,type SubjectModeConfig } from './subjectEngine'
const config:SubjectModeConfig={pronouns:[{word:'we',thai:'พวกเรา',person:1,number:'plural'},{word:'it',thai:'มัน',person:3}],names:[{word:'Maya',thai:'Maya'}],initialPronoun:'it'}
it('builds questions and agreement from an arbitrary lesson catalogue',()=>{
 expect(subjectQuestion(config,'pronoun').english).toBe('Where is it?')
 expect(subjectQuestion(config,'pronoun','we').english).toBe('Where are we?')
 expect(subjectQuestion(config,'name','Maya').english).toBe('Where is Maya?')
 expect(subjectQuestion(config,'name','Bia').item.word).toBe('Maya')
 expect(subjectQuestion(config,'name').units.map(item=>item.english).join(' ')).toBe('Where is Maya?')
 expect(subjectVerb({word:'I',thai:'ฉัน',person:1})).toBe('am')
 expect(subjectVerb({word:'you',thai:'คุณ',person:2})).toBe('are')
})
it('only exposes configured modes and rejects empty mode content',()=>{
 expect(subjectModes({pronouns:[],names:config.names})).toEqual(['noun','name'])
 expect(()=>subjectQuestion({pronouns:[],names:[]},'name')).toThrow('No configured words')
})

it('selects compatible subjects while preserving an existing match and respecting the supplied catalogue',()=>{
 expect(subjectForVerb(subjectPronouns,'are','he')?.word).toBe('you')
 expect(subjectForVerb(subjectPronouns,'is','she')?.word).toBe('she')
 expect(subjectForVerb(subjectPronouns,'is','you')?.word).toBe('he')
 expect(subjectForVerb(subjectPronouns,'am','you')?.word).toBe('I')
 expect(subjectForVerb(config.pronouns,'are','it')?.word).toBe('we')
 expect(subjectForVerb(config.names,'are')).toBeUndefined()
 expect(subjectVerbChoices(config.names).map(item=>item.word)).toEqual(['is'])
})
