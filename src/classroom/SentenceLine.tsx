import VocabularyPicture from '../learning/VocabularyPicture'
import { t } from './language'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import WordExplanation, { type Determiner } from './WordExplanation'
import ExampleLanguage from '../learning/ExampleLanguage'
import Icon from '../ui/Icon'
import WordSlotIcon from './WordSlotIcon'
import { lessonOneCatalogue, verbForWord, formForVerb, type ClassroomWord } from './wordCatalogue'
import { lessonTwoAudio } from '../race/lessonTwoQuestions'
import './sentenceLine.css'

export default function SentenceLine({ word, onWord, audio, catalogue = lessonOneCatalogue, pluralLesson = false }: { word: string; onWord: (word: string) => void; audio: ReactNode; catalogue?: readonly ClassroomWord[]; pluralLesson?:boolean }) {
  const [active, setActive] = useState<number | null>(null)
  const open = active !== null
  const [owner, setOwner] = useState<Determiner>('the')
  const [explaining, setExplaining] = useState<number | null>(null)
  const restoreSlot = useRef<number | null>(null)
  const owners = [{word:'the',thai:'ที่กำลังพูดถึง'}, {word:'my',thai:'ของฉัน'}, {word:'your',thai:'ของคุณ'}]
  const ownerThai = owners.find(item => item.word === owner)!.thai
  const item = catalogue.find(item => item.word === word)!
  const verb = verbForWord(item)
  const recording = useRef<HTMLAudioElement>(null)
  const [audioError, setAudioError] = useState(false)
  useEffect(()=>{const player=recording.current;return()=>player?.pause()},[word,owner])
  const choices = active === 0 ? [{word:'Where',thai:'ที่ไหน'}] : active === 1 ? (pluralLesson ? [{word:'is',thai:'หนึ่งสิ่ง'}, {word:'are',thai:'หลายสิ่ง'}] : [{word:'is',thai:'อยู่ · ปัจจุบัน'}]) : active === 2 ? owners : catalogue
  useEffect(() => () => window.speechSynthesis?.cancel(), [word, owner])
  const choicesId = useId()
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
      const target = document.querySelector<HTMLElement>('#word-explanation .cw-simple-word-title')
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
  if (explaining !== null) return <WordExplanation key={explaining} slot={explaining} value={owner} onChange={setOwner} onBack={()=>explain(null)} word={word} thai={item.thai} onWord={onWord} catalogue={catalogue} verb={verb} onVerb={pluralLesson ? next=>onWord(formForVerb(item,next)) : undefined}/>
  function closeChoices() {
    setActive(null)
    board.current?.querySelector<HTMLButtonElement>(`[data-picker-slot="${active}"]`)?.focus({preventScroll:true})
  }
  function picker(slot: number, count: number) {
    if (count < 2) return undefined
    return <button type="button" className="cw-slot-picker" data-picker-slot={slot} aria-label={`Change ${slot===1 ? 'is / are' : slot===2 ? 'the / my / your' : 'vocabulary'}`} aria-expanded={active===slot} aria-controls={choicesId} onClick={()=>setActive(previous=>previous===slot ? null : slot)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
  }
  const selectedWord = active===1 ? verb : active===2 ? owner : word
  const conveyor = <div className={`cw-word-conveyor${open ? ' is-open' : ''}`} id={choicesId} hidden={!open} data-slot={active}>
    {active===3 && <button type="button" className="cw-belt-arrow" aria-label="Previous words" onClick={()=>belt.current?.scrollBy({left:-240,behavior:'smooth'})}><Icon name="back"/></button>}
    <div className="cw-word-belt" ref={belt} role="group" aria-label="Choose a word">
      {choices.map(choice=><button type="button" className="cw-word-chip" key={choice.word} aria-pressed={selectedWord===choice.word} disabled={active===1 && choice.word==='is' && item.pairOnly} onClick={()=>{
        if(active===1) onWord(formForVerb(item,choice.word as 'is'|'are'))
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
      <ExampleLanguage matrix groupLastTwo english={`Where ${verb} ${owner} **${word}?**`} thai={`${item.thai}${owner === 'the' ? '' : ownerThai}อยู่ที่ไหน`} units={[
        { english: 'Where', thai: 'ที่ไหน' },
        { english: verb, thai: 'อยู่' },
        { english: owner, thai: ownerThai },
        { english: `${word}?`, thai: item.thai },
      ]} slotDetails={[{label:'Question',count:1,icon:<WordSlotIcon slot={0}/>},{label:'Tense · now',count:pluralLesson ? 2 : 1,control:picker(1,pluralLesson ? 2 : 1),icon:<WordSlotIcon slot={1} plural={verb==='are'}/>},{label:'Which / whose',count:3,control:picker(2,3),icon:<WordSlotIcon slot={2}/>},{label:'Person / thing',count:catalogue.length,control:picker(3,catalogue.length),icon:<VocabularyPicture word={word}/>}]}
      afterUnits={conveyor}
      translationControl={pluralLesson ? <button className="cw-sound" aria-label={t('ฟังประโยค')} onClick={async()=>{if(recording.current){recording.current.src=lessonTwoAudio(word,owner,verb);setAudioError(false);try{await recording.current.play()}catch{setAudioError(true)}}}}><Icon name="sound"/></button> : owner === 'the' ? audio : <button className="cw-sound" aria-label={t('ฟังประโยค')} onClick={() => {
        window.speechSynthesis.cancel()
        const speech = new SpeechSynthesisUtterance(`Where ${verb} ${owner} ${word}?`)
        speech.lang = 'en-US'; speech.rate = .85
        window.speechSynthesis.speak(speech)
      }}><Icon name="sound"/></button>}
      unitActions={[
        {index:0,expanded:false,controls:'word-explanation',onClick:()=>explain(0),label:'Slot 1: Where'},
        {index:1,expanded:false,controls:'word-explanation',onClick:()=>explain(1),label:`Slot 2: ${verb}`},
        {index:2,expanded:false,controls:'word-explanation',onClick:()=>explain(2),label:`Slot 3: ${owner}`},
        {index:3,expanded:false,controls:'word-explanation',onClick:()=>explain(3),label:`Slot 4: ${word}`},
      ]}/>

    </div>

  </section>
}
