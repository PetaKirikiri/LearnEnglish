import {useEffect,useId,useRef,useState} from 'react'
import {references,identificationQuestion,identificationAnswer,identificationAudio,type ReferenceId} from '../sentenceRules/identification'
import {meaningForWord} from '../sentenceRules/blueprints'
import {grammaticalNumber} from './vocabularyCategories'
import {lessonDeterminers,ownerThai,type Determiner} from './model'
import {languageRoleIcon,quadrantLayout,type LanguageRole} from './LanguageQuadrant'
import EducationFrame from './EducationFrame'
import EducationSectionHeading from './EducationSectionHeading'
import PronunciationComparison from '../../classroom/pronunciation/PronunciationComparison'
import useMatrixEducation from './useMatrixEducation'
import PatternNavigation from './PatternNavigation'
import {getLanguage} from '../../classroom/language'
import ExampleLanguage from './ExampleView'
import DistanceScene from './DistanceScene'
import VocabularyPicture from '../VocabularyPicture'
import MatrixPicker from './MatrixPicker'
import WordTray from './WordTray'
import Icon from '../../ui/Icon'
import WordSlotIcon from './WordSlotIcon'
import type {SentenceMatrixProps} from './SentenceMatrix'
import './peopleLocation.css'

type ChoiceRole='reference'|'determiner'|'object'
/** Lesson data feeds the shared question/answer navigation, boxes and word dock. */
export default function IdentificationMatrix({lesson,settings={},wordScores}:SentenceMatrixProps){
 const [selected,setSelected]=useState<ReferenceId>('this')
 const [mode,setMode]=useState<'question'|'answer'>(settings.initialPattern??'question')
 const [active,setActive]=useState<ChoiceRole|null>(null),[error,setError]=useState(false)
 const [word,setWord]=useState(lesson.initialWord),[owner,setOwner]=useState<Determiner>(lesson.initialOwner??'the')
 const reference=references.find(item=>item.id===selected)!
 const bases=lesson.vocabulary.filter(item=>grammaticalNumber(item)==='singular'&&meaningForWord(item)?.kind==='physical-object'&&item.plural)
 const objects=bases.map(item=>reference.plural?{...item,word:item.plural!,number:'plural' as const}:item)
 const object=objects.find(item=>item.word===word||item.singular===word||item.plural===word)??objects[0]
 const owners=lessonDeterminers(lesson).filter(item=>!['a','an'].includes(item.word))
 const sentence=mode==='question'?identificationQuestion(selected):identificationAnswer(selected,object,owner)
 const player=useRef<HTMLAudioElement>(null),board=useRef<HTMLElement>(null),id=useId()
 const {explaining,explain}=useMatrixEducation(board,`${id}-explanation`,()=>setActive(null))
 const th=getLanguage()==='th',slots=sentence.units.map(unit=>unit.role==='question'?0:unit.role==='be'?1:unit.role==='determiner'?2:3)
 const choicesFor=(role:LanguageRole)=>role==='reference'?references:role==='determiner'?owners:role==='object'?objects:[]
 const valueFor=(role:LanguageRole)=>role==='reference'?reference.word:role==='determiner'?owner:role==='object'?object.word:''
 const iconFor=(role:LanguageRole,value:string)=>role==='reference'?<DistanceScene compact reference={references.find(item=>item.word===value.toLowerCase())!.id} word={object.word}/>:role==='determiner'?<WordSlotIcon slot={2} word={value}/>:<VocabularyPicture word={value}/>
 function choose(role:ChoiceRole,value:string){
  if(role==='reference')setSelected(references.find(item=>item.word===value)!.id)
  else if(role==='determiner')setOwner(value as Determiner)
  else setWord(objects.find(item=>item.word===value)?.singular??value)
  setError(false)
 }
 function close(){setActive(null);board.current?.querySelector<HTMLButtonElement>(`[data-word-role="${active}"]`)?.focus({preventScroll:true})}
 useEffect(()=>{const audio=player.current;return()=>{audio?.pause();window.speechSynthesis?.cancel()}},[sentence.english])
 async function play(){
  setError(false)
  if(mode==='question'&&player.current){player.current.pause();player.current.src=identificationAudio(selected);try{await player.current.play()}catch{setError(true)}}
  else if(window.speechSynthesis){window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(sentence.english);speech.lang='en-US';speech.rate=.85;speech.onerror=()=>setError(true);window.speechSynthesis.speak(speech)}
  else setError(true)
 }
 if(explaining!==null&&settings.explanations!==false){
  const unit=sentence.units[explaining],value=unit.english.replace(/[?.]$/,''),role=unit.role,slot=slots[explaining]
  const meaning=role==='question'?(th?'What ใช้ถามว่าสิ่งนั้นคืออะไร':'What asks what something is.'):role==='be'?(th?'ใช้ is กับ this / that และใช้ are กับ these / those':'Use is with this / that and are with these / those.'):role==='reference'?(th?'this อยู่ใกล้ผู้พูด · that อยู่ใกล้ผู้ฟัง · that over there อยู่ไกลจากทั้งสองคน · these / those ใช้กับหลายสิ่ง':'This is near the speaker; that is near the listener; that over there is away from both. These and those refer to more than one.'):role==='determiner'?ownerThai(owner):object.thai
  return <EducationFrame id={`${id}-explanation`} selected={value} category={role==='question'?(th?'คำถาม':'Question'):role==='be'?(th?'คำกริยา':'Verb'):role==='reference'?(th?'คำชี้เฉพาะ':'Reference'):role==='determiner'?(th?'คำกำหนดนาม':'Determiner'):(th?'สิ่งของ':'Object')} colour={slot===0?'#df2944':slot===1?'#128247':'#ffd43b'} ink={slot>=2?'#18385e':'#fff'} icon={languageRoleIcon(unit,sentence.construction,object.word)} gloss={unit.thai} onBack={()=>explain(null)}>
   <section className="cw-reference-word"><EducationSectionHeading icon="usage">{th?'การใช้คำนี้':'How it works'}</EducationSectionHeading><p>{meaning}</p></section>
   <PronunciationComparison word={value}/>
   {choicesFor(role).length>1&&settings.explanationSelection!==false&&<section className="cw-vocabulary-section"><EducationSectionHeading icon="words">{th?'เลือกคำ':'Choose a word'}</EducationSectionHeading><WordTray id={`${id}-education-words`} active={slot} choices={choicesFor(role)} selected={valueFor(role)} canChoose={()=>true} onClose={()=>explain(null)} onChoose={value=>{choose(role as ChoiceRole,value);explain(null)}} renderIcon={value=>iconFor(role,value)}/></section>}
  </EducationFrame>
 }
 return <section ref={board} className="cw-pattern-stage" onKeyDown={event=>{if(event.key==='Escape'&&active){event.stopPropagation();close()}}}>
  {settings.patternNavigation!==false&&<PatternNavigation label="Question and answer" pattern={mode} onChange={value=>{setMode(value);setActive(null);setError(false)}}/>}
  <section className="cw-sentence-board identification-matrix" aria-label={settings.fadeMode?'Listen to the sentence':sentence.english}>
   <audio ref={player} preload="none" onError={()=>setError(true)}/>
   <div className="cw-sentence-display">
    <ExampleLanguage matrix {...sentence} semanticSlots={slots} settings={settings} scores={wordScores} layout={quadrantLayout(sentence)}
     unitActions={settings.explanations===false?undefined:sentence.units.map((unit,index)=>({index,label:`Slot ${index+1}: ${unit.english.replace(/[?.]$/,'')}`,expanded:false,controls:`${id}-explanation`,onClick:()=>explain(index)}))}
     slotDetails={sentence.units.map(unit=>({label:unit.role,count:choicesFor(unit.role).length||1,icon:languageRoleIcon(unit,sentence.construction,object.word),control:settings.wordPicker===false||choicesFor(unit.role).length<2?undefined:<MatrixPicker role={unit.role} slot={unit.role==='reference'?3:undefined} label={unit.role==='reference'?'Change this / that / that over there / these / those':`Change ${unit.role}`} expanded={active===unit.role} controls={`${id}-words`} onClick={()=>setActive(active===unit.role?null:unit.role as ChoiceRole)}/>}))}
     translationControl={settings.audio===false?undefined:<button className="cw-sound" aria-label={mode==='question'?'Listen to the question':'Listen to the answer'} onClick={()=>void play()}><Icon name="sound"/></button>}
     afterUnits={<WordTray id={`${id}-words`} active={active===null?null:active==='determiner'?2:3} choices={active?choicesFor(active):[]} selected={active?valueFor(active):''} vocabulary={active==='object'?objects:undefined} canChoose={()=>true} onClose={close} onChoose={value=>{if(active)choose(active,value);close()}} renderIcon={value=>active?iconFor(active,value):null}/>}/>
   </div>
   {error&&<button role="alert" onClick={()=>void play()}>🔊 Retry audio</button>}
  </section>
 </section>
}
