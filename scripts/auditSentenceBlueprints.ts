import {existsSync,mkdirSync,writeFileSync} from 'node:fs'
import {lessonOneCatalogue,lessonTwoMatrixCatalogue,lessonThreeMatrixCatalogue} from '../src/classroom/wordCatalogue'
import {validateSentence,meaningForWord,sentenceBlueprints,type RuleIssue} from '../src/learning/sentenceRules/blueprints'
import {people,locationWords} from '../src/learning/sentenceMatrix/peopleLocation'
import {lessonThreePeopleQuestions,lessonThreeAnswerQuestions,lessonThreeReviewQuestions} from '../src/race/lessonThreeQuestions'
import {nounsForSentence,blueprintsForNoun} from '../src/learning/sentenceRules/choices'
import {vocabularyIntegrity} from '../src/learning/sentenceRules/vocabularyAudit'
import {questionIntegrity,auditWhereNoun} from '../src/learning/sentenceRules/questionAudit'
import {tonightMeaningQuestions,tonightJudgementQuestions} from '../src/race/tonightQuestions'
import {holidayMeaningQuestions,holidayQuestions} from '../src/race/holidayQuestions'
import {holidayVocabulary} from '../src/race/holidayVocabulary'
import {lessonTwoNumberQuestions,lessonTwoOwnerQuestions,lessonTwoReviewQuestions} from '../src/race/lessonTwoQuestions'
const banks={tonightMeaningQuestions,tonightJudgementQuestions,holidayMeaningQuestions,holidayQuestions,lessonTwoNumberQuestions,lessonTwoOwnerQuestions,lessonTwoReviewQuestions,lessonThreePeopleQuestions,lessonThreeAnswerQuestions,lessonThreeReviewQuestions}
const assetWarnings:{id:string;code:string;path:string}[]=[]
const findings:{id:string;blueprint:string;sentence?:string;issues:RuleIssue[]}[]=[]
let checked=0,expectedNegatives=0
for(const [lesson,catalogue] of Object.entries({lesson1:lessonOneCatalogue,lesson2:lessonTwoMatrixCatalogue,lesson3:lessonThreeMatrixCatalogue})){
 checked+=catalogue.length
 for(const issue of vocabularyIntegrity(catalogue))findings.push({id:`${lesson}:${issue.word}`,blueprint:'vocabulary',issues:[issue]})
 for(const noun of catalogue)for(const determiner of ['the','my','your']){
  const verb=noun.number==='plural'||noun.pairOnly?'are':'is'
  const sentence=`Where ${verb} ${determiner} ${noun.word}?`
  const issues=validateSentence({blueprint:'where-noun',noun,verb,determiner});checked++
  if(issues.length)findings.push({id:`${lesson}:${noun.word}:${determiner}`,blueprint:'where-noun',sentence,issues})
 }
}
for(const q of lessonThreePeopleQuestions){
 const match=q.english.match(/^Where (am|is|are) (I|you|he|she)\?$/)!
 const subject=people.find(p=>p.word===match[2])!
 const issues=validateSentence({blueprint:'where-person',subject,verb:match[1]})
 const expectedWrong=q.correct===1;checked++
 if(expectedWrong&&issues.length)expectedNegatives++
 else if(expectedWrong||issues.length)findings.push({id:q.id,blueprint:'where-person',sentence:q.english,issues:issues.length?issues:[{code:'negative-example-is-valid',slot:'sentence',word:q.english,message:'This wrong example is grammatical.'}]})
}
for(const noun of locationWords(lessonThreeMatrixCatalogue))for(const subject of people){
 const issues=validateSentence({blueprint:'person-at-place',noun,subject,verb:subject.verb,determiner:'the'});checked++
 if(issues.length)findings.push({id:`answer:${subject.word}:${noun.word}`,blueprint:'person-at-place',issues})
}
for(const q of [...lessonThreeAnswerQuestions,...lessonThreeReviewQuestions]){
 checked++
 const match=q.english.match(/^(?:Where (?:am|is|are) (?:I|you|he|she)\? )?(I|You|He|She) (am|is|are) at the (.+)\.$/)
 if(!match){findings.push({id:q.id,blueprint:'person-at-place',sentence:q.english,issues:[{code:'unrecognised-construction',slot:'sentence',word:q.english,message:'Register this construction before generating it.'}]});continue}
 const subject=people.find(p=>p.word.toLowerCase()===match[1].toLowerCase())!
 const noun=lessonThreeMatrixCatalogue.find(w=>w.word===match[3])
 const issues=validateSentence({blueprint:'person-at-place',subject,noun,verb:match[2],determiner:'the'})
 if(issues.length)findings.push({id:q.id,blueprint:'person-at-place',sentence:q.english,issues})
}
const allNouns=[...lessonThreeMatrixCatalogue,...holidayVocabulary]
let questionCount=0
for(const [bank,questions] of Object.entries(banks)){
 const ids=new Set<string>()
 for(const q of questions){
  questionCount++;checked++
  const issues=questionIntegrity(q)
  if(ids.has(q.id))issues.push({code:'duplicate-id',slot:'question',word:q.id,message:'Question ID occurs twice in this bank.'})
  ids.add(q.id)
  if(q.audioUrl&&!existsSync(`public${q.audioUrl}`))assetWarnings.push({id:q.id,code:'missing-audio',path:q.audioUrl})
  if(!q.audioUrl)assetWarnings.push({id:q.id,code:'unrecorded-prompt',path:''})
  if(!bank.startsWith('lessonThree')){
   const structural=auditWhereNoun(q,allNouns)
   const judgement=q.answers[0]?.[0]?.text==='Correct'&&q.answers[1]?.[0]?.text==='Wrong'
   const expected=judgement&&q.correct===1
   const intended=q.id.includes('missing-is')?'noun-agreement':q.id.includes('missing-determiner')||q.id.includes('missing-the')?'missing-determiner':expected?'noun-agreement':null
   if(expected){
    if(structural.some(issue=>issue.code===intended))expectedNegatives++
    else issues.push({code:'incorrect-negative-example',slot:'sentence',word:q.english,message:'The expected grammar violation is absent.'})
    issues.push(...structural.filter(issue=>issue.code!==intended))
   }else issues.push(...structural)
  }
  if(issues.length)findings.push({id:q.id,blueprint:bank,sentence:q.english,issues})
 }
}
const compatibilityCoverage=Object.fromEntries(lessonThreeMatrixCatalogue.map(noun=>[noun.word,blueprintsForNoun(noun)]))
for(const blueprint of ['where-noun','person-at-place'] as const){
 const offered=nounsForSentence({blueprint,determiner:'the',subject:people[0],...(blueprint==='person-at-place'?{verb:'am'}:{})},lessonThreeMatrixCatalogue)
 for(const noun of lessonThreeMatrixCatalogue){
  checked++
  if(offered.includes(noun)!==compatibilityCoverage[noun.word].includes(blueprint))findings.push({id:`bidirectional:${blueprint}:${noun.word}`,blueprint,issues:[{code:'selection-validation-disagreement',slot:'noun',word:noun.word,message:'Forward and reverse eligibility disagree.'}]})
 }
}
const warningCounts=Object.fromEntries([...new Set(assetWarnings.map(item=>item.code))].map(code=>[code,assetWarnings.filter(item=>item.code===code).length]))
const report={checked,compatibilityCoverage,warningCounts,questionCount,assetWarnings,expectedNegatives,errors:findings.length,generatedQuestions:lessonThreePeopleQuestions.length+lessonThreeAnswerQuestions.length+lessonThreeReviewQuestions.length,blueprints:sentenceBlueprints,meaningCoverage:Object.fromEntries(lessonThreeMatrixCatalogue.map(word=>[word.word,meaningForWord(word)?.kind??'UNCLASSIFIED'])),findings}
mkdirSync('reports',{recursive:true});writeFileSync('reports/sentence-blueprints.json',JSON.stringify(report,null,2)+'\n')
writeFileSync('reports/sentence-blueprints.md',`# Sentence content audit\n\n${checked} checks across ${questionCount} authored questions.\n\n- Unexpected errors: ${findings.length}\n- Verified intentional grammar errors: ${expectedNegatives}\n- Audio warnings: ${assetWarnings.length}\n\n## Problems\n\n${findings.length?findings.map(item=>`- ${item.id}: ${item.issues.map(issue=>issue.code+' — '+issue.message).join('; ')}`).join('\n'):'No unexpected structural or answer-integrity problems found.'}\n\n## Audio coverage\n\n${Object.entries(warningCounts).map(([code,count])=>`- ${code}: ${count}`).join('\n')}\n\nUnrecorded prompts have no assigned recording; this does not mean a configured file is missing. Full question IDs and paths are in sentence-blueprints.json.\n`)
console.log(`${checked} checks; ${expectedNegatives} intentional incorrect examples verified; ${findings.length} problems. Report: reports/sentence-blueprints.json`)
console.log(`${questionCount} authored questions audited; ${assetWarnings.length} audio warnings.`)
for(const finding of findings)console.log(finding.id, finding.issues.map(i=>i.code+': '+i.word).join('; '))
if(findings.length)process.exitCode=1
