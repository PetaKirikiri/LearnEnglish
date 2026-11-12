import {defaultPlaceNames} from '../learning/sentenceRules/nominalReferences'
import {activeActionBlueprints,matchingActionBlueprint} from '../learning/sentenceRules/actionBlueprints'
import {adjectiveFitsNoun,adjectivesForNoun,adjectiveThaiForNoun} from '../learning/sentenceRules/adjectiveSemantics'
import {subjectCanPerform} from '../learning/sentenceRules/actionSemantics'
import {determinerAgrees} from '../learning/sentenceRules/determiners'
import {everydayPeopleCatalogue,everydayNounOrder,descriptions} from '../learning/everydayVocabulary'
import {lessonThreeMatrixCatalogue} from '../classroom/wordCatalogue'
import {actionVocabulary,actionDialogue,objectsForAction,objectDeterminers} from '../learning/sentenceRules/actionDialogue'
import {assessedSubjectPronouns} from '../learning/sentenceRules/assessmentScope'
import {meaningForWord} from '../learning/sentenceRules/blueprints'
import {allDeterminers,locationSentence,verbForWord,type Determiner} from '../learning/sentenceMatrix/model'
import type {SubjectWord} from '../learning/sentenceMatrix/subjectEngine'
import type {LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'
import {generatedNumberCatalogue as numberCatalogue,numberItem} from './numberCatalogue'
import type {PracticeLevel} from './PracticeLevelPicker'
import {identificationAnswer,identificationQuestion,identificationAudio,references,type ReferenceId} from '../learning/sentenceRules/identification'
import {people as locationPeople,peopleSentence,locationWords,locationAnswer} from '../learning/sentenceMatrix/peopleLocation'
export type DistanceChoice={reference:ReferenceId|'some';word:string}
export type PracticeStructure='identify'|'location'|'destination'

export const GENERATED_ROUND_SIZE=30
export type GeneratedQuestion={id:string;version:1;level:PracticeLevel;document:LanguageDocument;choices:[string,string];correct:0|1;audioUrl?:string;sceneChoices?:[DistanceChoice,DistanceChoice];alternatives?:[LanguageDocument,LanguageDocument];targetWords:string[];listeningWords:string[];family:string;vocabulary:string[];action:string;owner:string;subject:string;plural:boolean;kind:'number'|'judgement'|'meaning';credit:string|null}
const vocabulary=[...lessonThreeMatrixCatalogue,...everydayPeopleCatalogue]
const owners=allDeterminers.filter(d=>['the','my','your','his','her','our','their'].includes(d.word))
export function sentenceKey(text:string){return text.toLowerCase().replace(/[.!?]/g,'').replace(/\s+/g,' ').trim()}
export function sentenceHash(text:string){let hash=2166136261;for(const c of text)hash=Math.imul(hash^c.charCodeAt(0),16777619);return (hash>>>0).toString(36)}
/** Two independent 32-bit hashes avoid collisions as the shared catalogue grows. */
function questionHash(text:string){let second=5381;for(const c of text)second=Math.imul(second,33)^c.charCodeAt(0);return sentenceHash(text)+'-'+(second>>>0).toString(36)}
const phrase=(word:string,owner:Determiner):LanguageDocument=>({english:`${owner} ${word}`,thai:'',construction:'noun-phrase',units:[{english:owner,thai:'',role:'determiner'},{english:word,thai:'',role:'object'}]})
function where(word:string,owner:Determiner,wrong=false):LanguageDocument{
 const item=numberItem(word)!,line=locationSentence(item,owner)
 const roles=['question','be','determiner','object'] as const
 const units=line.units.map((unit,i)=>({...unit,role:roles[i],english:wrong&&i===1?(line.verb==='is'?'are':'is'):unit.english}))
 return {english:units.map(u=>u.english).join(' '),thai:line.thai,construction:'question',units}
}
function base(level:PracticeLevel,document:LanguageDocument,other:LanguageDocument,meta:Pick<GeneratedQuestion,'family'|'vocabulary'|'action'|'owner'|'subject'|'plural'>,targetWords:string[]):GeneratedQuestion{
 if(document.english===other.english)throw new Error('Identical generated alternatives')
 // A changed person and its agreeing auxiliary form one tested contrast,
 // just as noun-number questions test the noun together with is/are.
 const person=document.units.find(unit=>unit.role==='person')
 if(person&&targetWords.includes(person.english.replace(/[?.!]$/,''))){
  const agreement=document.units.filter((unit,index)=>unit.role==='be'&&unit.english!==other.units[index]?.english).map(unit=>unit.english.replace(/[?.!]$/,''))
  targetWords=[...new Set([...targetWords,...agreement])]
 }
 return {id:`compose-v2-l${level}-${questionHash(document.english+'|'+other.english+'|'+targetWords.join('|'))}`,version:1,level,document,choices:[document.english,other.english],correct:0,alternatives:[document,other],targetWords,listeningWords:[...new Set([...targetWords,...document.units.filter((unit,i)=>unit.english!==other.units[i]?.english).map(unit=>unit.english)])],...meta,kind:'meaning',credit:targetWords.join(' ')}
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
const humanNouns=vocabulary.filter(w=>meaningForWord(w)?.kind==='person').sort((a,b)=>everydayNounOrder.indexOf((a.singular??a.word) as typeof everydayNounOrder[number])-everydayNounOrder.indexOf((b.singular??b.word) as typeof everydayNounOrder[number]))
const namedPeople=humanNouns.flatMap(noun=>owners.map(owner=>({word:`${owner.word} ${noun.word}`,thai:`${noun.thai}${owner.word==='the'?'':owner.thai.replace(/ \(.*\)/,'')}`,number:noun.number,kind:'person' as const,phrase:{noun:noun.word,nounThai:noun.thai,determiner:{english:owner.word,thai:owner.thai}}})))
const documentCache=new Map<string,LanguageDocument>()
function actionDocument(subject:SubjectWord,action:string,object?:string,owner?:Determiner,question=false):LanguageDocument{
 const key=JSON.stringify([subject.word,subject.phrase,action,object,owner,question]);const cached=documentCache.get(key);if(cached)return cached
 const lexical=actionVocabulary.find(word=>word.word===action)!
 const blueprint=question?undefined:matchingActionBlueprint(lexical)
 if(!question&&!blueprint)throw new Error('The action has no compatible active blueprint.')
 const line=actionDialogue('i',action,{blueprint,vocabulary,subject,object,determiner:owner})[question?'question':'answer']
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
function actionAnswerCandidates(level:5|6,eligibleActions?:ReadonlySet<string>,determiners:readonly string[]=owners.map(owner=>owner.word)):GeneratedQuestion[]{
 const frames=activeActionBlueprints.filter(frame=>level===5||frame.connection==='direct')
 const actions=actionVocabulary.filter(action=>!!matchingActionBlueprint(action,frames)).map(action=>action.word),out:GeneratedQuestion[]=[]
 const frameFor=(word:string)=>matchingActionBlueprint(actionVocabulary.find(action=>action.word===word)!,frames)!
 const objectMap=new Map(actions.map(action=>[action,objectsForAction(action,vocabulary,undefined,frameFor(action))]))
 const objectActions=new Map<string,string[]>()
 for(const action of actions)for(const object of objectMap.get(action)!){const key=object.word;const values=objectActions.get(key)??[];if(!values.includes(action))values.push(action);objectActions.set(key,values)}
 const ownerCache=new Map<ReturnType<typeof objectsForAction>[number],ReturnType<typeof objectDeterminers>>()
 const ownersFor=(object:ReturnType<typeof objectsForAction>[number])=>{let values=ownerCache.get(object);if(!values){values=objectDeterminers(object).filter(d=>determiners.includes(d.word));ownerCache.set(object,values)}return values}
 const subjects:SubjectWord[]=[...people,...namedPeople.filter(p=>p.phrase.determiner.english==='the')]
 for(const [si,subject] of subjects.entries())for(const action of actions){
  if(eligibleActions&&!eligibleActions.has(action))continue
  if(!subjectCanPerform(subject,action))continue
  const objects=objectMap.get(action)!
  if(!objects.length)continue
  for(const [oi,object] of objects.filter(object=>subjectCanPerform(subject,action,object.noun)).entries())for(const [di,owner] of ownersFor(object).filter(d=>!subject.phrase||subject.phrase.noun.startsWith('doctor')||['the','my','your'].includes(d.word)).entries()){
   const document=actionDocument(subject,action,object.word,owner.word)
   let other:LanguageDocument,targetWords:string[]
   // Alternate the tested decision across noun, ownership and subject. Every
   // competitor has the same construction and changes one semantic component.
   const contrast=(si+oi+di)%4
   const actionOptions=(objectActions.get(object.word)??[]).filter(a=>a!==action&&subjectCanPerform(subject,a,object.noun))
   const nounOptions=objects.filter(o=>o.noun!==object.noun&&subjectCanPerform(subject,action,o.noun)&&ownersFor(o).some(d=>d.word===owner.word)).sort((a,b)=>everydayNounOrder.indexOf((numberItem(a.noun)?.singular??a.noun) as typeof everydayNounOrder[number])-everydayNounOrder.indexOf((numberItem(b.noun)?.singular??b.noun) as typeof everydayNounOrder[number]))
   if(contrast===3&&actionOptions.length){
    other=actionDocument(subject,actionOptions[(si+di)%actionOptions.length],object.word,owner.word);targetWords=[action]
   }else if(contrast===0&&nounOptions.length){
    const noun=nounOptions[(si+di)%nounOptions.length]
    other=actionDocument(subject,action,noun.word,owner.word);targetWords=[object.noun]
   }else if(contrast===1){
    const options=ownersFor(object).filter(d=>d.word!==owner.word)
    other=actionDocument(subject,action,object.word,options[(si+oi)%options.length].word);targetWords=[owner.word]
   }else{
    const options=subjects.filter(p=>!!p.phrase===!!subject.phrase&&p.word!==subject.word&&subjectCanPerform(p,action,object.noun))
    const person=options.find(p=>p.phrase&&subject.phrase&&(numberItem(p.phrase.noun)?.singular??p.phrase.noun)===(numberItem(subject.phrase.noun)?.singular??subject.phrase.noun))??options[(oi+di)%options.length]
    other=actionDocument(person,action,object.word,owner.word);targetWords=[subject.phrase?.noun??subject.word]
   }
   const nouns=[...document.units,...other.units].filter(u=>u.role==='object'||u.role==='person'&&!!numberItem(u.english.replace(/[?.!]$/,''))).map(u=>u.english.replace(/[?.!]$/,''))
   const meta={family:numberItem(object.noun)?.singular??object.noun,vocabulary:[...new Set(nouns)],action,owner:owner.word,subject:subject.word,plural:numberItem(object.noun)?.pluralForm??false}
   out.push(base(level,document,other,meta,targetWords))
   const documentNouns=document.units.filter(u=>u.role==='object'||u.role==='person'&&!!numberItem(u.english.replace(/[?.!]$/,''))).map(u=>u.english.replace(/[?.!]$/,''))
   // Keep early nouns testable inside this construction. A single contrast
   // chosen from the whole catalogue can otherwise require a much later noun.
   for(const noun of nounOptions.slice(0,2)){
    const alternative=actionDocument(subject,action,noun.word,owner.word)
    out.push(base(level,document,alternative,{...meta,vocabulary:[...new Set([...documentNouns,noun.noun])]},[object.noun]))
   }
   if(subject.phrase){
    const person=subjects.find(p=>p.phrase&&p.number===subject.number&&p.phrase.noun!==subject.phrase?.noun&&subjectCanPerform(p,action,object.noun))
    if(person){
     const alternative=actionDocument(person,action,object.word,owner.word)
     out.push(base(level,document,alternative,{...meta,vocabulary:[...new Set([...documentNouns,person.phrase!.noun])]},[subject.phrase.noun]))
    }
   }
   // Keep the alternative inside the same blueprint. Never append a bare
   // action or invent a connection to make a word assessable.
   const otherAction=actions.find(candidate=>candidate!==action&&frameFor(candidate).connection===frameFor(action).connection&&subjectCanPerform(subject,candidate)&&objectMap.get(candidate)!.some(item=>subjectCanPerform(subject,candidate,item.noun)))
   if(otherAction){
    const choices=objectMap.get(otherAction)!.filter(item=>subjectCanPerform(subject,otherAction,item.noun))
    const contrast=choices.find(item=>item.noun===object.noun)??choices[0]
    const contrastOwner=ownersFor(contrast).some(item=>item.word===owner.word)?owner.word:ownersFor(contrast)[0].word
    const verbContrast=actionDocument(subject,otherAction,contrast.word,contrastOwner)
    out.push(base(level,document,verbContrast,{...meta,vocabulary:[...new Set([...documentNouns,contrast.noun])]},[action]))
   }
  }
 }
 return [...new Map(out.map(q=>[q.id,q])).values()]
}

function descriptionCandidates(level:PracticeLevel,eligibleActions?:ReadonlySet<string>):GeneratedQuestion[]{
 const source=level<=3?numberCandidates(level===1?1:2):level===4?[]:actionAnswerCandidates(level as 5|6,eligibleActions)
 const seen=new Set<string>(),result:GeneratedQuestion[]=[]
 for(const q of source){
  if(q.owner!=='the'||q.subject&&!['I','you'].includes(q.subject))continue
  const index=q.document.units.findIndex(u=>u.role==='object')
  if(index<0||q.document.units[index-1]?.role!=='determiner')continue
  const noun=q.document.units[index].english.replace(/[.!?]$/,'')
  for(const descriptor of adjectivesForNoun(noun)){
   const opposite=descriptions.find(d=>d.word===descriptor.opposite&&adjectiveFitsNoun(d.word,noun))??descriptions.find(d=>d.group===descriptor.group&&d.word!==descriptor.word&&adjectiveFitsNoun(d.word,noun))
   if(!opposite)continue
   const withDescription=(d:typeof descriptions[number]):LanguageDocument=>{const units=[...q.document.units];units.splice(index,0,{english:d.word,thai:adjectiveThaiForNoun(d.word,noun),role:'description'});return {...q.document,units,english:units.map(u=>u.english).join(' '),thai:q.document.thai.replace(q.document.units[index].thai,q.document.units[index].thai+adjectiveThaiForNoun(d.word,noun))}}
   const document=withDescription(descriptor),other=withDescription(opposite)
   if(seen.has(document.english))continue
   seen.add(document.english)
   result.push(base(level,document,other,{family:q.family,vocabulary:document.units.filter(u=>['person','object'].includes(u.role)&&numberItem(u.english.replace(/[.!?]$/,''))).map(u=>u.english.replace(/[.!?]$/,'')),action:q.action,owner:q.owner,subject:q.subject,plural:q.plural},[descriptor.word]))
  }
 }
 if(level===4)for(const noun of humanNouns)for(const action of level===4?['sleeping']:['walking','talking','sleeping']){
  if(level!==4&&eligibleActions&&!eligibleActions.has(action))continue
  for(const descriptor of adjectivesForNoun(noun)){
   const opposite=descriptions.find(d=>d.word===descriptor.opposite&&adjectiveFitsNoun(d.word,noun));if(!opposite)continue
   const make=(d:typeof descriptions[number])=>{
    const person:SubjectWord={word:`the ${noun.word}`,thai:noun.thai,kind:'person',number:noun.number,phrase:{noun:noun.word,nounThai:noun.thai,determiner:{english:'the',thai:'ที่กำลังพูดถึง'},description:{english:d.word,thai:adjectiveThaiForNoun(d.word,noun)}}}
    return actionDocument(person,action,undefined,undefined,level===4)
   }
   const document=make(descriptor),other=make(opposite)
   result.push(base(level,document,other,{family:noun.singular??noun.word,vocabulary:[noun.word],action:level===4?'doing':action,owner:'the',subject:`the ${noun.word}`,plural:noun.number==='plural'},[descriptor.word]))
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

const cache=new Map<string,GeneratedQuestion[]>()
export function generatedCandidates(level:PracticeLevel,eligibleActions?:ReadonlySet<string>){
 const key=level+':'+(eligibleActions&&level>=5?[...eligibleActions].sort().join('|'):'all')
 let bank=cache.get(key)
 if(!bank){bank=[...(level<=3?numberCandidates(level as 1|2|3):level===4?actionQuestionCandidates():actionAnswerCandidates(level as 5|6,eligibleActions)),...descriptionCandidates(level,eligibleActions),...(level>=5?vocabularyRecallCandidates(level as 5|6):[])];{const ids=new Map<string,GeneratedQuestion>();for(const q of bank){const previous=ids.get(q.id);if(previous)throw new Error('Generated question ID collision: '+JSON.stringify({id:q.id,previous:previous.choices,current:q.choices,previousCredit:previous.credit,currentCredit:q.credit}));ids.set(q.id,q)}}if(cache.size>=4)cache.delete(cache.keys().next().value!);cache.set(key,bank)}
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
 if(structure==='identify')for(const item of numberCatalogue.filter(noun=>!noun.pairOnly)){
  const reference=item.pluralForm?'these':'this'
  const nounOptions=numberCatalogue.filter(other=>!other.pairOnly&&other.pluralForm===item.pluralForm&&other.word!==item.word).sort((a,b)=>everydayNounOrder.indexOf((a.singular??a.word) as typeof everydayNounOrder[number])-everydayNounOrder.indexOf((b.singular??b.word) as typeof everydayNounOrder[number]))
  const mass=meaningForWord(item)?.countability==='mass'
  for(const owner of allDeterminers.filter(owner=>determinerAgrees(owner.word,item.pluralForm,mass)&&(!['a','an'].includes(owner.word)||owner.word===(item.indefiniteArticle??(/^[aeiou]/i.test(item.word)?'an':'a'))))){
   const document=identificationAnswer(reference,item,owner.word)
   const meta={family:item.singular??item.word,vocabulary:[item.word],action:'identify',owner:owner.word,subject:'',plural:item.pluralForm}
   for(const noun of nounOptions.slice(0,2)){
    if(!determinerAgrees(owner.word,noun.pluralForm,meaningForWord(noun)?.countability==='mass'))continue
    if(['a','an'].includes(owner.word)&&owner.word!==(noun.indefiniteArticle??(/^[aeiou]/i.test(noun.word)?'an':'a')))continue
    out.push(base(6,document,identificationAnswer(reference,noun,owner.word),{...meta,vocabulary:[item.word,noun.word]},[item.word]))
   }
   const other=owner.word==='the'?'my':'the'
   out.push(base(6,document,identificationAnswer(reference,item,other),meta,[owner.word]))
  }
 }
 if(structure==='location')for(const person of locationPeople)for(const place of locationWords(vocabulary)){
  const line=peopleSentence('answer',person.word,place),otherPerson=locationPeople.find(p=>p.word!==person.word)!,other=peopleSentence('answer',otherPerson.word,place)
  const roles=['person','be','preposition','determiner','object'] as const
  const doc=(l:typeof line):LanguageDocument=>({...l,construction:'location-answer',units:l.units.map((u,i)=>({...u,role:roles[i]}))})
  out.push(base(3,doc(line),doc(other),{family:place.singular??place.word,vocabulary:[place.word],action:'location',owner:'the',subject:person.word,plural:false},[person.word]))
 }
 if(structure==='location')for(const subject of namedPeople.filter(person=>person.phrase.determiner.english==='the'))for(const place of defaultPlaceNames){
  const other=namedPeople.find(person=>person.phrase.determiner.english==='the'&&person.number===subject.number&&person.phrase.noun!==subject.phrase.noun)!
  const document={...locationAnswer(subject,place,true),construction:'location-answer' as const}
  const alternative={...locationAnswer(other,place,true),construction:'location-answer' as const}
  out.push(base(3,document,alternative,{family:subject.phrase.noun,vocabulary:[subject.phrase.noun,other.phrase.noun],action:'location',owner:'the',subject:subject.word,plural:subject.number==='plural'},[subject.phrase.noun]))
 }
 if(structure==='destination'){
  const movement=new Set(actionVocabulary.filter(action=>action.destination).map(action=>action.word))
  for(const q of actionAnswerCandidates(5,movement,allDeterminers.map(item=>item.word)))if(q.document.units.some(unit=>unit.role==='preposition'&&unit.english==='to'))out.push(q)
 }
 structureCache.set(structure,out);return out
}
export function allPracticeCandidates(eligibleActions?:ReadonlySet<string>){const bank=[...([1,2,3,4,5,6] as const).flatMap(level=>generatedCandidates(level,eligibleActions)),...(['identify','location','destination'] as const).flatMap(structureCandidates),...determinerCandidates()];const unique=new Map<string,GeneratedQuestion>();for(const q of bank)if(!unique.has(q.id))unique.set(q.id,q);return [...unique.values()]}

const practiceBankCache=new Map<string,GeneratedQuestion[]>()
/** A selected construction is authoritative. Progression selects compatible Current words inside it. */
export function practiceCandidates(level:PracticeLevel,structure?:PracticeStructure,eligibleActions?:ReadonlySet<string>){
 const key=level+':'+(structure??'main')+':'+(eligibleActions&&level>=5&&!structure?[...eligibleActions].sort().join('|'):'all')
 const saved=practiceBankCache.get(key);if(saved)return saved
 const bank=structure?structureCandidates(structure):generatedCandidates(level,eligibleActions)

 const construction=structure==='identify'?['identification-question','identification-answer']:structure==='destination'?['action-answer']:structure==='location'?['location-answer']:level===1?['noun-phrase']:level<=3?['question']:level===4?['action-question']:['action-answer']
 const result=[...new Map([...bank,...(!structure&&level===1?determinerCandidates():[])].filter(q=>construction.includes(q.document.construction)).map(q=>[q.id,q])).values()]
 if(practiceBankCache.size>=12)practiceBankCache.delete(practiceBankCache.keys().next().value!)
 practiceBankCache.set(key,result);return result
}

let determinerBank:GeneratedQuestion[]|undefined
export function determinerCandidates(){
 if(determinerBank)return determinerBank
 const out:GeneratedQuestion[]=[]
 for(const item of numberCatalogue.filter(n=>!n.pairOnly)){
  const mass=meaningForWord(item)?.countability==='mass'
  for(const det of ['this','that','these','those'] as const){
   if(!determinerAgrees(det,item.pluralForm,mass))continue
   const other=det==='this'?'that':det==='that'?'this':det==='these'?'those':'these'
   out.push({...base(6,phrase(item.word,det),phrase(item.word,other),{family:item.singular??item.word,vocabulary:[item.word],action:'determiner',owner:det,subject:'',plural:item.pluralForm},[det]),sceneChoices:[{reference:det,word:item.word},{reference:other,word:item.word}]})
  }
  if(!item.pluralForm&&!mass&&item.plural){
   const article=item.indefiniteArticle??(/^[aeiou]/i.test(item.word)?'an':'a')
   out.push(base(6,phrase(item.word,article),phrase(item.word,'the'),{family:item.singular??item.word,vocabulary:[item.word],action:'determiner',owner:article,subject:'',plural:false},[article]))
  }
  if(item.pluralForm&&item.singular){
   const q=base(6,phrase(item.word,'some'),phrase(item.singular,'this'),{family:item.singular,vocabulary:[item.word,item.singular],action:'determiner',owner:'some',subject:'',plural:true},['some'])
   out.push({...q,sceneChoices:[{reference:'some',word:item.word},{reference:'this',word:item.singular}]})
  }
 }
 determinerBank=out;return out
}
