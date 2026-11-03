import {meaningForWord} from './blueprints'
import {categoriesForWord,type VocabularyCategory} from '../sentenceMatrix/vocabularyCategories'
import {allDeterminers,type Determiner,type ClassroomWord} from '../sentenceMatrix/model'
import {nounPhraseUnits,type NounPhrase} from '../sentenceMatrix/nounPhrase'
import {subjectVerb,subjectPronouns,type SubjectWord} from '../sentenceMatrix/subjectEngine'
/** Verb frames own their object requirements; lesson views never assemble arbitrary phrases. */
export type ObjectCategory = 'food' | 'drink' | 'readable' | 'destination' | 'holdable' | 'openable' | 'washable'
export type Action = {level?:number;word:string;thai:string;complement:'object'|'destination'|'none';objects:readonly ObjectCategory[];categories:readonly VocabularyCategory[];icon:string}
export type ActionObject = {word:string;thai:string;noun:string;phrase:NounPhrase;categories:readonly ObjectCategory[];icon?:string}
export const actionVocabulary:readonly Action[] = [
 {word:'eating',categories:['food'],icon:'/classroom/icons/actions/eating.png',thai:'กิน',complement:'object',objects:['food']},
 {word:'drinking',categories:['food'],icon:'/classroom/icons/actions/drinking.png',thai:'ดื่ม',complement:'object',objects:['drink']},
 {word:'sleeping',categories:['places'],icon:'/classroom/icons/actions/sleeping.png',thai:'นอน',complement:'none',objects:[]},
 {word:'running',categories:['sports'],icon:'/classroom/icons/actions/running.png',thai:'วิ่ง',complement:'none',objects:[]},
 {word:'walking',categories:['places', 'sports'],icon:'/classroom/icons/actions/walking.png',thai:'เดิน',complement:'none',objects:[]},
 {word:'playing',categories:['sports'],icon:'/classroom/icons/actions/playing.png',thai:'เล่น',complement:'none',objects:[]},
 {word:'reading',categories:['everyday'],icon:'/classroom/icons/actions/reading.png',thai:'อ่าน',complement:'object',objects:['readable']},
 {word:'going',categories:['places', 'transport'],icon:'/classroom/icons/actions/walking.png',thai:'ไป',complement:'destination',objects:['destination']},
 {word:'holding',level:6,categories:['everyday'],icon:'/classroom/icons/actions/holding.png',thai:'ถือ',complement:'object',objects:['holdable']},
 {word:'opening',level:6,categories:['everyday'],icon:'/classroom/icons/actions/opening.png',thai:'เปิด',complement:'object',objects:['openable']},
 {word:'washing',level:6,categories:['everyday'],icon:'/classroom/icons/actions/washing.png',thai:'ล้าง',complement:'object',objects:['washable']},
]
export type ActionSubject = Lowercase<typeof subjectPronouns[number]['word']>
/** Legacy dialogue replies retain you → I; all person and agreement data is shared. */
export const actionSubjects = Object.fromEntries(subjectPronouns.map(subject => {
 const reply = subject.word === 'you' ? subjectPronouns.find(item => item.word === 'I')! : subject
 return [subject.word.toLowerCase(), {questionBe:subjectVerb(subject),answer:reply.word.charAt(0).toUpperCase()+reply.word.slice(1),answerBe:subjectVerb(reply),thai:subject.thai,answerThai:reply.thai}]
})) as Record<ActionSubject,{questionBe:'am'|'is'|'are';answer:string;answerBe:'am'|'is'|'are';thai:string;answerThai:string}>
/** Semantic compatibility narrows the cumulative lesson catalogue, never replaces it. */
export function actionContextsForWord(word:ClassroomWord):ObjectCategory[]{
 const categories=categoriesForWord(word),meaning=meaningForWord(word),base=word.singular??word.word
 if(meaning?.actionContexts)return [...meaning.actionContexts]
 return [
  ...(['phone','bag','key','book','cup','plate','apple','banana'].includes(base)?['holdable' as const]:[]),
  ...(['book','bag','door','window'].includes(base)?['openable' as const]:[]),
  ...(['cup','plate','apple'].includes(base)?['washable' as const]:[]),
  ...(categories.includes('food')?['food' as const]:[]),
  ...(base==='book'?['readable' as const]:[]),
  ...(meaning?.kind==='place'||meaning?.roles?.includes('destination')?['destination' as const]:[]),
 ]
}
export function objectsForAction(word:string,catalogue:readonly ClassroomWord[]){
 const action=actionVocabulary.find(item=>item.word===word)
 if(!action||action.complement==='none')return []
 const candidates=catalogue.map(item=>{
  const contexts=actionContextsForWord(item)
  const plural=item.number==='plural'||item.pairOnly
  const mass=meaningForWord(item)?.countability==='mass'
  const determiner=action.complement==='destination'||plural?{english:'the',thai:'ที่กำลังพูดถึง'}:mass?undefined:{english:item.indefiniteArticle??(/^[aeiou]/i.test(item.word)?'an':'a'),thai:`หนึ่ง${item.classifierThai??''}`}
  const phrase:NounPhrase={noun:item.word,nounThai:item.thai,determiner,...(action.complement==='destination'?{preposition:{english:'to',thai:'ที่'}}:{})}
  return {noun:item.word,phrase,categories:contexts,word:nounPhraseUnits(phrase).map(unit=>unit.english).join(' '),thai:action.complement==='destination'?`ไปที่${item.thai}`:determiner&&['a','an'].includes(determiner.english)?`${item.thai}${determiner.thai}`:item.thai} satisfies ActionObject
 })
 return candidates.filter(object=>
  object.categories.includes('destination')===(action.complement==='destination')&&
  object.categories.some(category=>action.objects.includes(category)))
}
export function objectDeterminers(object:ActionObject,allowed?:readonly Determiner[]){
 const article=object.phrase.determiner
 return [...(article&&['a','an'].includes(article.english)?[{word:article.english as Determiner,thai:article.thai}]:[]),...allDeterminers.filter(item=>!['a','an'].includes(item.word))].filter(item=>!allowed||allowed.includes(item.word))
}
export const actionConstruction = {
 id:'present-action-dialogue',subjectKind:'person',actionForm:'present-participle',
 allowedCategories:['food','drink','readable','destination'] as const,objectPolicy:'verb-frame',
} as const
export function actionDialogue(subject:ActionSubject,word:string,selection:{vocabulary:readonly ClassroomWord[];determiner?:Determiner;object?:string;subject?:SubjectWord;destination?:SubjectWord}){
 const person=actionSubjects[subject],action=actionVocabulary.find(item=>item.word===word)
 if(!person||!action)throw new Error('Choose a reviewed person and action.')
 if(selection.subject&&selection.subject.kind!=='person')throw new Error('This action needs a person.')
 if(selection.destination&&(action.complement!=='destination'||selection.destination.kind!=='place'))throw new Error('This action does not accept a named place.')
 const speaker=selection.subject
 const questionSubject=speaker?.word??(subject==='i'?'I':subject)
 const answerWord=speaker?.word??person.answer
 const answerSubject=answerWord.charAt(0).toUpperCase()+answerWord.slice(1)
 const be=speaker?subjectVerb(speaker):person.answerBe
 const questionBe=speaker?subjectVerb(speaker):person.questionBe
 const objects=objectsForAction(word,selection.vocabulary)
 const chosenObject=selection.object===undefined?objects[0]:objects.find(item=>item.word===selection.object)
 if(selection.object!==undefined&&!chosenObject)throw new Error('This object does not fit the action.')
 const baseObject:ActionObject|undefined=selection.destination?{word:`to ${selection.destination.word}`,thai:`ไปที่${selection.destination.thai}`,noun:selection.destination.word,phrase:{noun:selection.destination.word,nounThai:selection.destination.thai,preposition:{english:'to',thai:'ที่'}},categories:['destination'] as const}:chosenObject
 const selectedDeterminer=selection.determiner&&chosenObject?objectDeterminers(chosenObject).find(item=>item.word===selection.determiner||(['a','an'].includes(item.word)&&['a','an'].includes(selection.determiner!))):undefined
 if(selection.determiner&&!selection.destination&&!selectedDeterminer)throw new Error('This determiner does not fit the noun.')
 const object=baseObject&&selectedDeterminer&&!selection.destination?{...baseObject,phrase:{...baseObject.phrase,determiner:{english:selectedDeterminer.word,thai:selectedDeterminer.thai}}}:baseObject
 const subjectParts=(answer:boolean)=>speaker?.phrase
  ?nounPhraseUnits(speaker.phrase).map((unit,index)=>({...unit,english:answer&&index===0?unit.english.charAt(0).toUpperCase()+unit.english.slice(1):unit.english,role:unit.role==='determiner'?'person-determiner' as const:'person' as const}))
  :[{english:answer?answerSubject:questionSubject,thai:speaker?.thai??(answer?person.answerThai:person.thai),role:'person' as const}]
 const units=[...subjectParts(true),{english:be as string,thai:'กำลัง',role:'be' as const},
 {english:action.word,thai:action.thai,role:'action' as const},...(object?nounPhraseUnits(object.phrase).map(unit=>({...unit,role:unit.role==='noun'?'object' as const:unit.role})):[])]
 units[units.length-1]={...units[units.length-1],english:units[units.length-1].english+'.'}
 const objectMeaning=object?(selectedDeterminer&&['the','my','your','his','her','our','their'].includes(selectedDeterminer.word)?object.phrase.nounThai+(selectedDeterminer.word==='the'?'':selectedDeterminer.thai.replace(/ \(.*\)/,'')):object.thai.replace(/^ไปที่/,'')):''
 const meaning=action.complement==='destination'?`ไปที่${objectMeaning}`:`${action.thai}${objectMeaning}`
 return {
 question:{english:`What ${questionBe} ${questionSubject} doing?`,thai:`${speaker?.thai??person.thai}กำลังทำอะไร`,units:[{english:'What',thai:'อะไร',role:'question' as const},{english:questionBe,thai:'—',role:'be' as const},...subjectParts(false),{english:'doing?',thai:'กำลังทำ',role:'action' as const}]},
 answer:{english:units.map(unit=>unit.english).join(' '),thai:`${speaker?.thai??person.answerThai}กำลัง${meaning}`,units},object,
 }
}
