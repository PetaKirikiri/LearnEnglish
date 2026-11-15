import {expect,it} from 'vitest'
import {addStructureResult,structureForSentence,type StructureScores} from './blueprintScores'
it('groups noun, pronoun and proper-name subjects in the same structure',()=>{
 for(const sentence of ['Where is the man?','Where are they?','Where is Bia?'])expect(structureForSentence(sentence)).toBe('where')
})
it('separates questions, action frames and identification from noun phrases',()=>{
 expect(structureForSentence('What is she doing?')).toBe('activity')
 expect(structureForSentence('She is holding the bag.')).toBe('transitive-object')
 expect(structureForSentence('Bia is walking to the school.')).toBe('intransitive-to-object')
 expect(structureForSentence('She is at the school.')).toBe('location')
 expect(structureForSentence('What is that over there?')).toBe('identify-question')
 expect(structureForSentence('Those are dogs.')).toBe('identify-answer')
 for(const sentence of ['the dog','red bags','She was holding the bag.','She is sitting on the chair.'])expect(structureForSentence(sentence)).toBeNull()
})
it('counts each saved answer once, and keeps listening successes separate',()=>{
 const scores:StructureScores={}
 addStructureResult(scores,{sentence:'Where is she?',correct:true,modality:'audio'})
 addStructureResult(scores,{sentence:'Where is Bia?',correct:false,modality:'audio'})
 addStructureResult(scores,{sentence:'Where are the dogs?',correct:true,modality:'visible'})
 addStructureResult(scores,{sentence:'the dog',correct:true,modality:'audio'})
 expect(scores).toEqual({where:{attempts:3,correct:2,listeningCorrect:1}})
})
