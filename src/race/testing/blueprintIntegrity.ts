import assert from 'node:assert/strict'
import {nounGroupFor} from '../nounGroups'
import {defaultPersonNames} from '../../learning/sentenceRules/nominalReferences'
import {activeActionBlueprints,actionInBlueprint} from '../../learning/sentenceRules/actionBlueprints'
import {actionVocabulary,objectsForAction} from '../../learning/sentenceRules/actionDialogue'
import {actionWordForSurface} from '../../learning/sentenceRules/verbGroups'
import {subjectCanPerform} from '../../learning/sentenceRules/actionSemantics'
import {adjectiveFitsNoun} from '../../learning/sentenceRules/adjectiveSemantics'
import {determinerAgrees} from '../../learning/sentenceRules/determiners'
import {meaningForWord} from '../../learning/sentenceRules/blueprints'
import {subjectPronouns,subjectVerb} from '../../learning/sentenceMatrix/subjectEngine'
import {generatedNumberCatalogue,numberItem} from '../numberCatalogue'
import {sentenceKey} from '../generatedPracticeContent'
import type {GeneratedQuestion} from '../generatedPracticeContent'

/** Test-only observer: checks delivered units against the same reviewed word contracts.
 * It never supplies candidates, changes a blueprint, or awards learner progress. */
export function assertBlueprintDocument(doc:GeneratedQuestion['document']){
 const units=doc.units,context=doc.english
 assert.equal(units.map(unit=>unit.english).join(' '),context,`Missing/extra displayed slot: ${context}`)
 for(let index=0;index<units.length;index++){
  const unit=units[index],word=sentenceKey(unit.english)
  if(['determiner','person-determiner'].includes(unit.role)){
   const noun=units[index+(units[index+1]?.role==='description'?2:1)],item=noun&&numberItem(sentenceKey(noun.english))
   if(item){
    assert(determinerAgrees(word,item.pluralForm,meaningForWord(item)?.countability==='mass'),`Determiner agreement: ${context}`)
    if(['a','an'].includes(word))assert.equal(word,item.indefiniteArticle??(/^[aeiou]/i.test(item.word)?'an':'a'),`Article: ${context}`)
   }
  }
  if(unit.role==='description'){
   const noun=units[index+1]
   assert(noun&&adjectiveFitsNoun(word,sentenceKey(noun.english)),`Adjective affordance: ${context}`)
  }
  if(unit.role==='be'){
   const subject=units.find(u=>['person','reference'].includes(u.role))??units.find(u=>u.role==='object')
   assert(subject,`Missing auxiliary subject: ${context}`)
   const subjectWord=sentenceKey(subject.english),pronoun=subjectPronouns.find(p=>p.word.toLowerCase()===subjectWord),item=numberItem(subjectWord)
   const expected=pronoun?subjectVerb(pronoun):['these','those'].includes(subjectWord)||item?.pluralForm?'are':'is'
   assert.equal(word,expected,`Auxiliary agreement: ${context}`)
  }
 }
 if(doc.construction!=='action-answer')return
 const verb=units.find(unit=>unit.role==='action'),object=units.find(unit=>unit.role==='object'),subject=units.find(unit=>unit.role==='person')
 assert(verb&&object&&subject,`Action blueprint requires subject, verb and object: ${context}`)
 const prepositions=units.filter(unit=>unit.role==='preposition')
 assert(prepositions.length<=1&&prepositions.every(unit=>sentenceKey(unit.english)==='to'),`Invented connection: ${context}`)
 const connection=prepositions.length?'to':'direct',blueprint=activeActionBlueprints.find(item=>item.connection===connection)!
 const action=actionWordForSurface(sentenceKey(verb.english)),lexical=actionVocabulary.find(item=>item.word===action)
 assert(lexical&&actionInBlueprint(lexical,blueprint),`Verb does not support ${connection}: ${context}`)
 const subjectWord=sentenceKey(subject.english)
 assert(subjectPronouns.some(item=>item.word.toLowerCase()===subjectWord)||defaultPersonNames.some(item=>item.word.toLowerCase()===subjectWord)||nounGroupFor(subjectWord)==='subjects',`Non-agent action subject: ${context}`)
 const noun=sentenceKey(object.english)
 assert(objectsForAction(action,generatedNumberCatalogue,undefined,blueprint).some(item=>item.noun===noun),`Verb/object affordance: ${context}`)
 assert(subjectCanPerform({word:sentenceKey(subject.english)},action,noun),`Subject/action affordance: ${context}`)
}
export function assertBlueprintQuestion(question:GeneratedQuestion){
 // Intentional wrong-grammar judgements are assessed by their separate judgement contract.
 if(question.credit!==null)for(const doc of [question.document,...(question.alternatives??[])])assertBlueprintDocument(doc)
}
