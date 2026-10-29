import ProperNounIcon from './ProperNounIcon'
import PronounIcon from './PronounIcon'
import { subjectVerb } from './subjectEngine'
import MatrixPicker from './MatrixPicker'
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { LocationSentenceMatrix, type SentenceMatrixProps } from './SentenceMatrix'
import { getLanguage } from '../../classroom/language'
import ExampleLanguage from './ExampleView'
import WordTray from './WordTray'
import WordSlotIcon from './WordSlotIcon'
import VocabularyPicture from '../VocabularyPicture'
import Icon from '../../ui/Icon'
import EducationSectionHeading from './EducationSectionHeading'
import PronunciationComparison from '../../classroom/pronunciation/PronunciationComparison'
import { locationWords, people, peopleAudio, locationAnswer, personDetail, type Person, type PeoplePattern } from './peopleLocation'
import './wordTray.css'
import './peopleLocation.css'
import '../../classroom/wordExplanation.css'

type Role = 'person' | 'verb' | 'at' | 'determiner' | 'place'
const verbs=[{word:'am',thai:'I → am'},{word:'are',thai:'you → are'},{word:'is',thai:'he / she → is'}]
/** The same matrix renderer, with role-aware layouts for a two-person exchange. */
export default function PeopleLocationMatrix({lesson,settings={},word:controlledWord,onWord,wordScores}:SentenceMatrixProps) {
  const places=locationWords(lesson.vocabulary)
  const [localWord,setLocalWord]=useState(lesson.initialWord)
  const place=places.find(item=>item.word===(controlledWord??localWord))??places[0]
  const [person,setPerson]=useState<Person>('I')
  const personNames=lesson.subjectModes?.names.filter(item=>item.kind==='person')??[]
  const placeNames=lesson.subjectModes?.names.filter(item=>item.kind==='place')??[]
  const [subjectMode,setSubjectMode]=useState<'pronoun'|'name'>('pronoun')
  const [placeMode,setPlaceMode]=useState<'noun'|'name'>('noun')
  const [subjectName,setSubjectName]=useState(personNames[0]?.word)
  const [placeName,setPlaceName]=useState(placeNames[0]?.word)
  const subject=subjectMode==='name'?(personNames.find(item=>item.word===subjectName)??personNames[0]):personDetail(person)
  const destination=placeMode==='name'?(placeNames.find(item=>item.word===placeName)??placeNames[0]):place
  const [pattern,setPattern]=useState<PeoplePattern>('question')
  const [active,setActive]=useState<Role|null>(null)
  const [explaining,setExplaining]=useState<Role|null>(null)
  const [audioError,setAudioError]=useState(false)
  const board=useRef<HTMLElement>(null)
  const audio=useRef<HTMLAudioElement>(null)
  const restoreRole=useRef<Role|null>(null)
  const restoreLabel=useRef<string|null>(null)
  const touchX=useRef<number|null>(null)
  const id=useId()
  const verb=subjectVerb(subject)
  const th=getLanguage()==='th'
  const sentence=locationAnswer(subject,destination,placeMode==='name')
  const roles:Role[]=['person','verb','at',...(placeMode==='noun'?['determiner' as const]:[]),'place']
  const semanticSlots=roles.map(role=>role==='person'||role==='place'?3:role==='verb'?1:role==='at'?0:2)
  useEffect(()=>{const player=audio.current;return()=>{player?.pause();window.speechSynthesis?.cancel()}},[sentence.english,pattern])
  useEffect(()=>{
    if(explaining===null&&restoreRole.current){
      (board.current?.querySelector<HTMLButtonElement>(`[aria-label="${restoreLabel.current}"]`) ?? board.current?.querySelector<HTMLButtonElement>(`[data-word-role="${restoreRole.current}"]`))?.focus({preventScroll:true})
      restoreRole.current=null
    }
  },[explaining])
  const choicesFor=(role:Role)=>role==='person'?(subjectMode==='name'?personNames:people):role==='verb'?(subjectMode==='name'?[]:verbs):role==='place'?(placeMode==='name'?placeNames:places):[]
  const valueFor=(role:Role)=>role==='person'?subject.word:role==='verb'?verb:role==='place'?destination.word:role==='determiner'?'the':'at'
  const iconFor=(role:Role,value=valueFor(role))=>role==='person'?(subjectMode==='name'?<ProperNounIcon word={value}/>:<PronounIcon word={value}/>):role==='place'?(placeMode==='name'?<ProperNounIcon word={value}/>:<VocabularyPicture word={value}/>):<WordSlotIcon slot={role==='verb'?1:role==='determiner'?2:0} plural={role==='verb'&&value==='are'}/>
  function choose(role:Role,value:string) {
    if(role==='place'){if(placeMode==='name')setPlaceName(value);else{setLocalWord(value);onWord?.(value)}}
    else if(role==='person'&&subjectMode==='name')setSubjectName(value)
    else {
      const next=role==='person'?value as Person:value==='am'?'I':value==='are'?'you':person==='she'?'she':'he'
      setPerson(next)
    }
    setActive(null)
    if(explaining){restoreRole.current=explaining;setExplaining(null)}
  }
  function switchPattern(next:PeoplePattern) {setActive(null);setExplaining(null);setPattern(next);setAudioError(false)}
  function back() {restoreRole.current=explaining;setExplaining(null)}
  function picker(role:Role) {
    if(settings.wordPicker===false||choicesFor(role).length<2)return undefined
    return <MatrixPicker role={role} label={`Change ${role==='person'?'person':role==='verb'?'am / is / are':'place'}`} controls={`${id}-words`} expanded={active===role} onClick={()=>setActive(active===role?null:role)}/>
  }
  const category=(role:Role)=>({determiner:th?'คำกำหนดนาม':'Determiner',verb:th?'คำกริยา':'Verb · be',person:th?'คนที่พูดถึง':'Person',at:th?'สถานที่':'Location',place:th?'สถานที่':'Place'})[role]
  if(explaining&&settings.explanations!==false) {
    const selected=valueFor(explaining)
    const gloss=explaining==='person'?subject.thai:explaining==='place'?destination.thai:explaining==='determiner'?'ที่รู้กันว่าหมายถึงที่ไหน':explaining==='at'?'ที่':'อยู่'
    return <section id={`${id}-explanation`} className="cw-word-explanation cw-people-explanation" style={{'--word-colour':explaining==='verb'?'#128247':'#ffd43b','--word-ink':explaining==='verb'?'#fff':'#18385e'} as CSSProperties} onKeyDown={e=>{if(e.key==='Escape')back()}}>
      <header className="cw-word-heading">
        <button type="button" autoFocus className="cw-word-return" onClick={back} aria-label="Back to sentence"><Icon name="back"/></button>
        <div className="cw-simple-word-title">{iconFor(explaining)}<div><span className="cw-word-category">{category(explaining)}</span><h1>{selected}</h1><p lang="th">{gloss}</p></div></div>
      </header>
      <div className="cw-word-body"><article className="cw-reference-sheet">
        <section className="cw-reference-word">
          <EducationSectionHeading icon="usage">{th?'การใช้คำนี้':'How it works'}</EducationSectionHeading>
          {explaining==='verb'||explaining==='person'?<div className="cw-person-pairs" aria-label="Person and verb pairs">{(subjectMode==='name'?personNames:people).map(item=><div key={item.word} data-selected={item.word===subject.word}>{iconFor('person',item.word)}<strong>{item.word}</strong><Icon name="arrow" className="cw-education-arrow"/><b>{subjectVerb(item)}</b></div>)}</div>:<div className="cw-place-example"><span className="cw-place-part"><WordSlotIcon slot={0}/><strong>at</strong></span><Icon name="arrow" className="cw-education-arrow"/><span className="cw-place-part">{iconFor('place')}<strong>{placeMode==='noun'?'the ':''}{destination.word}</strong></span></div>}
          {explaining==='determiner'&&<p className="cw-people-example-meaning">{th?'the บอกว่าเป็นสถานที่ที่ผู้พูดและผู้ฟังรู้ว่าหมายถึงที่ไหน ไม่ได้บอกว่ามีหนึ่งหรือหลายแห่ง':'The identifies a place the speaker and listener can identify. It does not tell us one or many.'}</p>}
          {(explaining==='place'||explaining==='verb')&&<p className="cw-people-example-meaning">{th?'ในประโยคนี้ คำกริยาขึ้นอยู่กับคนที่พูดถึง ส่วน at the … บอกว่าอยู่ที่ไหน':'Here the person determines am, is or are. At the … tells us the location.'}</p>}
          <p className="cw-people-example-sentence" lang="en">{sentence.english}</p><p className="cw-people-example-meaning" lang="th">{sentence.thai}</p>
        </section>
        <PronunciationComparison word={selected}/>
        {settings.explanationSelection!==false&&choicesFor(explaining).length>1&&<section className="cw-vocabulary-section">
          <EducationSectionHeading icon="words">{th?'เลือกคำ':'Choose a word'}</EducationSectionHeading>
          <div className="cw-word-options" role="group" aria-label="Choose a word">{choicesFor(explaining).map(item=><button type="button" key={item.word} aria-pressed={selected===item.word} onClick={()=>choose(explaining,item.word)}>{iconFor(explaining,item.word)}<strong>{item.word}</strong><span lang="th">{item.thai}</span></button>)}</div>
        </section>}
      </article></div>
    </section>
  }
  return <section ref={board} className="cw-pattern-stage" data-pattern={pattern} aria-label={pattern==='question'?'Sentence patterns':settings.fadeMode?'Listen to the sentence':sentence.english} onKeyDown={e=>{if(e.key==='Escape')setActive(null)}}>
    <nav className="cw-pattern-carousel" aria-label="Sentence patterns" onTouchStart={e=>{touchX.current=e.touches[0].clientX}} onTouchEnd={e=>{
      if(touchX.current!==null){const delta=e.changedTouches[0].clientX-touchX.current;if(Math.abs(delta)>45)switchPattern(delta<0?'answer':'question')};touchX.current=null
    }}>
      <button type="button" className="cw-pattern-arrow" aria-label="Previous pattern" disabled={pattern==='question'} onClick={()=>switchPattern('question')}><Icon name="back"/></button>
      <div className="cw-pattern-tabs">{(['question','answer'] as const).map(mode=><button type="button" key={mode} aria-pressed={pattern===mode} onClick={()=>switchPattern(mode)}><span aria-hidden="true">{mode==='question'?'?':'↳'}</span>{mode==='question'?(th?'ถาม':'Ask'):(th?'ตอบ':'Answer')}</button>)}</div>
      <button type="button" className="cw-pattern-arrow" aria-label="Next pattern" disabled={pattern==='answer'} onClick={()=>switchPattern('answer')}><Icon name="arrow"/></button>
    </nav>
    {pattern==='question'?<LocationSentenceMatrix lesson={{...lesson,pattern:undefined,plural:true}} settings={settings} word={controlledWord??localWord} onWord={value=>{setLocalWord(value);onWord?.(value)}} wordScores={wordScores}/>:<section className="cw-sentence-board cw-people-board" data-pattern="answer" aria-label={settings.fadeMode?'Listen to the sentence':sentence.english}>
    <audio ref={audio} preload="none"/>
    <div key={pattern} className="cw-sentence-display">
      <ExampleLanguage matrix layout={{construction:'location-answer',subjectVerbConnection:'warm',noun:placeMode==='noun'?'phrase':'single',
        subjectSwapper:personNames.length?{label:'Subject block mode',modes:['pronoun','name'],mode:subjectMode,onChange:mode=>{if(mode!=='noun'){setSubjectMode(mode);setActive(null)}}}:undefined,
        nounSwapper:placeNames.length?{label:'Location block mode',modes:['noun','name'],mode:placeMode,onChange:mode=>{if(mode!=='pronoun'){setPlaceMode(mode);setActive(null)}}}:undefined}} semanticSlots={semanticSlots} {...sentence} settings={settings} scores={wordScores}
        slotDetails={roles.map(role=>({label:category(role),count:choicesFor(role).length||1,icon:iconFor(role),control:picker(role)}))}
        unitActions={settings.explanations===false?undefined:roles.map((role,index)=>({index,label:`Slot ${index+1}: ${valueFor(role)}`,controls:`${id}-explanation`,expanded:false,onClick:()=>{restoreLabel.current=`Slot ${index+1}: ${valueFor(role)}`;setActive(null);setExplaining(role)}}))}
        afterUnits={active&&settings.wordPicker!==false?<WordTray vocabulary={active==='place'&&placeMode==='noun'?places:undefined} key={active} id={`${id}-words`} active={roles.indexOf(active)} selected={valueFor(active)} choices={choicesFor(active)} canChoose={()=>true} onChoose={value=>choose(active,value)} onClose={()=>{setActive(null);board.current?.querySelector<HTMLButtonElement>(`[data-word-role="${active}"]`)?.focus({preventScroll:true})}} renderIcon={value=>iconFor(active,value)}/>:undefined}
        translationControl={settings.audio===false?undefined:<button type="button" className="cw-sound" aria-label="Listen to sentence" onClick={async()=>{setAudioError(false);if(subjectMode==='name'||placeMode==='name'){if(window.speechSynthesis){window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(sentence.english);speech.lang='en-US';speech.rate=.85;window.speechSynthesis.speak(speech)}else setAudioError(true)}else if(audio.current){audio.current.src=peopleAudio(sentence.english);try{await audio.current.play()}catch{setAudioError(true)}}}}><Icon name="sound"/></button>}
      />
    </div>
    {audioError&&<p role="alert">{th?'เล่นเสียงไม่ได้ ลองอีกครั้ง':'Could not play audio. Try again.'}</p>}
    </section>}
  </section>
}
