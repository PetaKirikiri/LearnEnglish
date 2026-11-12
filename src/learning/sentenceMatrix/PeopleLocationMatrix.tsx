import {lessonDeterminers,ownerThai,type Determiner,type ClassroomWord} from './model'
import {determinerAgrees} from '../sentenceRules/determiners'
import type {NominalReference} from '../sentenceRules/nominalReferences'
import {personNames,objectPronouns,namedNouns} from '../sentenceRules/nominalReferences'
import {everydayPeopleCatalogue} from '../everydayVocabulary'
import {nounBlock,type NounMode,type SubjectWord} from './subjectEngine'
import {quadrantLayout} from './LanguageQuadrant'
import {sentenceRoleSlots} from './sentenceRoles'
import AgreementPairs from './AgreementPairs'
import EducationFrame from './EducationFrame'
import PatternNavigation from './PatternNavigation'
import ProperNounIcon from './ProperNounIcon'
import PronounIcon from './PronounIcon'
import { subjectVerb } from './subjectEngine'
import MatrixPicker from './MatrixPicker'
import { useEffect, useId, useRef, useState } from 'react'
import { LocationSentenceMatrix, type SentenceMatrixProps } from './SentenceMatrix'
import { getLanguage } from '../../classroom/language'
import ExampleLanguage from './ExampleView'
import WordTray from './WordTray'
import WordSlotIcon from './WordSlotIcon'
import VocabularyPicture from '../VocabularyPicture'
import Icon from '../../ui/Icon'
import EducationSectionHeading from './EducationSectionHeading'
import PronunciationComparison from '../../classroom/pronunciation/PronunciationComparison'
import { locationWords, people, peopleAudio, locationAnswer, type Person, type PeoplePattern } from './peopleLocation'
import './peopleLocation.css'
import '../../classroom/wordExplanation.css'

type Role = 'person' | 'person-determiner' | 'verb' | 'at' | 'determiner' | 'place'
const verbs=[{word:'am',thai:'I → am'},{word:'are',thai:'you → are'},{word:'is',thai:'he / she → is'}]
/** The same matrix renderer, with role-aware layouts for a two-person exchange. */
export default function PeopleLocationMatrix({lesson,settings={},word:controlledWord,onWord,wordScores}:SentenceMatrixProps) {
  const places=locationWords(lesson.vocabulary)
  const [localWord,setLocalWord]=useState(lesson.initialWord)
  const place=places.find(item=>item.word===(controlledWord??localWord))??places[0]
  const [person,setPerson]=useState<Person>('I')
  const names=personNames(lesson.subjectModes)
  const subjectNouns=lesson.subjectNouns??everydayPeopleCatalogue
  const [subjectMode,setSubjectMode]=useState<NounMode>('pronoun')
  const [placeMode,setPlaceMode]=useState<NounMode>('noun')
  const [subjectName,setSubjectName]=useState(names[0]?.word)
  const [placeName,setPlaceName]=useState<string>()
  const [determiner,setDeterminer]=useState<Determiner>('the')
  const owners=lessonDeterminers(lesson).filter(item=>determinerAgrees(item.word,false))
  const subjectBlock=nounBlock<SubjectWord>({pronoun:people,name:names,noun:subjectNouns.map(noun=>({word:`the ${noun.word}`,thai:noun.thai,number:noun.number,kind:'person' as const,phrase:{noun:noun.word,nounThai:noun.thai,determiner:{english:'the',thai:'ที่กำลังพูดถึง'}}}))},subjectMode,subjectMode==='pronoun'?person:subjectName)
  const subject=subjectBlock.selected!
  const placeBlock=nounBlock<ClassroomWord&{reference?:NominalReference}>({noun:places,pronoun:objectPronouns(place,true),name:namedNouns(place,lesson.subjectModes)},placeMode,placeMode==='noun'?place.word:placeName)
  const destination=placeBlock.selected!
  const placeReference=destination.reference
  const [pattern,setPattern]=useState<PeoplePattern>(settings.initialPattern??'question')
  const [active,setActive]=useState<Role|null>(null)
  const [explaining,setExplaining]=useState<Role|null>(null)
  const [audioError,setAudioError]=useState(false)
  const board=useRef<HTMLElement>(null)
  const audio=useRef<HTMLAudioElement>(null)
  const restoreRole=useRef<Role|null>(null)
  const restoreLabel=useRef<string|null>(null)
  const id=useId()
  const verb=subjectVerb(subject)
  const th=getLanguage()==='th'
  const sentence=locationAnswer(subject,place,false,placeReference,determiner)
  const roles:Role[]=sentence.units.map(unit=>unit.role==='be'?'verb':unit.role==='preposition'?'at':unit.role==='object'?'place':unit.role==='person-determiner'?'person-determiner':unit.role==='determiner'?'determiner':'person')
  const semanticSlots=sentence.units.map(unit=>sentenceRoleSlots[unit.role])
  useEffect(()=>{const player=audio.current;return()=>{player?.pause();window.speechSynthesis?.cancel()}},[sentence.english,pattern])
  useEffect(()=>{
    if(explaining===null&&restoreRole.current){
      (board.current?.querySelector<HTMLButtonElement>(`[aria-label="${restoreLabel.current}"]`) ?? board.current?.querySelector<HTMLButtonElement>(`[data-word-role="${restoreRole.current}"]`))?.focus({preventScroll:true})
      restoreRole.current=null
    }
  },[explaining])
  const choicesFor=(role:Role)=>role==='person'?subjectBlock.choices:role==='verb'?(subjectMode==='pronoun'?verbs:[]):role==='place'?placeBlock.choices:role==='determiner'&&placeMode==='noun'?owners:[]
  const valueFor=(role:Role)=>role==='person'?subject.word:role==='verb'?verb:role==='place'?destination.word:role==='determiner'?determiner:role==='person-determiner'?'the':'at'
  const iconFor=(role:Role,value=valueFor(role))=>role==='person'?(subjectMode==='name'?<ProperNounIcon word={value}/>:subjectMode==='noun'?<VocabularyPicture word={value.replace(/^the /,'')}/>:<PronounIcon word={value}/>):role==='place'?(placeMode==='pronoun'?<WordSlotIcon slot={0} word={value}/>:placeMode==='name'?<ProperNounIcon word={value}/>:<VocabularyPicture word={place.word}/>):<WordSlotIcon word={value} slot={role==='verb'?1:role.endsWith('determiner')?2:0} plural={role==='verb'&&value==='are'}/>
  function choose(role:Role,value:string) {
    if(role==='determiner'){setDeterminer(value as Determiner)}
    else if(role==='place'){if(placeMode!=='noun')setPlaceName(value);else{setLocalWord(value);onWord?.(value)}}
    else if(role==='person'&&subjectMode!=='pronoun')setSubjectName(value)
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
    return <MatrixPicker role={role} label={`Change ${role==='person'?'person':role==='verb'?'am / is / are':role==='determiner'?'determiner':'place'}`} controls={`${id}-words`} expanded={active===role} onClick={()=>setActive(active===role?null:role)}/>
  }
  const category=(role:Role)=>({'person-determiner':th?'คำกำหนดนาม':'Determiner',determiner:th?'คำกำหนดนาม':'Determiner',verb:th?'กริยาเชื่อม':'Linking verb',person:th?'คนที่พูดถึง':'Person',at:th?'สถานที่':'Location',place:th?'สถานที่':'Place'})[role]
  if(explaining&&settings.explanations!==false) {
    const selected=valueFor(explaining)
    const gloss=explaining==='person'?subject.thai:explaining==='place'?destination.thai:explaining==='determiner'?ownerThai(determiner):explaining==='at'?'ที่':'อยู่'
    return <EducationFrame id={`${id}-explanation`} selected={selected} category={category(explaining)} colour={explaining==='verb'?'#128247':'#ffd43b'} ink={explaining==='verb'?'#fff':'#18385e'} icon={iconFor(explaining)} gloss={gloss} onBack={back}>
        <section className="cw-reference-word">
          <EducationSectionHeading icon="usage">{th?'การใช้คำนี้':'How it works'}</EducationSectionHeading>
          {explaining==='verb'||explaining==='person'?<AgreementPairs pairs={subjectBlock.choices.map(item=>({person:item.word,verb:subjectVerb(item),icon:iconFor('person',item.word),selected:item.word===subject.word}))}/>:<div className="cw-place-example"><span className="cw-place-part"><WordSlotIcon slot={0}/><strong>at</strong></span><Icon name="arrow" className="cw-education-arrow"/><span className="cw-place-part">{iconFor('place')}<strong>{placeMode==='noun'?`${determiner} `:''}{destination.word}</strong></span></div>}
          {explaining==='determiner'&&determiner==='the'&&<p className="cw-people-example-meaning">{th?'the บอกว่าเป็นสถานที่ที่ผู้พูดและผู้ฟังรู้ว่าหมายถึงที่ไหน ไม่ได้บอกว่ามีหนึ่งหรือหลายแห่ง':'The identifies a place the speaker and listener can identify. It does not tell us one or many.'}</p>}
          {(explaining==='place'||explaining==='verb')&&<p className="cw-people-example-meaning">{th?'ในประโยคนี้ คำกริยาขึ้นอยู่กับคนที่พูดถึง ส่วน at the … บอกว่าอยู่ที่ไหน':'Here the person determines am, is or are. At the … tells us the location.'}</p>}
          <p className="cw-people-example-sentence" lang="en">{sentence.english}</p><p className="cw-people-example-meaning" lang="th">{sentence.thai}</p>
        </section>
        <PronunciationComparison word={selected}/>
        {settings.explanationSelection!==false&&choicesFor(explaining).length>1&&<section className="cw-vocabulary-section">
          <EducationSectionHeading icon="words">{th?'เลือกคำ':'Choose a word'}</EducationSectionHeading>
          <div className="cw-word-options" role="group" aria-label="Choose a word">{choicesFor(explaining).map(item=><button type="button" key={item.word} aria-pressed={selected===item.word} onClick={()=>choose(explaining,item.word)}>{iconFor(explaining,item.word)}<strong>{item.word}</strong><span lang="th">{item.thai}</span></button>)}</div>
        </section>}
    </EducationFrame>
  }
  return <section ref={board} className="cw-pattern-stage" data-pattern={pattern} aria-label={pattern==='question'?'Sentence patterns':settings.fadeMode?'Listen to the sentence':sentence.english} onKeyDown={e=>{if(e.key==='Escape')setActive(null)}}>
    {settings.patternNavigation!==false&&<PatternNavigation pattern={pattern} onChange={switchPattern}/>}
    {pattern==='question'?<LocationSentenceMatrix lesson={{...lesson,pattern:undefined,plural:true}} settings={settings} word={controlledWord??localWord} onWord={value=>{setLocalWord(value);onWord?.(value)}} wordScores={wordScores}/>:<section className="cw-sentence-board cw-people-board" data-pattern="answer" aria-label={settings.fadeMode?'Listen to the sentence':sentence.english}>
    <audio ref={audio} preload="none"/>
    <div key={pattern} className="cw-sentence-display">
      <ExampleLanguage matrix layout={{...quadrantLayout({...sentence,construction:'location-answer'}),
        subjectSwapper:{label:'Subject block mode',modes:subjectBlock.modes,mode:subjectMode,onChange:mode=>{setSubjectMode(mode);setActive(null)}},
        nounSwapper:{label:'Location block mode',modes:placeBlock.modes,mode:placeMode,onChange:mode=>{setPlaceMode(mode);setActive(null)}}}} semanticSlots={semanticSlots} {...sentence} settings={settings} scores={wordScores}
        slotDetails={roles.map(role=>({label:category(role),count:choicesFor(role).length||1,icon:iconFor(role),control:picker(role)}))}
        unitActions={settings.explanations===false?undefined:roles.map((role,index)=>({index,label:`Slot ${index+1}: ${valueFor(role)}`,controls:`${id}-explanation`,expanded:false,onClick:()=>{restoreLabel.current=`Slot ${index+1}: ${valueFor(role)}`;setActive(null);setExplaining(role)}}))}
        afterUnits={active&&settings.wordPicker!==false?<WordTray vocabulary={active==='place'&&placeMode==='noun'?places:undefined} key={active} id={`${id}-words`} active={roles.indexOf(active)} selected={valueFor(active)} choices={choicesFor(active)} canChoose={()=>true} onChoose={value=>choose(active,value)} onClose={()=>{setActive(null);board.current?.querySelector<HTMLButtonElement>(`[data-word-role="${active}"]`)?.focus({preventScroll:true})}} renderIcon={value=>iconFor(active,value)}/>:undefined}
        translationControl={settings.audio===false?undefined:<button type="button" className="cw-sound" aria-label="Listen to sentence" onClick={async()=>{setAudioError(false);if(subjectMode!=='pronoun'||placeMode!=='noun'||determiner!=='the'){if(window.speechSynthesis){window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(sentence.english);speech.lang='en-US';speech.rate=.85;window.speechSynthesis.speak(speech)}else setAudioError(true)}else if(audio.current){audio.current.src=peopleAudio(sentence.english);try{await audio.current.play()}catch{setAudioError(true)}}}}><Icon name="sound"/></button>}
      />
    </div>
    {audioError&&<p role="alert">{th?'เล่นเสียงไม่ได้ ลองอีกครั้ง':'Could not play audio. Try again.'}</p>}
    </section>}
  </section>
}
