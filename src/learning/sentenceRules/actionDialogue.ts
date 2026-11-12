import {actionInBlueprint,type ActionBlueprint,type ActionUses} from './actionBlueprints'
import {possessiveChoices,possessiveFor} from './possessives'
import {referencePhrase,type NominalReference} from './nominalReferences'
import {expandedActions} from './expandedActions'
import {subjectCanPerform,nounActionAffordances} from './actionSemantics'
import {determinerAgrees} from './determiners'
import {meaningForWord} from './blueprints'
import {categoriesForWord,type VocabularyCategory} from '../sentenceMatrix/vocabularyCategories'
import {allDeterminers,type Determiner,type ClassroomWord} from '../sentenceMatrix/model'
import {nounPhraseUnits,type NounPhrase} from '../sentenceMatrix/nounPhrase'
import {subjectVerb,subjectPronouns,type SubjectWord} from '../sentenceMatrix/subjectEngine'
/** Verb frames own their object requirements; lesson views never assemble arbitrary phrases. */
export type ObjectCategory = keyof typeof nounActionAffordances | 'food' | 'drink' | 'destination' | 'person' | 'spatial-target'
export type Action = {uses?:ActionUses;sentenceThai?:string;spoken?:string;preposition?:{english:string;thai:string};destination?:boolean;level?:number;word:string;thai:string;complement:'object'|'destination'|'none'|'prepositional';objects:readonly ObjectCategory[];categories:readonly VocabularyCategory[];icon:string}
export type ActionObject = {word:string;thai:string;noun:string;phrase:NounPhrase;categories:readonly ObjectCategory[];icon?:string;plural?:boolean;mass?:boolean}
export const actionVocabulary:readonly Action[] = [
 ...[{word:'talking',thai:'พูด'},{word:'listening',thai:'ฟัง'},{word:'driving',thai:'ขับรถ'}].map(action=>({...action,...(action.word==='driving'?{destination:true}:{uses:{to:{objects:['person'] as const,thai:action.word==='talking'?'กับ':'—',sentenceThai:action.word==='talking'?'พูดกับ':'ฟัง'}}}),categories:['everyday'] as const,icon:`/classroom/icons/everyday/${action.word}.webp`,complement:'none' as const,objects:[]})),
 {word:'eating',categories:['food'],icon:'/classroom/icons/actions/closeup/eating.png',thai:'กิน',complement:'object',objects:['food']},
 {word:'drinking',categories:['food'],icon:'/classroom/icons/actions/closeup/drinking.png',thai:'ดื่ม',complement:'object',objects:['drink']},
 {word:'sleeping',uses:{bare:{objects:[]},in:{objects:['sleep-inside'],thai:'ใน',sentenceThai:'นอนใน'},on:{objects:['sleep-surface'],thai:'บน',sentenceThai:'นอนบน'}},categories:['places'],icon:'/classroom/icons/actions/closeup/sleeping.png',thai:'นอน',complement:'none',objects:[]},
 {word:'running',uses:{to:{objects:['destination','person','spatial-target']}},destination:true,categories:['sports'],icon:'/classroom/icons/actions/closeup/running.png',thai:'วิ่ง',complement:'none',objects:[]},
 {word:'walking',uses:{to:{objects:['destination','person','spatial-target']}},destination:true,categories:['places', 'sports'],icon:'/classroom/icons/actions/closeup/walking.png',thai:'เดิน',complement:'none',objects:[]},
 {word:'playing',categories:['sports'],icon:'/classroom/icons/actions/closeup/playing.png',thai:'เล่น',complement:'none',objects:[]},
 {word:'reading',categories:['everyday'],icon:'/classroom/icons/actions/closeup/reading.png',thai:'อ่าน',complement:'object',objects:['readable']},
 {word:'going',uses:{to:{objects:['destination','person','spatial-target']}},destination:true,categories:['places', 'transport'],icon:'/classroom/icons/actions/closeup/walking.png',thai:'ไป',complement:'destination',objects:['destination']},
 {word:'holding',level:6,categories:['everyday'],icon:'/classroom/icons/actions/closeup/holding.png',thai:'ถือ',complement:'object',objects:['holdable']},
 {word:'opening',level:6,categories:['everyday'],icon:'/classroom/icons/actions/closeup/opening.png',thai:'เปิด',complement:'object',objects:['openable']},
 {word:'cleaning',level:6,categories:['everyday'],icon:'/classroom/icons/actions/expanded/cleaning.png',thai:'ทำความสะอาด',complement:'object',objects:['cleanable']},
 ...expandedActions,
 {word:'washing',level:6,categories:['everyday'],icon:'/classroom/icons/actions/closeup/washing.png',thai:'ล้าง',complement:'object',objects:['washable']},
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
  ...Object.entries(nounActionAffordances).flatMap(([context,nouns])=>nouns.has(base)?[context as ObjectCategory]:[]),
  ...(meaning?.kind==='person'?['person' as const]:[]),
  ...(meaning?.kind==='physical-object'&&meaning.countability!=='mass'?['spatial-target' as const]:[]),
  ...(categories.includes('food')?['food' as const]:[]),
  ...(meaning?.kind==='place'||meaning?.roles?.includes('destination')?['destination' as const]:[]),
 ]
}
/** Movement can stand alone or take a destination in the destination blueprint. */
export function actionForFrame(word:string, question?:'activity'|'destination',blueprint?:ActionBlueprint):Action|undefined {
 const lexical=actionVocabulary.find(item=>item.word===word)
 const action=lexical&&blueprint?actionInBlueprint(lexical,blueprint):lexical
 if(question!=='destination')return action
 if(!action||!action.destination)throw new Error('Destination questions require a movement verb.')
 return blueprint?action:{...action,complement:'destination',objects:['destination']}
}
const objectCache=new WeakMap<readonly ClassroomWord[],Map<string,ActionObject[]>>()
export function objectsForAction(word:string,catalogue:readonly ClassroomWord[],question?:'activity'|'destination',blueprint?:ActionBlueprint){
 const action=actionForFrame(word,question,blueprint)
 if(!action||action.complement==='none')return []
 const key=`${word}:${question??'activity'}:${JSON.stringify(blueprint??null)}`,cached=objectCache.get(catalogue)?.get(key)
 if(cached)return [...cached]
 const candidates=catalogue.map(item=>{
  const contexts=actionContextsForWord(item)
  const plural=item.number==='plural'||item.pairOnly
  const mass=meaningForWord(item)?.countability==='mass'
  const determiner=action.complement==='destination'||action.complement==='prepositional'||plural?{english:'the',thai:'ที่กำลังพูดถึง'}:mass?undefined:{english:item.indefiniteArticle??(/^[aeiou]/i.test(item.word)?'an':'a'),thai:`หนึ่ง${item.classifierThai??''}`}
  const phrase:NounPhrase={noun:item.word,nounThai:item.thai,determiner,...(action.complement==='destination'?{preposition:{english:'to',thai:contexts.includes('person')?'หา':'ที่'}}:action.preposition?{preposition:action.preposition}:{})}
  return {noun:item.word,phrase,categories:contexts,plural:!!plural,mass,word:nounPhraseUnits(phrase).map(unit=>unit.english).join(' '),thai:action.complement==='destination'?`ไป${contexts.includes('person')?'หา':'ที่'}${item.thai}`:determiner&&['a','an'].includes(determiner.english)?`${item.thai}${determiner.thai}`:item.thai} satisfies ActionObject
 })
 const result=candidates.filter(object=>
  (!!blueprint||action.complement!=='destination'||object.categories.includes('destination'))&&
  object.categories.some(category=>action.objects.includes(category))&&
  (!blueprint?.nounCategories||object.categories.some(category=>blueprint.nounCategories!.includes(category)))).sort((a,b)=>action.complement==='destination'?Number(b.categories.includes('destination'))-Number(a.categories.includes('destination')):0)
 const cache=objectCache.get(catalogue)??new Map<string,ActionObject[]>();cache.set(key,result);objectCache.set(catalogue,cache)
 return [...result]
}
export function objectDeterminers(object:ActionObject,allowed?:readonly Determiner[]){
 const article=object.phrase.determiner
 return [...(article&&['a','an'].includes(article.english)?[{word:article.english as Determiner,thai:article.thai}]:[]),...allDeterminers.filter(item=>!['a','an'].includes(item.word)),...possessiveChoices.map(choice=>({word:choice.value.english,thai:choice.value.thai}))].filter(item=>determinerAgrees(item.word,!!object.plural,!!object.mass)).filter(item=>!allowed||allowed.includes(item.word))
}
export const actionConstruction = {
 id:'present-action-dialogue',subjectKind:'person',actionForm:'present-participle',
 allowedCategories:['food','drink','readable','destination'] as const,objectPolicy:'verb-frame',subjectModes:['noun','pronoun','name'] as const,objectModes:['noun','pronoun','name'] as const,
} as const
export function actionDialogue(subject:ActionSubject,word:string,selection:{blueprint?:ActionBlueprint;question?:'activity'|'destination';vocabulary:readonly ClassroomWord[];objectReference?:NominalReference;determiner?:Determiner;object?:string;description?:{english:string;thai:string};subject?:SubjectWord;destination?:SubjectWord}){
 const person=actionSubjects[subject],action=actionForFrame(word,selection.question,selection.blueprint)
 if(!person||!action)throw new Error('Choose a reviewed person and action.')
 if(!subjectCanPerform(selection.subject??{word:subject},word,selection.object))throw new Error('This action does not fit the depicted subject.')
 if(selection.subject&&selection.subject.kind!=='person')throw new Error('This action needs a person.')
 if(selection.destination&&(action.complement!=='destination'||selection.destination.kind!=='place'))throw new Error('This action does not accept a named place.')
 const destinationQuestion=selection.question==='destination'
 const speaker=selection.subject
 const questionSubject=speaker?.phrase?nounPhraseUnits(speaker.phrase).map(unit=>unit.english).join(' '):speaker?.word??(subject==='i'?'I':subject)
 const subjectMeaning=speaker?.phrase?speaker.phrase.nounThai+(speaker.phrase.description?.thai??'')+(speaker.phrase.determiner&&speaker.phrase.determiner.english!=='the'?speaker.phrase.determiner.thai.replace(/ \(.*\)/,''):''):speaker?.thai
 const answerWord=speaker?.word??person.answer
 const answerSubject=answerWord.charAt(0).toUpperCase()+answerWord.slice(1)
 const be=speaker?subjectVerb(speaker):person.answerBe
 const questionBe=speaker?subjectVerb(speaker):person.questionBe
 const objects=objectsForAction(word,selection.vocabulary,selection.question,selection.blueprint)
 const chosenObject=selection.object===undefined?objects[0]:objects.find(item=>item.word===selection.object)
 if(action.complement!=='none'&&!chosenObject&&!selection.destination)throw new Error('This verb frame requires a compatible object or place.')
 if(selection.object!==undefined&&!chosenObject)throw new Error('This object does not fit the action.')
 const baseObject:ActionObject|undefined=selection.destination?{word:`to ${selection.destination.word}`,thai:`ไปที่${selection.destination.thai}`,noun:selection.destination.word,phrase:{noun:selection.destination.word,nounThai:selection.destination.thai,preposition:{english:'to',thai:'ที่'}},categories:['destination'] as const}:chosenObject
 const selectedDeterminer=selection.determiner&&chosenObject?objectDeterminers(chosenObject).find(item=>item.word===selection.determiner||(['a','an'].includes(item.word)&&['a','an'].includes(selection.determiner!))):undefined
 if(selection.determiner&&!selection.destination&&!selectedDeterminer)throw new Error('This determiner does not fit the noun.')
 const describedObject=baseObject&&selection.description?{...baseObject,phrase:{...baseObject.phrase,description:selection.description}}:baseObject
 const determinedObject=describedObject&&selectedDeterminer&&!selection.destination?{...describedObject,phrase:{...describedObject.phrase,determiner:possessiveFor(selectedDeterminer.word)??{english:selectedDeterminer.word,thai:selectedDeterminer.thai}}}:describedObject
 const referenceNoun=chosenObject&&selection.vocabulary.find(noun=>noun.word===chosenObject.noun)
 const isLocation=!selection.blueprint&&(action.complement==='destination'||!!action.preposition&&chosenObject?.categories.includes('destination'))
 if(selection.objectReference&&(!determinedObject||!referenceNoun))throw new Error('A reference requires a compatible source noun.')
 const object=selection.objectReference&&determinedObject&&referenceNoun?{...determinedObject,phrase:referencePhrase(referenceNoun,determinedObject.phrase,selection.objectReference,!!isLocation)}:determinedObject
 const subjectParts=(answer:boolean)=>speaker?.phrase
  ?nounPhraseUnits(speaker.phrase).map((unit,index)=>({...unit,english:answer&&index===0?unit.english.charAt(0).toUpperCase()+unit.english.slice(1):unit.english,role:unit.role==='determiner'?'person-determiner' as const:unit.role==='description'?'description' as const:'person' as const}))
  :[{english:answer?answerSubject:questionSubject,thai:speaker?.thai??(answer?person.answerThai:person.thai),role:'person' as const}]
 const units=[...subjectParts(true),{english:be as string,thai:'กำลัง',role:'be' as const},
 {english:action.spoken??action.word,thai:action.thai,role:'action' as const},...(object?nounPhraseUnits(object.phrase).map(unit=>({...unit,role:unit.role==='noun'?'object' as const:unit.role})):[])]
 units[units.length-1]={...units[units.length-1],english:units[units.length-1].english+'.'}
 const nounMeaning=object?object.phrase.nounThai+(object.phrase.description?.thai??''):''
 const objectMeaning=selection.objectReference?object?.phrase.nounThai:object?(selectedDeterminer&&(possessiveFor(selectedDeterminer.word)||['the','my','your','his','her','our','their','this','that','these','those','some'].includes(selectedDeterminer.word))?nounMeaning+(selectedDeterminer.word==='the'?'':selectedDeterminer.thai.replace(/ \(.*\)/,'')):object.thai.replace(/^ไป(?:ที่|หา)/,'').replace(object.phrase.nounThai,nounMeaning)):''
 const movementToPerson=action.complement==='destination'&&chosenObject?.categories.includes('person')
 const meaning=selection.objectReference?.mode==='pronoun'&&isLocation?`${action.thai}${objectMeaning}`:action.complement==='destination'?`${action.thai}${movementToPerson?(word==='going'?'หา':'ไปหา'):(word==='going'?'ที่':'ไปที่')}${objectMeaning}`:`${action.sentenceThai??action.thai}${objectMeaning}`
 return {
 question:{english:`${destinationQuestion?'Where':'What'} ${questionBe} ${questionSubject} ${destinationQuestion?action.word:'doing'}?`,thai:`${subjectMeaning??person.thai}กำลัง${destinationQuestion?`${action.thai}${word==='going'?'ไหน':'ไปไหน'}`:'ทำอะไร'}`,units:[{english:destinationQuestion?'Where':'What',thai:destinationQuestion?'ที่ไหน':'อะไร',role:'question' as const},{english:questionBe,thai:'—',role:'be' as const},...subjectParts(false),{english:destinationQuestion?`${action.word}?`:'doing?',thai:destinationQuestion?action.thai:'กำลังทำ',role:'action' as const}]},
 answer:{english:units.map(unit=>unit.english).join(' '),thai:`${subjectMeaning??person.answerThai}กำลัง${meaning}`,units},object,
 }
}
