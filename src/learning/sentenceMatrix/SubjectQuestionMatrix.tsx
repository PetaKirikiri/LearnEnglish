import {quadrantLayout} from './LanguageQuadrant'
import {sentenceRoleSlots} from './sentenceRoles'
import VocabularyPicture from '../VocabularyPicture'
import AgreementPairs from './AgreementPairs'
import ProperNounIcon from './ProperNounIcon'
import PronounIcon from './PronounIcon'
import MatrixPicker from './MatrixPicker'
import { useEffect, useId, useRef, useState } from 'react'
import ExampleLanguage from './ExampleView'
import WordSlotIcon from './WordSlotIcon'
import WordTray from './WordTray'
import { type NounMode, type NounSwapperRequest } from './NounModeToggle'
import { subjectChoices, subjectQuestion, subjectVerb, subjectForVerb, subjectVerbChoices, type SubjectModeConfig } from './subjectEngine'
import type { MatrixSettings } from './model'
import type { WordScores } from '../wordProgress/model'
import PronunciationComparison from '../../classroom/pronunciation/PronunciationComparison'
import EducationSectionHeading from './EducationSectionHeading'
import Icon from '../../ui/Icon'
import { getLanguage } from '../../classroom/language'
export default function SubjectQuestionMatrix({config,initialVerb,mode,swapper,settings,scores}:{scores?:WordScores;config:SubjectModeConfig;initialVerb?:'am'|'is'|'are';mode:Exclude<NounMode,'noun'>;swapper:NounSwapperRequest;settings:MatrixSettings}) {
 const [pronoun,setPronoun]=useState(()=>initialVerb ? subjectForVerb(config.pronouns,initialVerb,config.initialPronoun)?.word ?? config.initialPronoun : config.initialPronoun),[name,setName]=useState(config.initialName)
 const [open,setOpen]=useState<false|'subject'|'verb'>(false),[explaining,setExplaining]=useState<number|null>(null),[audioError,setAudioError]=useState(false)
 const choices=subjectChoices(config,mode)
 const {item,verb,english,thai,units}=subjectQuestion(config,mode,mode==='pronoun'?pronoun:name)
 const verbs=subjectVerbChoices(choices)
 const audioSource=config.audio?.(english,mode)
 const id=useId(),audio=useRef<HTMLAudioElement>(null),picker=useRef<HTMLButtonElement>(null),verbPicker=useRef<HTMLButtonElement>(null)
 const th=getLanguage()==='th'
 useEffect(()=>{const player=audio.current;return()=>{player?.pause();window.speechSynthesis?.cancel()}},[english])
 const unitLabel=(role:string)=>role==='question'?'Question':role==='be'?'Linking verb':role==='determiner'?'Determiner':'Subject'
 const subjectIconFor=(word:string)=>mode==='pronoun'?<PronounIcon word={word}/>:<ProperNounIcon word={word}/>
 const subjectIcon=subjectIconFor(item.word)
 const icons=units.map(unit=>unit.role==='question'?<WordSlotIcon slot={0}/>:unit.role==='be'?<WordSlotIcon slot={1} plural={verb==='are'}/>:unit.role==='determiner'?<WordSlotIcon slot={2} word={unit.english}/>:unit.role==='object'?<VocabularyPicture word={unit.english.replace(/\?$/,'')}/>:subjectIcon)
 function chooseVerb(value:string){const next=subjectForVerb(choices,value as 'am'|'is'|'are',item.word);if(next)choose(next.word)}
 function choose(value:string){if(mode==='pronoun')setPronoun(value);else setName(value);setOpen(false);setExplaining(null);(open==='verb'?verbPicker:picker).current?.focus({preventScroll:true})}
 if(explaining!==null&&settings.explanations!==false){
  const word=units[explaining].english.replace('?','')
  return <section className="cw-word-explanation" id={`${id}-explanation`}>
   <header className="cw-word-heading"><button type="button" className="cw-word-return" aria-label="Back to sentence" onClick={()=>setExplaining(null)}><Icon name="back"/></button><div className="cw-simple-word-title">{icons[explaining]}<div><span className="cw-word-category">{explaining===0?(th?'คำถาม':'Question'):explaining===1?(th?'กริยาเชื่อม':'Linking verb'):mode==='pronoun'?(th?'คำสรรพนาม':'Pronoun'):(th?'ชื่อเฉพาะ':'Proper noun')}</span><h1>{word}</h1><p>{units[explaining].thai}</p></div></div></header>
   <div className="cw-word-body"><article className="cw-reference-sheet"><section><EducationSectionHeading icon="usage">{th?'การใช้คำนี้':'How it works'}</EducationSectionHeading>
    <p>{mode==='pronoun'?(th?'ใช้คำสรรพนามแทนคนที่พูดถึง รูปคำกริยาเปลี่ยนตามคำสรรพนาม':'A pronoun stands for the person or thing being discussed. The verb agrees with that pronoun.'):(th?'ชื่อเฉพาะเหล่านี้วางหลังคำกริยาได้โดยตรง โดยไม่เติม the':'A proper noun names a specific person or place directly.')}</p><AgreementPairs question pairs={choices.map(choice=>({person:choice.word,verb:subjectVerb(choice),icon:subjectIconFor(choice.word),selected:choice.word===item.word}))}/>
    <p className="cw-people-example-sentence">{english}</p><p className="cw-people-example-meaning" lang="th">{thai}</p>
   </section><PronunciationComparison word={word}/>
   {explaining===units.length-1&&settings.explanationSelection!==false&&<section><EducationSectionHeading icon="words">{th?'เลือกคำ':'Choose a word'}</EducationSectionHeading><div className="cw-word-options">{choices.map(choice=><button key={choice.word} type="button" aria-pressed={choice.word===item.word} onClick={()=>choose(choice.word)}>{subjectIconFor(choice.word)}<strong>{choice.word}</strong><span>{choice.thai}</span></button>)}</div></section>}
   </article></div>
  </section>
 }
 return <section className="cw-sentence-board cw-named-subject" aria-label={settings.fadeMode?'Listen to the sentence':english} onKeyDown={e=>{if(e.key==='Escape')setOpen(false)}}>
  <audio ref={audio}/><div className="cw-sentence-display"><ExampleLanguage matrix layout={{...quadrantLayout({english,thai,units,construction:'question'}),nounSwapper:swapper}} semanticSlots={units.map(unit=>sentenceRoleSlots[unit.role])} english={english} thai={thai} units={units} settings={settings} scores={scores}
   slotDetails={units.map((_,index)=>({label:unitLabel(units[index].role),count:index===units.length-1?choices.length:index===1?verbs.length:1,icon:icons[index],control:settings.wordPicker!==false&&index===1&&verbs.length>1?<MatrixPicker buttonRef={verbPicker} label={`Change ${verbs.map(v=>v.word).join(' / ')}`} expanded={open==='verb'} controls={`${id}-words`} onClick={()=>setOpen(open==='verb'?false:'verb')}/>:index===units.length-1&&settings.wordPicker!==false?<MatrixPicker buttonRef={picker} label={mode==='pronoun'?'Change pronoun':'Change proper noun'} expanded={open==='subject'} controls={`${id}-words`} onClick={()=>setOpen(open==='subject'?false:'subject')}/>:undefined}))}
   unitActions={settings.explanations===false?undefined:units.map((unit,index)=>({index,label:`Explain ${unit.english.replace('?','')}`,expanded:false,controls:`${id}-explanation`,onClick:()=>{setOpen(false);setExplaining(index)}}))}
   afterUnits={settings.wordPicker===false?undefined:<WordTray id={`${id}-words`} active={open?(open==='verb'?1:3):null} choices={open==='verb'?verbs:choices} selected={open==='verb'?verb:item.word} canChoose={()=>true} onChoose={open==='verb'?chooseVerb:choose} onClose={()=>{setOpen(false);(open==='verb'?verbPicker:picker).current?.focus({preventScroll:true})}} renderIcon={open==='verb'?value=><WordSlotIcon slot={1} plural={value==='are'}/>:subjectIconFor}/>}
   translationControl={settings.audio===false?undefined:<button type="button" className="cw-sound" aria-label="Listen to sentence" onClick={async()=>{setAudioError(false);if(audioSource&&audio.current){audio.current.src=audioSource;try{await audio.current.play()}catch{setAudioError(true)}}else if(window.speechSynthesis){window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(english);speech.lang='en-US';speech.rate=.85;window.speechSynthesis.speak(speech)}else setAudioError(true)}}><Icon name="sound"/></button>}
  /></div>{audioError&&<p role="alert">{th?'เล่นเสียงไม่ได้ ลองอีกครั้ง':'Could not play audio. Try again.'}</p>}
 </section>
}
