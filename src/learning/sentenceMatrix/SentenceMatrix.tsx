import VocabularyPicture from '../VocabularyPicture'
import { t } from '../../classroom/language'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import WordExplanation, { type Determiner } from './MatrixExplanation'
import ExampleLanguage from '../ExampleLanguage'
import Icon from '../../ui/Icon'
import WordSlotIcon from './WordSlotIcon'
import { determiners, type MatrixLesson, type MatrixSettings } from './model'
import { useLocationMatrix } from './useLocationMatrix'
import '../../classroom/sentenceLine.css'

export type SentenceMatrixProps = { lesson: MatrixLesson; settings?: MatrixSettings; word?:string; onWord?:(word:string)=>void; audio?:ReactNode }
export default function SentenceMatrix(props: SentenceMatrixProps) {
  const settings = {...props.lesson.settings,...props.settings}
  const scope = JSON.stringify([props.lesson.id,props.lesson.plural,props.lesson.initialOwner,props.lesson.initialWord,props.lesson.vocabulary,settings])
  return <MatrixInstance key={scope} {...props} settings={settings}/>

}
function MatrixInstance({lesson,settings={},word:controlledWord,onWord:notify,audio}:SentenceMatrixProps) {
  const {active,setActive,item,word,owner,verb,chooseWord:onWord,chooseOwner:setOwner,chooseVerb,canChooseVerb,sentence} = useLocationMatrix(lesson,controlledWord,notify)
  const catalogue=lesson.vocabulary, pluralLesson=lesson.plural
  const open = settings.wordPicker !== false && active !== null
  const [explaining, setExplaining] = useState<number | null>(null)
  const restoreSlot = useRef<number | null>(null)
  const owners = determiners
  const recording = useRef<HTMLAudioElement>(null)
  const [audioError, setAudioError] = useState(false)
  useEffect(()=>{const player=recording.current;return()=>player?.pause()},[word,owner])
  const choices = active === 0 ? [{word:'Where',thai:'ที่ไหน'}] : active === 1 ? (pluralLesson ? [{word:'is',thai:'หนึ่งสิ่ง'}, {word:'are',thai:'หลายสิ่ง'}] : [{word:'is',thai:'อยู่ · ปัจจุบัน'}]) : active === 2 ? owners : catalogue
  useEffect(() => () => window.speechSynthesis?.cancel(), [word, owner])
  const choicesId = useId()
  const explanationId = useId()
  const board = useRef<HTMLElement>(null)
  const belt = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (active === null) return
    const selected = belt.current?.querySelector<HTMLButtonElement>('[aria-pressed=true]')
    selected?.focus({preventScroll:true})
    selected?.scrollIntoView?.({block:'nearest',inline:'center'})
  }, [active])
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
  if (settings.explanations !== false && explaining !== null) return <WordExplanation id={explanationId} key={explaining} slot={explaining} value={owner} onChange={setOwner} onBack={()=>explain(null)} word={word} thai={item.thai} onWord={onWord} catalogue={catalogue} verb={verb} onVerb={pluralLesson ? chooseVerb : undefined} allowSelection={settings.explanationSelection !== false} canChooseVerb={canChooseVerb}/>
  function closeChoices() {
    setActive(null)
    board.current?.querySelector<HTMLButtonElement>(`[data-picker-slot="${active}"]`)?.focus({preventScroll:true})
  }
  function picker(slot: number, count: number) {
    if (settings.wordPicker === false || count < 2) return undefined
    return <button type="button" className="cw-slot-picker" data-picker-slot={slot} aria-label={`Change ${slot===1 ? 'is / are' : slot===2 ? 'the / my / your' : 'vocabulary'}`} aria-expanded={active===slot} aria-controls={choicesId} onClick={()=>setActive(previous=>previous===slot ? null : slot)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
  }
  const selectedWord = active===1 ? verb : active===2 ? owner : word
  const conveyor = <div className={`cw-word-conveyor${open ? ' is-open' : ''}`} id={choicesId} hidden={!open} data-slot={active}>
    {active===3 && <button type="button" className="cw-belt-arrow" aria-label="Previous words" onClick={()=>belt.current?.scrollBy({left:-240,behavior:'smooth'})}><Icon name="back"/></button>}
    <div className="cw-word-belt" ref={belt} role="group" aria-label="Choose a word">
      {choices.map(choice=><button type="button" className="cw-word-chip" key={choice.word} aria-pressed={selectedWord===choice.word} disabled={active===1 && !canChooseVerb(choice.word as 'is'|'are')} onClick={()=>{
        if(active===1) chooseVerb(choice.word as 'is'|'are')
        if(active===2) setOwner(choice.word as Determiner)
        if(active===3) onWord(choice.word)
        closeChoices()
      }}>
        {active===1 && <WordSlotIcon slot={1} plural={choice.word==='are'}/>}
        {active===3 && <VocabularyPicture word={choice.word}/>}
        <strong lang="en">{choice.word}</strong><span lang="th">{choice.thai}</span>
      </button>)}
    </div>
    {active===3 && <button type="button" className="cw-belt-arrow" aria-label="Next words" onClick={()=>belt.current?.scrollBy({left:240,behavior:'smooth'})}><Icon name="arrow"/></button>}
    <button type="button" className="cw-belt-close" aria-label="Close word picker" onClick={closeChoices}><Icon name="close"/></button>
  </div>
  return <section ref={board} className="cw-sentence-board" data-long-word={word.length > 8 || undefined} aria-label={`Where ${verb} ${owner} ${word}?`} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.stopPropagation(); closeChoices() }
  }}>
    <audio ref={recording} preload="none"/>
    {audioError&&<p role="alert">{t('เล่นเสียงไม่ได้ ลองกดอีกครั้ง')}</p>}
    <div className="cw-sentence-display">
      <ExampleLanguage matrix groupLastTwo {...sentence} english={`Where ${verb} ${owner} **${word}?**`} slotDetails={[{label:'Question',count:1,icon:<WordSlotIcon slot={0}/>},{label:'Tense · now',count:pluralLesson ? 2 : 1,control:picker(1,pluralLesson ? 2 : 1),icon:<WordSlotIcon slot={1} plural={verb==='are'}/>},{label:'Which / whose',count:3,control:picker(2,3),icon:<WordSlotIcon slot={2}/>},{label:'Person / thing',count:catalogue.length,control:picker(3,catalogue.length),icon:<VocabularyPicture word={word}/>}]}
      afterUnits={settings.wordPicker !== false ? conveyor : undefined}
      translationControl={settings.audio === false ? undefined : lesson.audio ? <button className="cw-sound" aria-label={t('ฟังประโยค')} onClick={async()=>{if(recording.current){recording.current.src=lesson.audio!(word,owner,verb);setAudioError(false);try{await recording.current.play()}catch{setAudioError(true)}}}}><Icon name="sound"/></button> : owner === 'the' && audio ? audio : <button className="cw-sound" aria-label={t('ฟังประโยค')} onClick={() => {
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
