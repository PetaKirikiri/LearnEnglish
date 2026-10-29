import MatrixPicker from './MatrixPicker'
import { subjectModes as availableSubjectModes } from './subjectEngine'
import { type NounMode, type NounSwapperRequest } from './NounModeToggle'
import SubjectQuestionMatrix from './SubjectQuestionMatrix'
import PeopleLocationMatrix from './PeopleLocationMatrix'
import WordTray from './WordTray'
import './wordTray.css'
import VocabularyPicture from '../VocabularyPicture'
import { t } from '../../classroom/language'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import WordExplanation, { type Determiner } from './MatrixExplanation'
import ExampleLanguage from '../ExampleLanguage'
import Icon from '../../ui/Icon'
import WordSlotIcon from './WordSlotIcon'
import { isPluralVerb, type BeVerb, type MatrixLesson, type MatrixSettings } from './model'
import { useLocationMatrix } from './useLocationMatrix'
import '../../classroom/sentenceLine.css'

export type SentenceMatrixProps = { lesson: MatrixLesson; settings?: MatrixSettings; wordScores?:import('../wordProgress/model').WordScores; word?:string; onWord?:(word:string)=>void; audio?:ReactNode }
export default function SentenceMatrix(props: SentenceMatrixProps) {
  const configured = {...props.lesson.settings,...props.settings}
  const settings = configured.fadeMode ? {...configured,explanations:false,wordPicker:false,explanationSelection:false} : configured
  const scope = JSON.stringify([props.lesson.id,props.lesson.pattern,props.lesson.subjectModes,props.lesson.plural,props.lesson.initialOwner,props.lesson.past,props.lesson.owners,props.lesson.initialTense,props.lesson.initialWord,props.lesson.vocabulary,settings])
  if(props.lesson.pattern==='people-location') return <PeopleLocationMatrix key={scope} {...props} settings={settings}/>
  return <LocationSentenceMatrix key={scope} {...props} settings={settings}/>

}
export function LocationSentenceMatrix({lesson,settings={},word:controlledWord,onWord:notify,audio,wordScores}:SentenceMatrixProps) {
  const {catalogue,active,setActive,item,word,owner,verb,chooseWord:onWord,chooseOwner:setOwner,chooseVerb,canChooseVerb,sentence,owners,verbs,tense} = useLocationMatrix(lesson,controlledWord,notify)
  const subjectModes=lesson.subjectModes
  const [nounMode,setNounMode]=useState<NounMode>('noun')
  const nounSwapper:NounSwapperRequest={modes:subjectModes?availableSubjectModes(subjectModes):['noun'],mode:nounMode,onChange:mode=>{setActive(null);setNounMode(mode)}}
  const audioSource=lesson.audio?.(word,owner,verb)
  const open = settings.wordPicker !== false && active !== null
  const [explaining, setExplaining] = useState<number | null>(null)
  const restoreSlot = useRef<number | null>(null)
  const recording = useRef<HTMLAudioElement>(null)
  const [audioError, setAudioError] = useState(false)
  useEffect(()=>{const player=recording.current;return()=>player?.pause()},[word,owner,verb])
  const choices = active === 0 ? [{word:'Where',thai:'ที่ไหน'}] : active === 1 ? verbs : active === 2 ? owners : catalogue
  useEffect(() => () => window.speechSynthesis?.cancel(), [word, owner,verb])
  const choicesId = useId()
  const explanationId = useId()
  const board = useRef<HTMLElement>(null)
  const motion = useRef<ViewTransition | null>(null)
  function explain(slot: number | null) {
    motion.current?.skipTransition()
    const selectedSlot = slot ?? explaining
    if (slot === null) restoreSlot.current = explaining
    const mark = () => {
      const source = board.current?.querySelector<HTMLElement>(`.slot-${selectedSlot}.example-unit-trigger`)
      const target = document.getElementById(explanationId)?.querySelector<HTMLElement>('.cw-simple-word-title')
      const icon = (source ?? target)?.querySelector<HTMLElement>('.cw-game-icon')
      const word = (source ?? target)?.querySelector<HTMLElement>(source ? '.example-source' : 'h1')
      if (icon) icon.style.viewTransitionName = 'classroom-word-icon'
      if (word) word.style.viewTransitionName = 'classroom-word-label'
    }
    const update = () => {
      flushSync(() => { setActive(null); setExplaining(slot) })
      mark()
    }
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      mark()
      document.documentElement.dataset.wordMotion = slot === null ? 'back' : 'open'
      const transition = document.startViewTransition(update)
      motion.current = transition
      void transition.finished.finally(() => {
        if (motion.current !== transition) return
        motion.current = null
        delete document.documentElement.dataset.wordMotion
        document.querySelectorAll<HTMLElement>('[style*="view-transition-name"]').forEach(element => {
          if (element.style.viewTransitionName.startsWith('classroom-word-')) element.style.removeProperty('view-transition-name')
        })
      })
    } else update()
  }
  useEffect(() => {
    if (explaining === null && restoreSlot.current !== null) {
      board.current?.querySelector<HTMLButtonElement>(`.slot-${restoreSlot.current}.example-unit-trigger`)?.focus({preventScroll:true})
      restoreSlot.current = null
    }
  }, [explaining])
  if(subjectModes&&nounMode!=='noun')return <SubjectQuestionMatrix config={subjectModes} initialVerb={verb==='is'||verb==='are'?verb:undefined} mode={nounMode} swapper={nounSwapper} settings={settings}/>
  if (settings.explanations !== false && explaining !== null) return <WordExplanation id={explanationId} key={explaining} slot={explaining} value={owner} onChange={setOwner} onBack={()=>explain(null)} word={word} thai={item.thai} onWord={onWord} catalogue={catalogue} verb={verb} onVerb={verbs.length>1 ? chooseVerb : undefined} verbs={verbs} owners={owners} allowSelection={settings.explanationSelection !== false} canChooseVerb={canChooseVerb}/>
  function closeChoices() {
    setActive(null)
    board.current?.querySelector<HTMLButtonElement>(`[data-picker-slot="${active}"]`)?.focus({preventScroll:true})
  }
  function picker(slot: number, count: number) {
    if (settings.wordPicker === false || count < 2) return undefined
    return <MatrixPicker slot={slot} label={`Change ${slot===1 ? verbs.map(item=>item.word).join(' / ') : slot===2 ? owners.map(item=>item.word).join(' / ') : 'vocabulary'}`} expanded={active===slot} controls={choicesId} onClick={()=>setActive(previous=>previous===slot ? null : slot)}/>
  }
  const selectedWord = active===1 ? verb : active===2 ? owner : word
  const conveyor = <WordTray vocabulary={active===3?catalogue:undefined} id={choicesId} active={open ? active : null} choices={choices} selected={selectedWord} canChoose={value=>active!==1 || canChooseVerb(value as BeVerb)} onClose={closeChoices} onChoose={value=>{
    if(active===1) chooseVerb(value as BeVerb)
    if(active===2) setOwner(value as Determiner)
    if(active===3) onWord(value)
    closeChoices()
  }}/>
  return <section ref={board} className="cw-sentence-board" data-long-word={word.length > 8 || undefined} aria-label={settings.fadeMode?"Listen to the sentence":`Where ${verb} ${owner} ${word}?`} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.stopPropagation(); closeChoices() }
  }}>
    <audio ref={recording} preload="none"/>
    {audioError&&<p role="alert">{t('เล่นเสียงไม่ได้ ลองกดอีกครั้ง')}</p>}
    <div className="cw-sentence-display">
      <ExampleLanguage settings={settings} scores={wordScores} matrix layout={{construction:'question',noun:'phrase',nounSwapper}} {...sentence} english={`Where ${verb} ${owner} **${word}?**`} slotDetails={[{label:'Question',count:1,icon:<WordSlotIcon slot={0}/>},{label:tense==='past'?'Tense · before':'Tense · now',count:verbs.length,control:picker(1,verbs.length),icon:<WordSlotIcon slot={1} plural={isPluralVerb(verb)} past={tense==='past'}/>},{label:'Which / whose',count:owners.length,control:picker(2,owners.length),icon:<WordSlotIcon slot={2}/>},{label:'Person / thing',count:catalogue.length,control:picker(3,catalogue.length),icon:<VocabularyPicture word={word}/>}]}
      afterUnits={settings.wordPicker !== false ? conveyor : undefined}
      translationControl={settings.audio === false ? undefined : audioSource ? <button className="cw-sound" aria-label={t('ฟังประโยค')} onClick={async()=>{if(recording.current){recording.current.src=audioSource;setAudioError(false);try{await recording.current.play()}catch{setAudioError(true)}}}}><Icon name="sound"/></button> : owner === 'the' && audio ? audio : <button className="cw-sound" aria-label={t('ฟังประโยค')} onClick={() => {
        window.speechSynthesis.cancel()
        const speech = new SpeechSynthesisUtterance(`Where ${verb} ${owner} ${word}?`)
        speech.lang = 'en-US'; speech.rate = .85
        window.speechSynthesis.speak(speech)
      }}><Icon name="sound"/></button>}
      unitActions={settings.explanations === false ? undefined : [
        {index:0,expanded:false,controls:explanationId,onClick:()=>explain(0),label:'Slot 1: Where'},
        {index:1,expanded:false,controls:explanationId,onClick:()=>explain(1),label:`Slot 2: ${verb}`},
        {index:2,expanded:false,controls:explanationId,onClick:()=>explain(2),label:`Slot 3: ${owner}`},
        {index:3,expanded:false,controls:explanationId,onClick:()=>explain(3),label:`Slot 4: ${word}`},
      ]}/>

    </div>

  </section>
}
