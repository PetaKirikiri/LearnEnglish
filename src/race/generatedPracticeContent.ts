import {everydayPeopleCatalogue,descriptions} from '../learning/everydayVocabulary'
import {lessonThreeMatrixCatalogue} from '../classroom/wordCatalogue'
import {actionDialogue,objectsForAction,objectDeterminers} from '../learning/sentenceRules/actionDialogue'
import {assessedSubjectPronouns,taughtActionLine} from '../learning/sentenceRules/assessmentScope'
import {meaningForWord} from '../learning/sentenceRules/blueprints'
import {allDeterminers,locationSentence,verbForWord,type Determiner} from '../learning/sentenceMatrix/model'
import type {SubjectWord} from '../learning/sentenceMatrix/subjectEngine'
import type {LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'
import {generatedNumberCatalogue as numberCatalogue,numberItem} from './numberCatalogue'
import type {PracticeLevel} from './PracticeLevelPicker'
import {identificationQuestion,identificationAudio,references,type ReferenceId} from '../learning/sentenceRules/identification'
import {people as locationPeople,peopleSentence,locationWords} from '../learning/sentenceMatrix/peopleLocation'
export type DistanceChoice={reference:ReferenceId;word:string}
export type PracticeStructure='identify'|'location'|'destination'

export const GENERATED_ROUND_SIZE=30
export type GeneratedQuestion={id:string;version:1;level:PracticeLevel;document:LanguageDocument;choices:[string,string];correct:0|1;audioUrl?:string;sceneChoices?:[DistanceChoice,DistanceChoice];alternatives?:[LanguageDocument,LanguageDocument];targetWords:string[];listeningWords:string[];family:string;vocabulary:string[];action:string;owner:string;subject:string;plural:boolean;kind:'number'|'judgement'|'meaning';credit:string|null}
const vocabulary=[...lessonThreeMatrixCatalogue,...everydayPeopleCatalogue]
const owners=allDeterminers.filter(d=>!['a','an'].includes(d.word))
export function sentenceKey(text:string){return text.toLowerCase().replace(/[.!?]/g,'').replace(/\s+/g,' ').trim()}
export function sentenceHash(text:string){let hash=2166136261;for(const c of text)hash=Math.imul(hash^c.charCodeAt(0),16777619);return (hash>>>0).toString(36)}
const phrase=(word:string,owner:Determiner):LanguageDocument=>({english:`${owner} ${word}`,thai:'',construction:'noun-phrase',units:[{english:owner,thai:'',role:'determiner'},{english:word,thai:'',role:'object'}]})
function where(word:string,owner:Determiner,wrong=false):LanguageDocument{
 const item=numberItem(word)!,line=locationSentence(item,owner)
 const roles=['question','be','determiner','object'] as const
 const units=line.units.map((unit,i)=>({...unit,role:roles[i],english:wrong&&i===1?(line.verb==='is'?'are':'is'):unit.english}))
 return {english:units.map(u=>u.english).join(' '),thai:line.thai,construction:'question',units}
}
function base(level:PracticeLevel,document:LanguageDocument,other:LanguageDocument,meta:Pick<GeneratedQuestion,'family'|'vocabulary'|'action'|'owner'|'subject'|'plural'>,targetWords:string[]):GeneratedQuestion{
 if(document.english===other.english)throw new Error('Identical generated alternatives')
 return {id:`compose-v1-l${level}-${sentenceHash(document.english+'|'+other.english)}`,version:1,level,document,choices:[document.english,other.english],correct:0,alternatives:[document,other],targetWords,listeningWords:[...new Set([...targetWords,...document.units.filter((unit,i)=>unit.english!==other.units[i]?.english).map(unit=>unit.english)])],...meta,kind:'meaning',credit:targetWords.join(' ')}
}
function numberCandidates(level:1|2|3):GeneratedQuestion[]{
 const out:GeneratedQuestion[]=[]
 for(const item of numberCatalogue.filter(n=>!n.pairOnly&&n.singular&&n.plural))for(const {word:owner} of owners.filter(d=>['the','my','your'].includes(d.word))){
  const singular=item.singular!,plural=item.plural!,isPlural=item.pluralForm
  if(!numberItem(singular)||!numberItem(plural))continue
  const meta={family:singular,vocabulary:[item.word],action:'number',owner,subject:'',plural:isPlural}
  if(level<3){
   const document=level===1?phrase(item.word,owner):where(item.word,owner)
   const q=base(level,document,level===1?phrase(isPlural?singular:plural,owner):where(isPlural?singular:plural,owner),meta,level===2?[item.word,verbForWord(item)]:[item.word])
   q.kind='number';q.alternatives=[phrase(singular,owner),phrase(plural,owner)];q.choices=[q.alternatives[0].english,q.alternatives[1].english];q.correct=isPlural?1:0
   out.push(q)
  }else for(const wrong of [false,true]){
   const document=where(item.word,owner,wrong)
   out.push({...base(level,document,where(item.word,owner,!wrong),meta,[item.word,verbForWord(item)]),kind:'judgement',choices:['Correct','Incorrect'],correct:wrong?1:0,alternatives:undefined,credit:wrong?null:`${item.word} ${verbForWord(item)}`})
  }
 }
 return out
}
const people:SubjectWord[]=[...assessedSubjectPronouns.map(p=>({...p,kind:'person' as const})),{word:'Bia',thai:'Bia',kind:'person' as const}]
const humanNouns=vocabulary.filter(w=>meaningForWord(w)?.kind==='person')
const namedPeople=humanNouns.flatMap(noun=>owners.map(owner=>({word:`${owner.word} ${noun.word}`,thai:`${noun.thai}${owner.word==='the'?'':owner.thai.replace(/ \(.*\)/,'')}`,number:noun.number,kind:'person' as const,phrase:{noun:noun.word,nounThai:noun.thai,determiner:{english:owner.word,thai:owner.thai}}})))
const documentCache=new Map<string,LanguageDocument>()
function actionDocument(subject:SubjectWord,action:string,object?:string,owner?:Determiner,question=false):LanguageDocument{
 const key=JSON.stringify([subject.word,action,object,owner,question]);const cached=documentCache.get(key);if(cached)return cached
 const line=actionDialogue('i',action,{vocabulary,subject,object,determiner:owner})[question?'question':'answer']
 const document:LanguageDocument={...line,construction:question?'action-question':'action-answer'};documentCache.set(key,document);return document
}
function actionQuestionCandidates():GeneratedQuestion[]{
 const subjects=[...people,...namedPeople],out:GeneratedQuestion[]=[]
 for(const [i,subject] of subjects.entries()){
  const matching=subjects.filter(p=>!!p.phrase===!!subject.phrase&&p.word!==subject.word&&(!p.phrase||p.phrase.determiner?.english===subject.phrase?.determiner?.english))
  const other=matching.find(p=>p.phrase&&subject.phrase&&(numberItem(p.phrase.noun)?.singular??p.phrase.noun)===(numberItem(subject.phrase.noun)?.singular??subject.phrase.noun))??matching[i%matching.length]
  const document=actionDocument(subject,'sleeping',undefined,undefined,true),alternative=actionDocument(other,'sleeping',undefined,undefined,true)
  out.push(base(4,document,alternative,{family:subject.phrase?.noun.replace(/s$/,'')??'people',vocabulary:subject.phrase?[subject.phrase.noun,...(other.phrase?[other.phrase.noun]:[])]:[],action:'doing',owner:subject.phrase?.determiner?.english??'',subject:subject.word,plural:subject.number==='plural'},[subject.phrase?.noun??subject.word]))
 }
 // Earlier question patterns remain review; they provide meaningful variety
 // without inventing new human nouns or repeating the nine original prompts.
 for(const [i,item] of numberCatalogue.entries())for(const [oi,owner] of owners.entries()){
  const others=numberCatalogue.filter(n=>n.pluralForm===item.pluralForm&&n.word!==item.word)
  const nounContrast=oi%2===0
  const otherOwner=owners.filter(o=>o.word!=='the'&&o.word!==owner.word)[i%5]
  const otherNoun=others[(i+oi)%others.length]
  const alternative=nounContrast?where(otherNoun.word,owner.word):where(item.word,otherOwner.word)
  out.push(base(4,where(item.word,owner.word),alternative,{family:item.singular??item.word,vocabulary:nounContrast?[item.word,otherNoun.word]:[item.word],action:'where',owner:owner.word,subject:'',plural:item.pluralForm},[nounContrast?item.word:owner.word]))
 }
 return out
}
function actionAnswerCandidates(level:5|6):GeneratedQuestion[]{
 const out:GeneratedQuestion[]=[],actions=level===5?['eating','drinking','holding','reading','talking','listening','driving','sleeping','walking','running','playing']:['eating','drinking','reading','holding','opening','washing']
 const objectMap=new Map(actions.map(action=>[action,objectsForAction(action,vocabulary)]))
 const subjects:SubjectWord[]=[...people,...namedPeople.filter(p=>p.phrase.determiner.english==='the')]
 for(const [si,subject] of subjects.entries())for(const action of actions){
  const objects=objectMap.get(action)!
  if(!objects.length){
   const bare=actions.filter(a=>a!==action&&!objectMap.get(a)!.length)
   for(const other of bare)out.push(base(level,actionDocument(subject,action),actionDocument(subject,other),{family:'actions',vocabulary:subject.phrase?[subject.phrase.noun]:[],action,owner:'',subject:subject.word,plural:subject.number==='plural'},[action]));continue
  }
  for(const [oi,object] of objects.entries())for(const [di,owner] of objectDeterminers(object).filter(d=>!['a','an'].includes(d.word)&&(!subject.phrase||subject.phrase.noun.startsWith('doctor')||['the','my','your'].includes(d.word))).entries()){
   const document=actionDocument(subject,action,object.word,owner.word)
   let other:LanguageDocument,targetWords:string[]
   // Alternate the tested decision across noun, ownership and subject. Every
   // competitor has the same construction and changes one semantic component.
   const contrast=(si+oi+di)%4
   const actionOptions=actions.filter(a=>a!==action&&objectMap.get(a)!.some(o=>o.word===object.word))
   const nounOptions=objects.filter(o=>o.noun!==object.noun)
   if(contrast===3&&actionOptions.length){
    other=actionDocument(subject,actionOptions[(si+di)%actionOptions.length],object.word,owner.word);targetWords=[action]
   }else if(contrast===0&&nounOptions.length){
    const noun=nounOptions[(si+di)%nounOptions.length]
    other=actionDocument(subject,action,noun.word,owner.word);targetWords=[object.noun]
   }else if(contrast===1&&owner.word!=='the'){
    const options=owners.filter(d=>d.word!=='the'&&d.word!==owner.word)
    other=actionDocument(subject,action,object.word,options[(si+oi)%options.length].word);targetWords=[owner.word]
   }else{
    const options=subjects.filter(p=>!!p.phrase===!!subject.phrase&&p.word!==subject.word)
    const person=options.find(p=>p.phrase&&subject.phrase&&(numberItem(p.phrase.noun)?.singular??p.phrase.noun)===(numberItem(subject.phrase.noun)?.singular??subject.phrase.noun))??options[(oi+di)%options.length]
    other=actionDocument(person,action,object.word,owner.word);targetWords=[subject.phrase?.noun??subject.word]
   }
   if(!taughtActionLine(level,document.units)||!taughtActionLine(level,other.units))throw new Error('Generated action outside taught scope')
   const nouns=[...document.units,...other.units].filter(u=>u.role==='object'||u.role==='person'&&!!numberItem(u.english.replace(/[?.!]$/,''))).map(u=>u.english.replace(/[?.!]$/,''))
   out.push(base(level,document,other,{family:numberItem(object.noun)?.singular??object.noun,vocabulary:[...new Set(nouns)],action,owner:owner.word,subject:subject.word,plural:numberItem(object.noun)?.pluralForm??false},targetWords))
  }
 }
 return out
}

function descriptionCandidates(level:PracticeLevel):GeneratedQuestion[]{
 if(level===3||level===4)return []
 const source=level<=2?numberCandidates(level as 1|2):actionAnswerCandidates(level as 5|6)
 const seen=new Set<string>(),result:GeneratedQuestion[]=[]
 for(const q of source){
  if(q.owner!=='the'||q.subject&&!['I','you'].includes(q.subject))continue
  const index=q.document.units.findIndex(u=>u.role==='object')
  if(index<0||q.document.units[index-1]?.role!=='determiner')continue
  const noun=q.document.units[index].english.replace(/[.!?]$/,'')
  for(const descriptor of descriptions){
   if(!(descriptor.nouns as readonly string[]).includes(numberItem(noun)?.singular??noun))continue
   const opposite=descriptions.find(d=>d.word===descriptor.opposite)!
   const withDescription=(d:typeof descriptions[number]):LanguageDocument=>{const units=[...q.document.units];units.splice(index,0,{english:d.word,thai:d.thai,role:'description'});return {...q.document,units,english:units.map(u=>u.english).join(' ')}}
   const document=withDescription(descriptor),other=withDescription(opposite)
   if(seen.has(document.english))continue
   seen.add(document.english)
   result.push(base(level,document,other,{family:q.family,vocabulary:document.units.filter(u=>['person','object'].includes(u.role)&&numberItem(u.english.replace(/[.!?]$/,''))).map(u=>u.english.replace(/[.!?]$/,'')),action:q.action,owner:q.owner,subject:q.subject,plural:q.plural},[descriptor.word]))
  }
 }
 return result
}


/** Brief noun review inside later levels lets a learner prove the noun itself,
 * even when a verb has only one object (for example drinking water). */
function vocabularyRecallCandidates(level:5|6):GeneratedQuestion[]{
 return numberCatalogue.filter(n=>!n.pairOnly).flatMap(item=>{
  const family=item.singular??item.word,human=meaningForWord(item)?.kind==='person'
  const contrast=human?(family==='man'?'woman':'man'):(family==='bag'?'phone':family==='water'?'cup':'bag')
  const other=numberItem(item.pluralForm?numberItem(contrast)?.plural??contrast:contrast)
  if(!other)return []
  return ['the','my','your'].map(owner=>base(level,phrase(item.word,owner as Determiner),phrase(other.word,owner as Determiner),{family,vocabulary:[item.word,other.word],action:'vocabulary',owner,subject:'',plural:item.pluralForm},[item.word]))
 })
}

const cache=new Map<PracticeLevel,GeneratedQuestion[]>()
export function generatedCandidates(level:PracticeLevel){
 let bank=cache.get(level)
 if(!bank){bank=[...(level<=3?numberCandidates(level as 1|2|3):level===4?actionQuestionCandidates():actionAnswerCandidates(level as 5|6)),...descriptionCandidates(level),...(level>=5?vocabularyRecallCandidates(level as 5|6):[])];if(new Set(bank.map(q=>q.id)).size!==bank.length)throw new Error('Generated question ID collision');cache.set(level,bank)}
 return bank
}

/** Structures compose from the shared lexical catalogue. No lesson owns examples or a deck. */
const structureCache=new Map<PracticeStructure,GeneratedQuestion[]>()
export function structureCandidates(structure:PracticeStructure):GeneratedQuestion[]{
 const cached=structureCache.get(structure);if(cached)return cached
 const out:GeneratedQuestion[]=[]
 if(structure==='identify')for(const item of numberCatalogue.filter(n=>!n.pluralForm&&!n.pairOnly))for(const reference of references){
  if(reference.plural&&!item.plural)continue
  const other=references.find(r=>r.plural===reference.plural&&r.id!==reference.id)!
  out.push({id:`identify-v2-${reference.id}-${sentenceHash(item.word)}`,version:1,level:6,document:identificationQuestion(reference.id),audioUrl:identificationAudio(reference.id),choices:[reference.word,other.word],correct:0,sceneChoices:[{reference:reference.id,word:item.word},{reference:other.id,word:item.word}],targetWords:[reference.word],listeningWords:[reference.word],family:item.singular??item.word,vocabulary:[item.word],action:'identify',owner:'',subject:'',plural:reference.plural,kind:'meaning',credit:reference.word})
 }
 if(structure==='location')for(const person of locationPeople)for(const place of locationWords(vocabulary)){
  const line=peopleSentence('answer',person.word,place),otherPerson=locationPeople.find(p=>p.word!==person.word)!,other=peopleSentence('answer',otherPerson.word,place)
  const roles=['person','be','preposition','determiner','object'] as const
  const doc=(l:typeof line):LanguageDocument=>({...l,construction:'location-answer',units:l.units.map((u,i)=>({...u,role:roles[i]}))})
  out.push(base(3,doc(line),doc(other),{family:place.singular??place.word,vocabulary:[place.word],action:'location',owner:'the',subject:person.word,plural:false},[person.word]))
 }
 if(structure==='destination')for(const subject of people)for(const action of ['going','walking','running'])for(const object of objectsForAction(action,vocabulary,'destination')){
  const make=(person:SubjectWord):LanguageDocument=>({...actionDialogue('i',action,{question:'destination',vocabulary,subject:person,object:object.word,determiner:'the'}).answer,construction:'action-answer'})
  const other=people.find(p=>p.word!==subject.word)!
  out.push(base(5,make(subject),make(other),{family:object.noun,vocabulary:[object.noun],action,owner:'the',subject:subject.word,plural:false},[subject.word]))
 }
 structureCache.set(structure,out);return out
}
export function allPracticeCandidates(){return [...([1,2,3,4,5,6] as const).flatMap(generatedCandidates),...(['identify','location','destination'] as const).flatMap(structureCandidates)]}
