import {actionCapabilities} from '../sentenceRules/actionCapabilities'
import MatrixExplanation from './MatrixExplanation'
import {vocabularyCategories} from './vocabularyCategories'
import VocabularyCategoryIcon from './VocabularyCategoryIcon'
import {type ClassroomWord,type Determiner} from './model'
import {subjectVerb,nounBlock,type NounMode,type SubjectWord} from './subjectEngine'
import {meaningForWord} from '../sentenceRules/blueprints'
import ProperNounIcon from './ProperNounIcon'
import VocabularyPicture from '../VocabularyPicture'
import AgreementPairs from './AgreementPairs'
import {useEffect,useId,useRef,useState} from 'react'
import type {SentenceMatrixProps} from './SentenceMatrix'
import {actionDialogue,type ActionSubject} from '../sentenceRules/actionDialogue'
import ExampleLanguage from './ExampleView'
import MatrixPicker from './MatrixPicker'
import WordTray, {type WordChoiceGroup} from './WordTray'
import WordSlotIcon from './WordSlotIcon'
import PronounIcon from './PronounIcon'
import Icon from '../../ui/Icon'
import {ActionIcon} from './ActionVocabularyIcon'
import {getLanguage} from '../../classroom/language'
import EducationFrame from './EducationFrame'
import EducationSectionHeading from './EducationSectionHeading'
import PronunciationComparison from '../../classroom/pronunciation/PronunciationComparison'
import PatternNavigation from './PatternNavigation'
import useMatrixEducation from './useMatrixEducation'
import './peopleLocation.css'

type Role='question'|'person'|'be'|'action'|'object'|'determiner'|'preposition'|'person-determiner'
/** Construction data supplies roles; all cards, selectors and education use the shared engine. */
export default function ActionMatrix({lesson,settings={},wordScores,initialAction}:SentenceMatrixProps){
 const capability=actionCapabilities(lesson)
 const allowedActions=capability.actions
 const actionGroups:WordChoiceGroup[]=vocabularyCategories.map(category=>({...category,words:allowedActions.filter(action=>action.categories.includes(category.id)).map(action=>action.word),icon:<VocabularyCategoryIcon category={category.id}/>})).filter(group=>group.words.length>0)
 const [subject,setSubject]=useState<ActionSubject>(initialAction?.subject??((lesson.subjectModes?.initialPronoun??capability.subjects.find(item=>item.word==='you')?.word??capability.subjects[0]?.word)?.toLowerCase() as ActionSubject|undefined)??'you')
 const [action,setAction]=useState(initialAction?.action??allowedActions[0].word)
 const [mode,setMode]=useState<'question'|'answer'>(settings.initialPattern??'question')
 const [active,setActive]=useState<Role|null>(null)
 const [answerPronoun,setAnswerPronoun]=useState<SubjectWord|undefined>(()=>{if(!initialAction?.answerPronoun)return undefined;const selected=capability.subjects.find(item=>item.word.toLowerCase()===initialAction.answerPronoun!.toLowerCase());if(!selected)throw new Error('Saved answer subject outside lesson scope');return selected})
 const [determiner,setDeterminer]=useState<Determiner|undefined>(initialAction?.determiner??lesson.initialOwner)
 const [object,setObject]=useState<string|undefined>(initialAction?.object)
 const [personMode,setPersonMode]=useState<NounMode>(initialAction?.personMode??'pronoun'),[personWord,setPersonWord]=useState<string|undefined>(initialAction?.personWord)
 const [objectMode,setObjectMode]=useState<NounMode>('noun'),[destinationWord,setDestinationWord]=useState<string>()
 const subjectChoices=capability.subjects.map(item=>({...item,word:mode==='answer'?item.word.charAt(0).toUpperCase()+item.word.slice(1):item.word,kind:'person' as const}))
 const personBlock=nounBlock<SubjectWord>({pronoun:subjectChoices,name:lesson.subjectModes?.names.filter(item=>item.kind==='person'),noun:lesson.vocabulary.filter(item=>meaningForWord(item)?.kind==='person').map(item=>({...item,word:`the ${item.word}`,phrase:{noun:item.word,nounThai:item.thai,determiner:{english:'the',thai:'ที่กำลังพูดถึง'}},kind:'person' as const}))},personMode,personWord)
 const objectBlock=nounBlock({noun:capability.objects(action),name:allowedActions.find(item=>item.word===action)?.complement==='destination'?lesson.subjectModes?.names.filter(item=>item.kind==='place').map(item=>({...item,word:`to ${item.word}`,thai:`ไปที่${item.thai}`})):[]},objectMode,objectMode==='name'?destinationWord:object)
 const namedDestination=objectBlock.mode==='name'?lesson.subjectModes?.names.find(item=>`to ${item.word}`===objectBlock.selected?.word):undefined
 const id=useId(),th=getLanguage()==='th',board=useRef<HTMLElement>(null)
 const {explaining,explain}=useMatrixEducation(board,`${id}-explanation`,()=>setActive(null))
 if(determiner&&lesson.owners&&!lesson.owners.includes(determiner))throw new Error('Determiner outside lesson scope')
 if(personBlock.mode==='pronoun'&&!capability.subjects.some(item=>item.word.toLowerCase()===subject))throw new Error('Subject outside lesson scope')
 const pair=actionDialogue(subject,action,{question:lesson.actionQuestion,vocabulary:lesson.vocabulary,object,determiner:determiner??(!initialAction&&objectBlock.mode==='noun'&&objectBlock.selected&&!objectBlock.selected.phrase?.determiner?'the':undefined),subject:personBlock.mode==='pronoun'?(mode==='answer'?answerPronoun??(lesson.actionReply==='same-subject'?capability.subjects.find(item=>item.word.toLowerCase()===subject):undefined):undefined):personBlock.selected,destination:namedDestination}),sentence=pair[mode]
 const roles:Role[]=sentence.units.map(unit=>unit.role)
 const slots=roles.map(role=>role==='question'||role==='preposition'?0:role==='be'||role==='action'?1:role.endsWith('determiner')?2:3)
 const objects=capability.objects(action)
 const nounCatalogue:ClassroomWord[]=objects.map(object=>lesson.vocabulary.find(item=>item.word===object.noun)!)
 const owners=objectBlock.mode==='noun'&&pair.object?capability.determiners(objects.find(item=>item.noun===pair.object!.noun)!):[]
 const choicesFor=(role:Role)=>role==='person'?personBlock.choices:role==='object'?(objectBlock.mode==='noun'?nounCatalogue:objectBlock.choices):role==='determiner'?owners:role==='action'&&(mode==='answer'||lesson.actionQuestion==='destination')?allowedActions:[]
 const valueFor=(role:Role)=>sentence.units[roles.indexOf(role)].english.replace(/[?.]$/,'')
 const iconFor=(role:Role,value=valueFor(role))=>role.endsWith('determiner')?<WordSlotIcon slot={2} word={value}/>:role==='preposition'?<WordSlotIcon slot={0}/>:role==='person'?(personBlock.mode==='name'?<ProperNounIcon word={value}/>:personBlock.mode==='noun'?<VocabularyPicture word={value.replace(/^the /,'')}/>:<PronounIcon word={value}/>):role==='object'?(objectBlock.mode==='name'?<ProperNounIcon word={value.replace(/^to /,'')}/>:<VocabularyPicture word={value}/>):role==='be'?<WordSlotIcon slot={1} plural={value==='are'}/>:lesson.actionQuestion==='destination'&&role==='question'?<WordSlotIcon slot={0}/>:lesson.actionQuestion==='destination'&&role==='action'?<ActionIcon word={value}/>:role==='question'||mode==='question'?<img className="cw-game-icon" src={`/classroom/icons/constructions/${role==='question'?'what':'doing'}.png`} alt="" draggable={false}/>:<ActionIcon word={value}/>
 const category=(role:Role)=>({'person-determiner':th?'คำนำหน้านาม':'Determiner',determiner:th?'คำนำหน้านาม':'Determiner',preposition:th?'คำบุพบท':'Preposition',question:th?'คำถาม':'Question',person:th?'ผู้กระทำ':'Person',be:th?'คำกริยา':'Verb',action:th?'การกระทำ':'Action',object:allowedActions.find(item=>item.word===action)?.complement==='destination'?(th?'สถานที่':'Place'):(th?'สิ่งที่กระทำต่อ':'Object')})[role]
 function groupsFor(role:Role):WordChoiceGroup[]{
  if(role==='action'&&(mode==='answer'||lesson.actionQuestion==='destination'))return actionGroups
  return []
 }
 useEffect(()=>()=>window.speechSynthesis?.cancel(),[sentence.english])
 function closePicker(){
  setActive(null)
  board.current?.querySelector<HTMLButtonElement>(`[data-word-role="${active}"]`)?.focus({preventScroll:true})
 }
 function choose(role:Role,value:string){
  if(role==='person'&&personBlock.mode!=='pronoun')setPersonWord(value)
  else if(role==='person'){
   if(mode==='answer'){setAnswerPronoun(subjectChoices.find(item=>item.word===value));if(lesson.actionReply==='same-subject')setSubject(value.toLowerCase() as ActionSubject)}
   else {setSubject(value.toLowerCase() as ActionSubject);setAnswerPronoun(undefined)}
  }else if(role==='object'){if(objectBlock.mode==='name')setDestinationWord(value);else {const next=objects.find(item=>item.noun===value)!;setObject(next.word);if(determiner&&['a','an'].includes(determiner)&&!capability.determiners(next).some(item=>['a','an'].includes(item.word)))setDeterminer(undefined)}}
  else if(role==='determiner')setDeterminer(value as Determiner)
  else if(role==='action'){
   setDeterminer(undefined)
   setAction(value)
   setObjectMode('noun')
   if(!capability.objects(value).some(o=>o.word===object))setObject(undefined)
  }
  closePicker()
 }
 function picker(role:Role){
  if(settings.wordPicker===false||choicesFor(role).length<2)return undefined
  return <MatrixPicker role={role} label={`Change ${role}`} expanded={active===role} controls={`${id}-words`} onClick={()=>setActive(active===role?null:role)}/>
 }
 const details=roles.map(role=>({label:category(role),count:choicesFor(role).length||1,icon:iconFor(role),control:picker(role)}))
 const personSwapper={label:'Subject block mode',modes:personBlock.modes,mode:personBlock.mode,onChange:(next:NounMode)=>{setPersonMode(next);setActive(null)}}
 const objectSwapper={label:'Object block mode',modes:objectBlock.modes,mode:objectBlock.mode,onChange:(next:NounMode)=>{setObjectMode(next);setActive(null)}}
 const nounGroups=roles.flatMap((role,index)=>role==='person-determiner'?[{start:index,end:index+2}]:[])
 const layout={nounGroups,actionComplement:mode==='answer'&&!!pair.object,leadingCount:mode==='answer'&&pair.object?(roles.includes('preposition')?4:3):undefined,subjectSwapper:mode==='answer'?personSwapper:undefined,nounSwapper:mode==='question'?personSwapper:pair.object?objectSwapper:undefined,construction:mode==='question'?'action-question' as const:'action-answer' as const,noun:mode==='answer'&&roles.includes('determiner')?'phrase' as const:'single' as const}
 if(explaining!==null&&settings.explanations!==false){
  const role=roles[explaining],selected=valueFor(role),slot=slots[explaining]
  if((role==='object'||role==='determiner')&&objectBlock.mode==='noun'&&pair.object)return <MatrixExplanation id={`${id}-explanation`} slot={role==='object'?3:2} value={(pair.object.phrase.determiner?.english??'the') as Determiner} onChange={setDeterminer} onBack={()=>explain(null)} word={pair.object.noun} thai={pair.object.phrase.nounThai} onWord={value=>choose('object',value)} catalogue={nounCatalogue} owners={owners} verbs={[]} allowSelection={settings.explanationSelection!==false}/>
  return <EducationFrame id={`${id}-explanation`} selected={selected} category={category(role)} colour={slot===0?'#df2944':slot===1?'#128247':'#ffd43b'} ink={slot===3?'#18385e':'#fff'} icon={iconFor(role)} gloss={sentence.units[explaining].thai} onBack={()=>explain(null)}>
   <section className="cw-reference-word">
    <EducationSectionHeading icon="usage">{th?'การใช้คำนี้':'How it works'}</EducationSectionHeading>
    {(role==='person'||role==='be')&&<AgreementPairs question={mode==='question'} pairs={subjectChoices.map(item=>({person:item.word,verb:subjectVerb(item),icon:<PronounIcon word={item.word}/>,selected:valueFor('person').toLowerCase()===item.word.toLowerCase()}))}/>}
    <div className="cw-sentence-board"><ExampleLanguage matrix {...sentence} layout={layout} semanticSlots={slots} slotDetails={details.map(({control,...detail})=>detail)} settings={{explanations:false,wordPicker:false,layout:{density:'compact'}}}/></div>
   </section>
   <PronunciationComparison word={selected}/>
   {settings.explanationSelection!==false&&choicesFor(role).length>1&&<section className="cw-vocabulary-section">
    <EducationSectionHeading icon="words">{th?'เลือกคำ':'Choose a word'}</EducationSectionHeading>
    <WordTray key={role} id={`${id}-education-words`} active={slot} choices={choicesFor(role)} selected={selected} groups={groupsFor(role)} canChoose={()=>true} renderIcon={value=>iconFor(role,value)} onChoose={value=>choose(role,value)} onClose={()=>explain(null)}/>
   </section>}
  </EducationFrame>
 }
 return <section ref={board} className="cw-pattern-stage" onKeyDown={e=>{if(e.key==='Escape'&&active){e.stopPropagation();closePicker()}}}>
  {settings.patternNavigation!==false&&<PatternNavigation label="Question and answer" pattern={mode} onChange={value=>{setMode(value);setActive(null)}}/>}
  <section className="cw-sentence-board" aria-label={settings.fadeMode?'Listen to the sentence':sentence.english}><div className="cw-sentence-display">
   <ExampleLanguage matrix {...sentence} settings={settings} scores={wordScores} layout={layout} semanticSlots={slots} slotDetails={details}
    unitActions={settings.explanations===false?undefined:roles.map((role,index)=>({index,label:`Slot ${index+1}: ${valueFor(role)}`,controls:`${id}-explanation`,expanded:false,onClick:()=>explain(index)}))}
    afterUnits={settings.wordPicker===false?undefined:<WordTray vocabulary={active==='object'&&objectBlock.mode==='noun'?nounCatalogue:undefined} reserveFilters key={active??'closed'} id={`${id}-words`} active={active===null?null:slots[roles.indexOf(active)]} choices={active?choicesFor(active):[]} groups={active?groupsFor(active):[]} selected={active==='person'&&personBlock.mode!=='pronoun'?personBlock.selected?.word??'':active==='object'&&objectBlock.mode==='name'?objectBlock.selected?.word??'':active?valueFor(active):''} canChoose={()=>true} renderIcon={value=>active?iconFor(active,value):null} onClose={closePicker} onChoose={value=>active&&choose(active,value)}/>}
    translationControl={settings.audio===false?undefined:<button type="button" className="cw-sound" aria-label="Listen" onClick={()=>{window.speechSynthesis?.cancel();const utterance=new SpeechSynthesisUtterance(sentence.english);utterance.lang='en-US';utterance.rate=.85;window.speechSynthesis?.speak(utterance)}}><Icon name="sound"/></button>}/>
  </div></section>
 </section>
}
