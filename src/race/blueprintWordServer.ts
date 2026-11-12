import {locationAnswer,locationWords} from '../learning/sentenceMatrix/peopleLocation'
import {defaultPlaceNames} from '../learning/sentenceRules/nominalReferences'
import {practiceBlueprintRequest} from '../learning/sentenceRules/practiceBlueprintRequest'
import {actionVocabulary,objectsForAction,objectDeterminers,actionDialogue,type ActionObject} from '../learning/sentenceRules/actionDialogue'
import {actionInBlueprint,matchingActionBlueprint,type ActionBlueprint} from '../learning/sentenceRules/actionBlueprints'
import {subjectCanPerform} from '../learning/sentenceRules/actionSemantics'
import {adjectiveFitsNoun,adjectiveThaiForNoun} from '../learning/sentenceRules/adjectiveSemantics'
import {meaningForWord} from '../learning/sentenceRules/blueprints'
import {determinerAgrees} from '../learning/sentenceRules/determiners'
import {identificationAnswer,identificationQuestion,identificationAudio,references} from '../learning/sentenceRules/identification'
import {subjectPronouns,type SubjectWord} from '../learning/sentenceMatrix/subjectEngine'
import {allDeterminers,locationSentence,type Determiner} from '../learning/sentenceMatrix/model'
import type {LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'
import {generatedNumberCatalogue,numberItem,type NumberItem} from './numberCatalogue'
import {hierarchyTypes,hierarchyCompatible,pronounsReady,nounFamily,type HierarchyType,hierarchyState,targetsHierarchy} from './wordHierarchy'
import {composeQuestion,sentenceKey,sentenceHash,type GeneratedQuestion} from './generatedPracticeContent'
import type {ListeningEvidence,DeckOptions} from './generatedPracticeProgress'
import type {WordLearning} from '../learning/wordProgress/learningLifecycle'
import type {PracticeLevel} from './PracticeLevelPicker'
import {nounGroupFor} from './nounGroups'
import {vocabularyLearning} from './vocabularyProgress'

type State=ReturnType<typeof hierarchyState>
type Anchor={type:HierarchyType;word:string}
type Meal={subject:SubjectWord;verb:string;frame:ActionBlueprint;object:ActionObject;owner:Determiner;description?:string}
export class NoCompatibleBlueprintChoice extends Error {}
const clean=sentenceKey
/** This drawer contains individual words, never sentence permutations. */
const nouns=generatedNumberCatalogue
const family=(word:string)=>nounFamily(clean(word))
const nounWord=(subject:SubjectWord)=>subject.phrase?.noun??subject.word
const subject=(item:NumberItem):SubjectWord=>({word:`the ${item.word}`,thai:item.thai,kind:'person',number:item.number,phrase:{noun:item.word,nounThai:item.thai,determiner:{english:'the',thai:'ที่กำลังพูดถึง'}}})
const rotate=<T,>(items:readonly T[],turn:number):T[]=>{const n=items.length;if(!n)return [];const offset=((turn%n)+n)%n;return [...items.slice(offset),...items.slice(0,offset)]}
const eligible=(state:State,type:HierarchyType,word:string,foil=false)=>[...state[type].allowed,...(foil?state[type].queued:[])].some(w=>clean(w)===(type==='noun'?family(word):clean(word)))
const agrees=(owner:string,item:NumberItem)=>determinerAgrees(owner,item.pluralForm,meaningForWord(item)?.countability==='mass')&&(!['a','an'].includes(owner)||owner===(item.indefiniteArticle??(/^[aeiou]/i.test(item.word)?'an':'a')))
function descriptions(doc:LanguageDocument,word?:string):LanguageDocument{
 if(!word)return doc
 const index=doc.units.findIndex(unit=>unit.role==='object'),noun=clean(doc.units[index].english)
 const units=[...doc.units];units.splice(index,0,{role:'description',english:word,thai:adjectiveThaiForNoun(word,noun)})
 return {...doc,units,english:units.map(unit=>unit.english).join(' '),thai:doc.thai.replace(doc.units[index].thai,doc.units[index].thai+adjectiveThaiForNoun(word,noun))}
}
function nounDocument(level:PracticeLevel,item:NumberItem,owner:Determiner,identify=false,description?:string):LanguageDocument{
 if(identify)return identificationAnswer(item.pluralForm?'these':'this',item,owner)
 const line=level===1?{english:`${owner} ${item.word}`,thai:'',units:[{english:owner,thai:'',role:'determiner' as const},{english:item.word,thai:item.thai,role:'object' as const}]}:locationSentence(item,owner)
 const roles=['question','be','determiner','object'] as const
 const doc:LanguageDocument=level===1?{...line,construction:'noun-phrase',units:line.units as LanguageDocument['units']}:{...line,construction:'question',units:line.units.map((unit,index)=>({...unit,role:roles[index]}))}
 return descriptions(doc,description)
}
function pair(level:PracticeLevel,a:LanguageDocument,b:LanguageDocument,anchor:Anchor,action:string,owner:string):GeneratedQuestion{
 const words=[...new Set([...a.units,...b.units].filter(unit=>['person','object'].includes(unit.role)&&numberItem(clean(unit.english))).map(unit=>clean(unit.english)))]
 const item=a.units.find(unit=>unit.role==='object')
 const changedNoun=a.units.find((unit,index)=>['person','object'].includes(unit.role)&&family(unit.english)===anchor.word&&unit.english!==b.units[index]?.english)
 const target=anchor.type==='noun'&&changedNoun?clean(changedNoun.english):anchor.word
 const question=composeQuestion(level,a,b,{family:item?family(item.english):anchor.word,vocabulary:words,action,owner,subject:a.units.find(unit=>unit.role==='person')?.english??'',plural:!!numberItem(clean(item?.english??''))?.pluralForm},[target])
 return {...question,recipe:{version:1,level,anchor,a:documentRecipe(a),b:documentRecipe(b)}}
}
function chooseOwner(item:NumberItem,state:State,turn:number,required?:string,foil=false,compatible?:readonly string[]){
 const list=required?[required]:rotate(state.determiner.current,turn).concat(state.determiner.completed)
 return list.find(word=>(!compatible||compatible.includes(word))&&eligible(state,'determiner',word,foil)&&agrees(word,item)) as Determiner|undefined
}
/** Noun/determiner/adjective anchor → compatible noun → remaining grammar. */
function sceneQuestion(level:PracticeLevel,reference:typeof references[number],foil:typeof references[number],item:NumberItem):GeneratedQuestion{
 const doc=identificationQuestion(reference.id)
 return {id:`identify-v2-${reference.id}-${sentenceHash(item.word+'|'+foil.id)}`,version:1,level,document:doc,audioUrl:identificationAudio(reference.id),choices:[reference.word,foil.word],correct:0,sceneChoices:[{reference:reference.id,word:item.word},{reference:foil.id,word:item.word}],targetWords:[reference.word],listeningWords:[reference.word],family:family(item.word),vocabulary:[item.word],action:'identify',owner:'',subject:'',plural:reference.plural,kind:'meaning',credit:reference.word,recipe:{version:1,level,scene:{reference:reference.id,foil:foil.id,noun:item.word}}}
}
function nounQuestion(level:PracticeLevel,state:State,anchor:Anchor,turn:number,identify:boolean):GeneratedQuestion|undefined{
 if(identify&&anchor.type==='determiner'){
  const reference=references.find(item=>item.word===anchor.word)
  const foil=reference&&rotate(references,turn).find(item=>item.word!==reference.word&&item.plural===reference.plural&&eligible(state,'determiner',item.word,true))
  const item=reference&&rotate(nouns,turn).find(item=>!item.pluralForm&&!item.pairOnly&&eligible(state,'noun',item.word)&&(!reference.plural||!!item.plural))
  if(reference&&foil&&item)return sceneQuestion(level,reference,foil,item)
 }
 if(!['noun','determiner','adjective'].includes(anchor.type))return
 if(identify&&anchor.type==='adjective')return // No adjective slot in this authored answer.
 const available=nouns.filter(item=>eligible(state,'noun',item.word)&&(!identify||!item.pairOnly)&& (anchor.type!=='noun'||family(item.word)===anchor.word))
 for(const item of rotate(available,turn)){
  if(anchor.type==='adjective'&&(!state.noun.completed.includes(family(item.word))||!adjectiveFitsNoun(anchor.word,item)))continue
  const owner=chooseOwner(item,state,turn,anchor.type==='determiner'?anchor.word:undefined)
  if(!owner)continue
  let otherItem=item,otherOwner=owner,otherDescription:string|undefined
  if(anchor.type==='noun'){
   const candidates=nouns.filter(other=>other.word!==item.word&&eligible(state,'noun',other.word,true)&&agrees(owner,other)&&(!identify||other.pluralForm===item.pluralForm))
   const same=candidates.filter(other=>family(other.word)===family(item.word))
   const other=rotate(same.length?same:candidates,turn)[0];if(!other)continue;otherItem=other
  }else if(anchor.type==='determiner'){
   const other=rotate([...state.determiner.allowed,...state.determiner.queued],turn).find(word=>word!==owner&&agrees(word,item));if(!other)continue;otherOwner=other as Determiner
  }else{
   const other=rotate([...state.adjective.allowed,...state.adjective.queued],turn).find(word=>word!==anchor.word&&adjectiveFitsNoun(word,item));if(!other)continue;otherDescription=other
  }
  const doc=nounDocument(level,item,owner,identify,anchor.type==='adjective'?anchor.word:undefined),other=nounDocument(level,otherItem,otherOwner,identify,otherDescription)
  let question=pair(level,doc,other,anchor,identify?'identify':'number',owner)
  // Existing number answers remain noun phrases in a fixed singular/plural order.
  if(!identify&&anchor.type==='noun'&&family(item.word)===family(otherItem.word)){
   const singular=numberItem(item.singular??item.word),plural=numberItem(item.plural??'')
   if(singular&&plural){const choices=[nounDocument(1,singular,owner),nounDocument(1,plural,owner)] as [LanguageDocument,LanguageDocument];question={...question,kind:'number',alternatives:choices,choices:[choices[0].english,choices[1].english],correct:item.pluralForm?1:0};if(level===2){question.targetWords=[item.word,item.pluralForm?'are':'is'];question.credit=question.targetWords.join(' ')}}
  }
  if(level===3&&!identify)question=answerMode(question,Math.floor(turn/2)%2?'judgement-wrong':'judgement')
  question.recipe={...(question.recipe as PairRecipe),mode:level===3&&!identify?(Math.floor(turn/2)%2?'judgement-wrong':'judgement'):question.kind==='number'?'number':undefined}
  if(hierarchyCompatible(question,state))return question
 }
}
function locationQuestion(level:PracticeLevel,state:State,anchor:Anchor,turn:number):GeneratedQuestion|undefined{
 const people:SubjectWord[]=[...nouns.filter(item=>eligible(state,'noun',item.word)&&nounGroupFor(item)==='subjects').map(subject),...(pronounsReady(state)?subjectPronouns.filter(item=>item.word!=='it'&&eligible(state,'pronoun',item.word)).map(item=>({...item,kind:'person' as const})):[])]
 const places=[...locationWords(nouns).filter(item=>eligible(state,'noun',item.word)).map(place=>({place,named:false})),...defaultPlaceNames.map(place=>({place,named:true}))]
 const make=(person:SubjectWord,place:typeof places[number],owner:Determiner='the'):LanguageDocument=>({...locationAnswer(person,place.place,place.named,undefined,owner),construction:'location-answer'})
 for(const person of rotate(people,turn))for(const place of rotate(places,turn)){
  const nounRole=anchor.type==='noun'&&!!person.phrase&&family(nounWord(person))===anchor.word?'subject':'object'
  if(anchor.type==='noun'&&(nounRole==='subject'?false:!numberItem(place.place.word)||family(place.place.word)!==anchor.word))continue
  if(anchor.type==='pronoun'&&(person.phrase||clean(person.word)!==clean(anchor.word)))continue
  let first=person,second=person,otherPlace=place,owner:Determiner='the',otherOwner:Determiner='the'
  if(anchor.type==='noun'&&nounRole==='object'){
   const other=rotate(places,turn).find(candidate=>!candidate.named&&candidate.place.word!==place.place.word&&eligible(state,'noun',candidate.place.word,true));if(!other)continue;otherPlace=other
  }else if(anchor.type==='noun'||anchor.type==='pronoun'){
   const other=rotate(people,turn).find(candidate=>!!candidate.phrase===!!person.phrase&&candidate.word!==person.word);if(!other)continue;second=other
  }else if(anchor.type==='determiner'){
   if(place.named){
    const item=person.phrase&&numberItem(nounWord(person));if(!item||!agrees(anchor.word,item))continue
    const other=rotate([...state.determiner.allowed,...state.determiner.queued],turn).find(word=>word!==anchor.word&&agrees(word,item));if(!other)continue
    first={...person,phrase:{...person.phrase!,determiner:{english:anchor.word,thai:allDeterminers.find(item=>item.word===anchor.word)?.thai??''}}};second={...person,phrase:{...person.phrase!,determiner:{english:other,thai:allDeterminers.find(item=>item.word===other)?.thai??''}}}
   }else{
    const item=numberItem(place.place.word)!;if(!agrees(anchor.word,item))continue
    const other=rotate([...state.determiner.allowed,...state.determiner.queued],turn).find(word=>word!==anchor.word&&agrees(word,item));if(!other)continue;owner=anchor.word as Determiner;otherOwner=other as Determiner
   }
  }else continue
  const question=pair(level,make(first,place,owner),make(second,otherPlace,otherOwner),anchor,'location',owner)
  if(question.recipe)question.recipe={...(question.recipe as PairRecipe),structure:'location'}
  if(hierarchyCompatible(question,state))return question
 }
}
function activityQuestion(level:PracticeLevel,state:State,anchor:Anchor,turn:number):GeneratedQuestion|undefined{
 const available:SubjectWord[]=[...nouns.filter(item=>eligible(state,'noun',item.word)&&nounGroupFor(item)==='subjects').map(subject),...(pronounsReady(state)?subjectPronouns.filter(item=>item.word!=='it'&&eligible(state,'pronoun',item.word)).map(item=>({...item,kind:'person' as const})):[])]
 const foils:SubjectWord[]=[...nouns.filter(item=>eligible(state,'noun',item.word,true)&&nounGroupFor(item)==='subjects').map(subject),...(pronounsReady(state)?subjectPronouns.filter(item=>item.word!=='it'&&eligible(state,'pronoun',item.word,true)).map(item=>({...item,kind:'person' as const})):[])]
 const make=(person:SubjectWord):LanguageDocument=>({...actionDialogue('i','holding',{subject:person,vocabulary:nouns}).question,construction:'action-question'})
 for(const person of rotate(available,turn)){
  if(anchor.type==='noun'&&(!person.phrase||family(nounWord(person))!==anchor.word)||anchor.type==='pronoun'&&(person.phrase||clean(person.word)!==clean(anchor.word)))continue
  if(anchor.type==='adjective'){
   if(!person.phrase||!state.noun.completed.includes(family(nounWord(person)))||!adjectiveFitsNoun(anchor.word,nounWord(person)))continue
   const other=rotate([...state.adjective.allowed,...state.adjective.queued],turn).find(word=>word!==anchor.word&&adjectiveFitsNoun(word,nounWord(person)))
   if(!other)continue
   const described=(word:string)=>({...person,phrase:{...person.phrase!,description:{english:word,thai:adjectiveThaiForNoun(word,nounWord(person))}}})
   const question=pair(level,make(described(anchor.word)),make(described(other)),anchor,'doing','the');if(hierarchyCompatible(question,state))return question
  }else if(anchor.type==='noun'||anchor.type==='pronoun'){
   const other=rotate(foils,turn).find(item=>!!item.phrase===!!person.phrase&&item.word!==person.word)
   if(other){const question=pair(level,make(person),make(other),anchor,'doing','the');if(hierarchyCompatible(question,state))return question}
  }
 }
 return nounQuestion(2,state,anchor,turn,false)
}
function actionDocument(meal:Meal):LanguageDocument{
 const line=actionDialogue('i',meal.verb,{blueprint:meal.frame,vocabulary:nouns,subject:meal.subject,object:meal.object.word,determiner:meal.owner,description:meal.description?{english:meal.description,thai:adjectiveThaiForNoun(meal.description,meal.object.noun)}:undefined}).answer
 return {...line,construction:'action-answer'}
}
function fitsSubject(person:SubjectWord,verb:string,object:ActionObject){return subjectCanPerform(person,verb,object.noun)}
/** Anchor-first constraint propagation over word drawers. We materialize only
 * the chosen question and its one-slot foil, never a bank of complete sentences. */
function actionQuestion(level:PracticeLevel,state:State,anchor:Anchor,turn:number,request:ReturnType<typeof practiceBlueprintRequest>):GeneratedQuestion|undefined{
 const primarySubjects:SubjectWord[]=[...nouns.filter(item=>eligible(state,'noun',item.word)&&nounGroupFor(item)===request.subjectGroup).map(subject),...(pronounsReady(state)?subjectPronouns.filter(item=>item.word!=='it'&&eligible(state,'pronoun',item.word)).map(item=>({...item,kind:'person' as const})):[])]
 const foilSubjects:SubjectWord[]=[...nouns.filter(item=>eligible(state,'noun',item.word,true)&&nounGroupFor(item)===request.subjectGroup).map(subject),...(pronounsReady(state)?subjectPronouns.filter(item=>item.word!=='it'&&eligible(state,'pronoun',item.word,true)).map(item=>({...item,kind:'person' as const})):[])]
 const verbs=rotate([...state.verb.current,...state.verb.completed],turn).filter(word=>request.frames.some(frame=>!!actionInBlueprint(actionVocabulary.find(action=>action.word===word)!,frame))&&(!request.movementOnly||actionVocabulary.find(action=>action.word===word)?.destination))
 const frameFor=(word:string)=>matchingActionBlueprint(actionVocabulary.find(action=>action.word===word)!,request.frames)
 const allVerbs=[...state.verb.allowed,...state.verb.queued].filter(word=>!!frameFor(word)&&(!request.movementOnly||actionVocabulary.find(action=>action.word===word)?.destination))
 const objects=(verb:string)=>objectsForAction(verb,nouns,undefined,frameFor(verb))
 // Subject nouns and object nouns are separate drawers. Try either role when
 // the tested noun permits it; no fixed subject → verb → object starting order.
 const roles=anchor.type==='noun'&&nouns.some(item=>family(item.word)===anchor.word&&nounGroupFor(item)===request.subjectGroup)?['subject','object']:['object']
 for(const role of roles){
  const people=rotate(primarySubjects,turn).filter(person=>anchor.type==='pronoun'? !person.phrase&&clean(person.word)===clean(anchor.word):anchor.type==='noun'&&role==='subject'?!!person.phrase&&family(nounWord(person))===anchor.word:true)
  const actions=verbs.filter(word=>(anchor.type!=='verb'||word===anchor.word)&&people.some(person=>subjectCanPerform(person,word))&&objects(word).some(object=>eligible(state,'noun',object.noun)&&(anchor.type!=='noun'||role!=='object'||family(object.noun)===anchor.word)&&(anchor.type!=='determiner'||agrees(anchor.word,numberItem(object.noun)!)&&objectDeterminers(object).some(item=>item.word===anchor.word))&&(anchor.type!=='adjective'||adjectiveFitsNoun(anchor.word,object.noun))))
  // These loops solve compatibility on WORDS. No documents are created until
  // both the anchored sentence and a compatible single-slot foil are known.
  for(const verb of actions){
   const frame=frameFor(verb)!
   const objectOptions=objects(verb).filter(object=>eligible(state,'noun',object.noun)&& (anchor.type!=='noun'||role!=='object'||family(object.noun)===anchor.word)&& (anchor.type!=='adjective'||state.noun.completed.includes(family(object.noun))&&adjectiveFitsNoun(anchor.word,object.noun)))
   for(const object of rotate(objectOptions,turn)){
    const item=numberItem(object.noun)!,owner=chooseOwner(item,state,turn,anchor.type==='determiner'?anchor.word:undefined,false,objectDeterminers(object).map(item=>item.word))
    if(!owner)continue
    // Checking the object here lets a determiner anchor travel noun → verb → subject.
    for(const person of people){
     if(!fitsSubject(person,verb,object)||person.phrase&&!eligible(state,'determiner','the'))continue
     if(anchor.type==='adjective'&&person.phrase&&!state.noun.completed.includes(family(nounWord(person))))continue
     const meal:Meal={subject:person,verb,frame,object,owner,...(anchor.type==='adjective'?{description:anchor.word}:{})}
     let other:Meal|undefined
     if(anchor.type==='verb'){
      const alternative=rotate(allVerbs,turn).find(word=>word!==verb&&frameFor(word)?.connection===frame.connection&&fitsSubject(person,word,object)&&objects(word).some(candidate=>candidate.noun===object.noun&&objectDeterminers(candidate).some(item=>item.word===owner)))
      if(alternative)other={...meal,verb:alternative,frame:frameFor(alternative)!,object:objects(alternative).find(candidate=>candidate.noun===object.noun)!}
     }else if(anchor.type==='noun'&&role==='object'){
      const alternative=rotate(objects(verb),turn).find(candidate=>candidate.noun!==object.noun&&eligible(state,'noun',candidate.noun,true)&&agrees(owner,numberItem(candidate.noun)!)&&objectDeterminers(candidate).some(item=>item.word===owner)&&fitsSubject(person,verb,candidate))
      if(alternative)other={...meal,object:alternative}
     }else if(anchor.type==='noun'||anchor.type==='pronoun'){
      const alternative=rotate(foilSubjects,turn).find(candidate=>!!candidate.phrase===!!person.phrase&&candidate.word!==person.word&&fitsSubject(candidate,verb,object))
      if(alternative)other={...meal,subject:alternative}
     }else if(anchor.type==='determiner'){
      const alternative=rotate([...state.determiner.allowed,...state.determiner.queued],turn).find(word=>word!==owner&&agrees(word,item)&&objectDeterminers(object).some(item=>item.word===word));if(alternative)other={...meal,owner:alternative as Determiner}
     }else{
      const alternative=rotate([...state.adjective.allowed,...state.adjective.queued],turn).find(word=>word!==anchor.word&&adjectiveFitsNoun(word,object.noun));if(alternative)other={...meal,description:alternative}
     }
     if(!other)continue
     const question=pair(level,actionDocument(meal),actionDocument(other),anchor,verb,owner)
     if(hierarchyCompatible(question,state))return question
    }
   }
  }
 }
}
export function serveBlueprintDeck(level:PracticeLevel,state:State,learning:Map<string,WordLearning>,events:ListeningEvidence[],seed:string,options:DeckOptions):GeneratedQuestion[]{
 const request=practiceBlueprintRequest(level,options.structure),result:GeneratedQuestion[]=[],now=options.now??Date.now()
 const counts=new Map<string,number>()
 for(const event of events.slice(-180)){for(const type of hierarchyTypes)for(const word of state[type].current)if(targetsHierarchy({credit:event.targets.length?'answer':null,targetWords:event.targets},type,word))counts.set(type+':'+word,(counts.get(type+':'+word)??0)+1)}
 const length=Math.min(30,options.limit??30),salt=parseInt(sentenceHash(seed),36)
 for(let index=0;index<length;index++){
  const turn=options.selectionIndex??index,rotation=turn+(salt>>>8)
  const types=[...hierarchyTypes.slice(turn%hierarchyTypes.length),...hierarchyTypes.slice(0,turn%hierarchyTypes.length)]
  const due=hierarchyTypes.flatMap(type=>state[type].completed.filter(word=>vocabularyLearning(type,word,learning,now).due).map(word=>({type,word})))
  const anchors=options.focus?[options.focus]:[...due,...types.flatMap(type=>rotate(state[type].current,Math.floor(turn/5)).map(word=>({type,word})).sort((a,b)=>(counts.get(type+':'+a.word)??0)-(counts.get(type+':'+b.word)??0)))]
  if(!options.focus)for(const type of types)for(const word of rotate(state[type].completed,rotation))anchors.push({type,word})
  let selected:GeneratedQuestion|undefined
  for(const anchor of anchors){
   if(!request.anchors.includes(anchor.type))continue
   selected=request.construction==='action'?actionQuestion(level,state,anchor,rotation,request):request.construction==='activity-question'?activityQuestion(level,state,anchor,rotation):request.construction==='location'?locationQuestion(level,state,anchor,rotation):nounQuestion(level,state,anchor,rotation,request.construction==='identify')
   if(selected){counts.set(anchor.type+':'+anchor.word,(counts.get(anchor.type+':'+anchor.word)??0)+1);break}
  }
  if(selected&&selected.recipe)selected.recipe={...(selected.recipe as PairRecipe),structure:options.structure}
  if(!selected)throw new NoCompatibleBlueprintChoice(`Blueprint ${request.construction} has no compatible single-word contrast in the learner's eligible drawers`)
  const flip=selected.kind==='meaning'&&(((salt>>>16)+(options.selectionIndex??index))%2===1)
  result.push(flip?{...selected,choices:[selected.choices[1],selected.choices[0]],alternatives:selected.alternatives?[selected.alternatives[1],selected.alternatives[0]]:undefined,sceneChoices:selected.sceneChoices?[selected.sceneChoices[1],selected.sceneChoices[0]]:undefined,correct:selected.correct===0?1:0}:selected)
 }
 return result
}

/** A compact recipe names reviewed ingredients, never arbitrary Thai, credit or
 * answers. The server reconstructs just these two documents before registering. */
type DocumentRecipe={construction:LanguageDocument['construction'];noun?:string;owner?:string;description?:string;person?:string;personOwner?:string;personDescription?:string;verb?:string;connection?:string;reference?:string}
type PairRecipe={version:1;level:PracticeLevel;anchor:Anchor;a:DocumentRecipe;b:DocumentRecipe;mode?:'number'|'judgement'|'judgement-wrong';structure?:DeckOptions['structure']}
type SceneRecipe={version:1;level:PracticeLevel;scene:{reference:string;foil:string;noun:string}}
function documentRecipe(doc:LanguageDocument):DocumentRecipe{
 const word=(role:string)=>{const value=doc.units.find(unit=>unit.role===role)?.english;return value?.replace(/[.!?]$/,'')}
 const objectIndex=doc.units.findIndex(unit=>unit.role==='object'),personIndex=doc.units.findIndex(unit=>unit.role==='person')
 return {construction:doc.construction,noun:word('object'),owner:word('determiner'),person:word('person'),personOwner:word('person-determiner')?.toLowerCase(),verb:word('action'),connection:word('preposition'),reference:word('reference'),description:objectIndex>0&&doc.units[objectIndex-1].role==='description'?doc.units[objectIndex-1].english:undefined,personDescription:personIndex>0&&doc.units[personIndex-1].role==='description'?doc.units[personIndex-1].english:undefined}
}
function restoreDocument(recipe:DocumentRecipe,level:PracticeLevel,structure?:DeckOptions['structure']):LanguageDocument{
 const item=recipe.noun?numberItem(recipe.noun):undefined,owner=recipe.owner as Determiner|undefined
 if(item&&owner&&!agrees(owner,item))throw new Error('Incompatible noun/determiner recipe')
 if(recipe.description&&(!item||!adjectiveFitsNoun(recipe.description,item)))throw new Error('Incompatible adjective recipe')
 if(['noun-phrase','question'].includes(recipe.construction)){
  if(!item||!owner)throw new Error('Noun recipe requires reviewed slots')
  return nounDocument(recipe.construction==='noun-phrase'?1:2,item,owner,false,recipe.description)
 }
 if(recipe.construction==='identification-answer'){
  const reference=references.find(item=>item.word===recipe.reference?.toLowerCase())
  if(!item||!owner||!reference||reference.plural!==item.pluralForm)throw new Error('Invalid identification recipe')
  return identificationAnswer(reference.id,item,owner)
 }
 const personItem=recipe.person?numberItem(recipe.person):undefined,pronoun=subjectPronouns.find(item=>item.word.toLowerCase()===recipe.person?.toLowerCase())
 let person:SubjectWord|undefined
 if(personItem&&nounGroupFor(personItem)==='subjects'){
  if(!recipe.personOwner||!agrees(recipe.personOwner,personItem))throw new Error('Invalid subject determiner')
  person=subject(personItem);person.phrase={...person.phrase!,determiner:{english:recipe.personOwner,thai:allDeterminers.find(item=>item.word===recipe.personOwner)?.thai??''}}
  if(recipe.personDescription){if(!adjectiveFitsNoun(recipe.personDescription,personItem))throw new Error('Invalid subject adjective');person.phrase.description={english:recipe.personDescription,thai:adjectiveThaiForNoun(recipe.personDescription,personItem)}}
 }else if(pronoun&&pronoun.word!=='it'&&!recipe.personOwner)person={...pronoun,kind:'person'}
 if(!person)throw new Error('Recipe requires a reviewed agent')
 if(recipe.construction==='location-answer'){
  if(structure!=='location'||recipe.connection!=='at')throw new Error('Invalid location blueprint')
  const named=defaultPlaceNames.find(place=>place.word===recipe.noun),place=named??item
  if(!place||!named&&!locationWords(nouns).some(word=>word.word===place.word)||named&&owner)throw new Error('Invalid at-location noun')
  return {...locationAnswer(person,place,!!named,undefined,owner??'the'),construction:'location-answer'}
 }
 if(recipe.construction==='action-question'){
  if(level!==4||recipe.verb!=='doing')throw new Error('Invalid activity question blueprint')
  return {...actionDialogue('i','holding',{subject:person,vocabulary:nouns}).question,construction:'action-question'}
 }
 if(recipe.construction!=='action-answer'||!item||!owner)throw new Error('Unsupported blueprint recipe')
 const request=practiceBlueprintRequest(level,structure),lexical=actionVocabulary.find(item=>item.word===recipe.verb||item.spoken===recipe.verb),frame=request.frames.find(frame=>frame.connection===(recipe.connection??'direct'))
 if(request.construction!=='action'||!lexical||!frame||!actionInBlueprint(lexical,frame)||request.movementOnly&&!lexical.destination)throw new Error('Recipe violates the action blueprint')
 const object=objectsForAction(lexical.word,nouns,undefined,frame).find(object=>object.noun===item.word&&objectDeterminers(object).some(item=>item.word===owner))
 if(!object||!subjectCanPerform(person,lexical.word,object.noun))throw new Error('Recipe violates lexical compatibility')
 return actionDocument({subject:person,verb:lexical.word,frame,object,owner,description:recipe.description})
}
function answerMode(question:GeneratedQuestion,mode:PairRecipe['mode']):GeneratedQuestion{
 if(!mode)return question
 const noun=question.document.units.find(unit=>unit.role==='object'),owner=question.document.units.find(unit=>unit.role==='determiner')?.english as Determiner,item=noun&&numberItem(clean(noun.english))
 if(!item||!owner)throw new Error('Answer mode requires a noun')
 if(mode==='judgement'||mode==='judgement-wrong'){
  if(question.level!==3||question.document.construction!=='question')throw new Error('Invalid judgement blueprint')
  const verb=item.pluralForm?'are':'is',wrong=mode==='judgement-wrong',units=question.document.units.map(unit=>unit.role==='be'&&wrong?{...unit,english:verb==='is'?'are':'is'}:unit),document={...question.document,units,english:units.map(unit=>unit.english).join(' ')}
  return {...question,id:question.id+(wrong?'-grammar-error':''),document,kind:'judgement',choices:['Correct','Incorrect'],alternatives:undefined,correct:wrong?1:0,targetWords:[verb],listeningWords:[verb,...(wrong?[verb==='is'?'are':'is']:[])],credit:wrong?null:verb}
 }
 const singular=numberItem(item.singular??item.word),plural=numberItem(item.plural??'')
 if(!singular||!plural||!agrees(owner,singular)||!agrees(owner,plural)||question.level>2)throw new Error('Invalid number contrast')
 const choices=[nounDocument(1,singular,owner),nounDocument(1,plural,owner)] as [LanguageDocument,LanguageDocument]
 return {...question,kind:'number',alternatives:choices,choices:[choices[0].english,choices[1].english],correct:item.pluralForm?1:0,...(question.level===2?{targetWords:[item.word,item.pluralForm?'are':'is'],credit:[item.word,item.pluralForm?'are':'is'].join(' ')}:{})}
}
export function canonicalBlueprintQuestion(input:unknown):GeneratedQuestion|undefined{
 try{
  if(!input||typeof input!=='object'||JSON.stringify(input).length>6000)return
  const recipe=input as PairRecipe&SceneRecipe
  if(recipe.version!==1||![1,2,3,4,5,6].includes(recipe.level)||recipe.mode&&!['number','judgement','judgement-wrong'].includes(recipe.mode))return
  if(recipe.scene){
   const {reference,foil,noun}=recipe.scene,ref=references.find(item=>item.id===reference),other=references.find(item=>item.id===foil),item=numberItem(noun)
   if(!ref||!other||ref.id===other.id||ref.plural!==other.plural||!item||item.pluralForm||item.pairOnly||ref.plural&&!item.plural)return
   return sceneQuestion(recipe.level,ref,other,item)
  }
  const anchor=recipe.anchor
  if(!anchor||!hierarchyTypes.includes(anchor.type)||typeof anchor.word!=='string')return
  const a=restoreDocument(recipe.a,recipe.level,recipe.structure),b=restoreDocument(recipe.b,recipe.level,recipe.structure)
  if(a.construction!==b.construction||a.units.length!==b.units.length)return
  const changed=a.units.filter((unit,index)=>unit.english!==b.units[index].english||unit.role!==b.units[index].role),semantic=changed.filter(unit=>unit.role!=='be')
  if(!changed.length||semantic.length!==1||a.units.some((unit,index)=>unit.role!==b.units[index].role))return
  const expected=anchor.type==='noun'?['object','person']:anchor.type==='verb'?['action']:anchor.type==='adjective'?['description']:anchor.type==='determiner'?['determiner','person-determiner']:['person']
  if(!expected.includes(semantic[0].role)||(anchor.type==='noun'?family(semantic[0].english)!==anchor.word:clean(semantic[0].english)!==clean(anchor.word)))return
  const verb=a.units.find(unit=>unit.role==='action')?.english??(a.construction.startsWith('identification')?'identify':'number'),owner=a.units.find(unit=>unit.role==='determiner')?.english??'the'
  return answerMode(pair(recipe.level,a,b,anchor,verb,owner),recipe.mode)
 }catch{return undefined}
}
