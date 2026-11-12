import {expect,it} from 'vitest'
import {subjectCanPerform} from './actionSemantics'
import {actionDialogue,objectsForAction} from './actionDialogue'
import {everydayPeopleCatalogue} from '../everydayVocabulary'
import {allPracticeCandidates} from '../../race/generatedPracticeContent'
import {numberItem} from '../../race/numberCatalogue'
it('rejects child driving in composition and both sides of generated questions',()=>{
 for(const noun of ['boy','boys','girl','girls','son','sons','daughter','daughters']){
  const subject={word:`the ${noun}`,kind:'person' as const,phrase:{noun,nounThai:''}}
  expect(subjectCanPerform(subject,'driving')).toBe(false)
  expect(()=>actionDialogue('he','driving',{subject,vocabulary:everydayPeopleCatalogue})).toThrow('depicted subject')
  expect(subjectCanPerform(subject,'reading')).toBe(true)
 }
 for(const noun of ['man','woman','mother','father','doctor'])expect(subjectCanPerform({word:`the ${noun}`},'driving')).toBe(true)
 const documents=allPracticeCandidates().flatMap(q=>[q.document,...(q.alternatives??[])])
 expect(documents.some(d=>/\bdriving\b/.test(d.english))).toBe(true)
 expect(documents.filter(d=>/\b(?:boy|boys|girl|girls|son|sons|daughter|daughters)\s+(?:is|are)\s+driving\b/i.test(d.english))).toEqual([])
},15000)
it('distinguishes natural affordances instead of allowing every object with every action',()=>{
 const compatible=(verb:string,noun:string)=>objectsForAction(verb,[numberItem(noun)!]).length>0
 for(const [verb,noun] of [['holding','racket'],['opening','umbrella'],['washing','shirt'],['cleaning','table'],['cleaning','air conditioner'],['reading','passport']])expect(compatible(verb,noun),`${verb} ${noun}`).toBe(true)
 for(const [verb,noun] of [['eating','phone'],['drinking','bottle'],['reading','shoe'],['holding','school'],['washing','laptop'],['opening','apple'],['cleaning','water']])expect(compatible(verb,noun),`${verb} ${noun}`).toBe(false)
})
