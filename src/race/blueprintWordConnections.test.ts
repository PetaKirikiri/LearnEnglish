import {expect,it} from 'vitest'
import {blueprintFrames,type Part} from '../learning/sentenceRules/blueprintCatalogue'
import {blueprintWordConnections} from './blueprintWordConnections'
import {practiceBlueprintRequest} from '../learning/sentenceRules/practiceBlueprintRequest'
const frame=(id:string)=>blueprintFrames.find(frame=>frame.id===id)!
const part=(id:string,role:string)=>frame(id).parts.find(part=>part.role===role)!
const words=(id:string,slot:Part,context:Parameters<typeof blueprintWordConnections>[2]={})=>blueprintWordConnections(frame(id),slot,context).map(word=>word.word)
it('binds fixed question words, prepositions and doing to their exact words',()=>{
 for(const blueprint of blueprintFrames)for(const slot of blueprint.parts)if(slot.binding.type==='literal')expect(blueprintWordConnections(blueprint,slot)).toEqual([{word:slot.binding.word,form:'word'}])
})
it('selects subject case and subject agreement across all three noun block forms',()=>{
 const subject=part('where','subject'),choices=blueprintWordConnections(frame('where'),subject)
 expect(choices.map(word=>word.word)).toEqual(expect.arrayContaining(['she','I','you','Bia','the man']))
 expect(choices.map(word=>word.word)).not.toContain('her')
 const av=frame('where').parts.find(part=>part.binding.type==='present-av')!
 for(const [word,be] of [['I','am'],['you','are'],['she','is'],['Bia','is'],['the men','are']]){
  const selected=choices.find(choice=>choice.word===word)!
  expect(selected,word).toBeDefined()
  expect(words('where',av,{subject:selected.subject})).toEqual([be])
 }
})
it('restricts transitive verbs and objects using their reviewed affordances',()=>{
 const id='transitive-object',object=part(id,'object')
 expect(words(id,object,{verb:'drinking'})).toContain('the water')
 expect(words(id,object,{verb:'drinking'})).not.toContain('the phone')
 const holding=words(id,object,{verb:'holding'})
 expect(holding).toContain('the phone');expect(holding).toContain('it');expect(holding).not.toContain('she')
 const verbs=frame(id).parts.find(part=>part.binding.type==='action')!
 expect(words(id,verbs,{object:'phone'})).not.toContain('drinking')
 expect(words(id,verbs,{object:'phone'})).toContain('holding')
})
it('rejects child driving and limits location words and deictics',()=>{
 const id='intransitive-to-object'
 expect(words(id,part(id,'subject'),{verb:'driving'})).not.toContain('the boy')
 const locations=words('location',part('location','location'))
 expect(locations).toContain('Central');expect(locations).not.toContain('the phone');expect(locations).not.toContain('here')
 expect(words('identify-question',part('identify-question','subject'))).toEqual(['this','that','these','those'])
})
it('shares the displayed action frames with practice requests',()=>{
 expect(practiceBlueprintRequest(6).blueprints.map(frame=>frame.id)).toEqual(['transitive-object'])
 expect(practiceBlueprintRequest(5,'destination').blueprints.map(frame=>frame.id)).toEqual(['intransitive-to-object'])
 expect(practiceBlueprintRequest(4).blueprints.map(frame=>frame.id)).toEqual(['activity'])
})
it('carries deictic number into AV and identification complement agreement',()=>{
 const reference=blueprintWordConnections(frame('identify-question'),part('identify-question','subject')).find(choice=>choice.word==='these')!
 const av=frame('identify-question').parts.find(part=>part.binding.type==='present-av')!
 expect(words('identify-question',av,{subject:reference.subject})).toEqual(['are'])
 const complements=words('identify-answer',part('identify-answer','complement'),{subject:reference.subject})
 expect(complements).toContain('the hotels');expect(complements).not.toContain('the hotel');expect(complements).not.toContain('Bia')
})
