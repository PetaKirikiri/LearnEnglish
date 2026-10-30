import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {numberCatalogue,numberAudio} from '../src/race/numberCatalogue'
import {lessonThreeMatrixCatalogue} from '../src/classroom/wordCatalogue'
import {tonightWords} from '../src/race/tonightVocabulary'
import {pluralVocabulary,pairVocabulary} from '../src/race/pluralVocabulary'
const manifest=JSON.parse(readFileSync('public/audio/number-foundation/voice-manifest.json','utf8'))
const problems:string[]=[]
for(const item of numberCatalogue){
 const base=item.singular??item.word
 const artLesson=tonightWords.some(([word])=>word===base)?'one':pluralVocabulary.some(q=>q.singular===base)||pairVocabulary.some(q=>q.plural===base)?'two':'three'
 const art=`/classroom/icons/level-${artLesson}/${base.replaceAll(' ','-')}.png`
 if(!existsSync(`public${art}`))problems.push(`${item.word}: missing artwork ${art}`)
 for(const sentence of [false,true,'mismatch'] as const){
  const audio=sentence==='mismatch'?`/audio/number-foundation/where-${item.pluralForm?'is':'are'}-the-${item.word.replaceAll(' ','-')}.wav`:numberAudio(item.word,sentence),entry=manifest[audio.split('/').at(-1)!]
  const text=sentence?`Where ${sentence==='mismatch'?(item.pluralForm?'is':'are'):(item.pluralForm?'are':'is')} the ${item.word}?`:`the ${item.word}`
  if(!existsSync(`public${audio}`)||entry?.text!==text)problems.push(`${item.word}: missing or mismatched audio ${audio}`)
 }
}
const rejected=lessonThreeMatrixCatalogue.filter(q=>!numberCatalogue.some(item=>item.word===q.word)).map(q=>q.word)
const report={eligibleForms:numberCatalogue.length,lessons:Object.fromEntries([1,2,3].map(lesson=>[lesson,numberCatalogue.filter(q=>q.lesson===lesson).length])),verbOnly:numberCatalogue.filter(q=>q.pairOnly).map(q=>q.word),recordings:numberCatalogue.length*3,rejected,problems}
mkdirSync('reports',{recursive:true});writeFileSync('reports/number-recall.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))
if(problems.length)process.exitCode=1
