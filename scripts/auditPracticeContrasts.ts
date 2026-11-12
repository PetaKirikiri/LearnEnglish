import {assertBlueprintQuestion} from '../src/race/testing/blueprintIntegrity'
import {generatedCandidates,structureCandidates,determinerCandidates,sentenceKey} from '../src/race/generatedPracticeContent'
import type {PracticeLevel} from '../src/race/PracticeLevelPicker'
import {numberItem} from '../src/race/numberCatalogue'
import {determinerAgrees} from '../src/learning/sentenceRules/determiners'
import {meaningForWord} from '../src/learning/sentenceRules/blueprints'
import {subjectPronouns,subjectVerb} from '../src/learning/sentenceMatrix/subjectEngine'
// Audit the real construction banks, without generating replacement questions.
const bank=process.argv[2]??'6'
const questions=bank==='determiners'?determinerCandidates():/^[1-6]$/.test(bank)?generatedCandidates(Number(bank) as PracticeLevel):structureCandidates(bank as 'identify'|'location'|'destination')
let checked=0
const failures:unknown[]=[]
let agreementChecks=0
for(const question of questions){
 try{assertBlueprintQuestion(question)}catch(error){failures.push({question:question.id,sentence:question.document.english,reason:String(error)})}
 if(question.credit!==null)for(const doc of [question.document,...(question.alternatives??[])]){
  const units=doc.units
  for(let index=0;index<units.length;index++){
   const unit=units[index]
   if(['determiner','person-determiner'].includes(unit.role)){
    const noun=units[index+(units[index+1]?.role==='description'?2:1)],item=noun&&numberItem(sentenceKey(noun.english))
    if(item){
     agreementChecks++
     const determiner=sentenceKey(unit.english),mass=meaningForWord(item)?.countability==='mass'
     const article=item.indefiniteArticle??(/^[aeiou]/i.test(item.word)?'an':'a')
     if(!determinerAgrees(determiner,item.pluralForm,mass)||(['a','an'].includes(determiner)&&determiner!==article))failures.push({question:question.id,sentence:doc.english,reason:'Determiner/noun agreement'})
    }
   }
   if(unit.role==='be'){
    const subject=units.find(u=>['person','reference'].includes(u.role))??units.find(u=>u.role==='object')
    if(subject){
     agreementChecks++
     const word=sentenceKey(subject.english),pronoun=subjectPronouns.find(p=>p.word.toLowerCase()===word),item=numberItem(word)
     const expected=pronoun?subjectVerb(pronoun):['these','those'].includes(word)||item?.pluralForm?'are':'is'
     if(sentenceKey(unit.english)!==expected)failures.push({question:question.id,sentence:doc.english,reason:'Auxiliary agreement',expected})
    }
   }
  }
 }
 if(!question.alternatives)continue
 checked++
 const [a,b]=question.alternatives
 if(a.units.length!==b.units.length){failures.push({question:question.id,a:a.english,b:b.english,reason:'Different slot counts'});continue}
 const changed=a.units.flatMap((unit,index)=>sentenceKey(unit.english)!==sentenceKey(b.units[index].english)||unit.role!==b.units[index].role?[{role:unit.role,otherRole:b.units[index].role}]:[])
 const semantic=changed.filter(unit=>unit.role!=='be')
 if(!changed.length||semantic.length>1||changed.some(unit=>unit.role!==unit.otherRole))failures.push({question:question.id,a:a.english,b:b.english,changed})
}
console.log(JSON.stringify({bank,checked,agreementChecks,failures:failures.length,examples:failures.slice(0,4)}))
if(failures.length)process.exitCode=1
