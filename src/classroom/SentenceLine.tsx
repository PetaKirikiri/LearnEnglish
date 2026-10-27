import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import ExampleLanguage from '../learning/ExampleLanguage'
import type { HolidayWord } from '../race/holidayVocabulary'
import Icon from '../ui/Icon'
import { wordChoices } from './lessonOne'
import './sentenceLine.css'

export default function SentenceLine({ word, onWord, audio }: { word: HolidayWord; onWord: (word: HolidayWord) => void; audio: ReactNode }) {
  const [active, setActive] = useState<number | null>(null)
  const open = active !== null
  const [owner, setOwner] = useState('the')
  const owners = [{word:'the',thai:'ที่กำลังพูดถึง'}, {word:'my',thai:'ของฉัน'}, {word:'your',thai:'ของคุณ'}]
  const ownerThai = owners.find(item => item.word === owner)!.thai
  const choices = active === 0 ? [{word:'Where',thai:'ที่ไหน'}] : active === 1 ? [{word:'is',thai:'อยู่ · ปัจจุบัน'}] : active === 2 ? owners : wordChoices
  useEffect(() => () => window.speechSynthesis?.cancel(), [word, owner])
  const choicesId = useId()
  const board = useRef<HTMLElement>(null)
  const item = wordChoices.find(item => item.word === word)!
  function closeChoices() {
    setActive(null)
    board.current?.querySelector<HTMLButtonElement>(`.slot-${active}.example-unit-trigger`)?.focus()
  }
  return <section ref={board} className="cw-sentence-board" data-long-word={word.length > 8 || undefined} aria-label="Where is the…?" onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.stopPropagation(); closeChoices() }
  }}>
    <div className="cw-sentence-display">
      <ExampleLanguage matrix groupLastTwo english={`Where is ${owner} **${word}?**`} thai={`${item.thai}${owner === 'the' ? '' : ownerThai}อยู่ที่ไหน`} units={[
        { english: 'Where', thai: 'ที่ไหน' },
        { english: 'is', thai: 'อยู่' },
        { english: owner, thai: ownerThai },
        { english: `${word}?`, thai: item.thai },
      ]} slotDetails={[{label:'Question',count:1},{label:'Tense · now',count:1},{label:'Which / whose',count:3},{label:'Person / thing',count:wordChoices.length}]}
      translationControl={owner === 'the' ? audio : <button className="cw-sound" aria-label="ฟังประโยค" onClick={() => {
        window.speechSynthesis.cancel()
        const speech = new SpeechSynthesisUtterance(`Where is ${owner} ${word}?`)
        speech.lang = 'en-US'; speech.rate = .85
        window.speechSynthesis.speak(speech)
      }}><Icon name="sound"/></button>}
      unitActions={['Where','is',owner,word].map((text,index) => ({index,onClick:()=>setActive(active === index ? null : index),expanded:active === index,controls:choicesId,label:`Slot ${index+1}: ${text}`,affordance:<span className="cw-slot-change" aria-hidden="true">⌄</span>}))}/>

    </div>
    <div className={`cw-vocabulary-drawer${open ? ' is-open' : ''}`} id={choicesId} inert={!open} aria-hidden={!open}>
      <div className="cw-vocabulary-clip">
        <section className="cw-vocabulary" aria-labelledby={`${choicesId}-title`}>
          <header><h2 id={`${choicesId}-title`} lang="th">{['Question', 'Tense · present singular', 'the / my / your', 'Vocabulary'][active ?? 3]}</h2><button type="button" aria-label="ปิดคำศัพท์" onClick={closeChoices}><Icon name="close"/></button></header>
          <div className="cw-vocabulary-options" role="group" aria-label="คำศัพท์">
            {choices.map(choice => <button type="button" key={choice.word} aria-pressed={(active === 2 ? owner : active === 0 ? 'Where' : active === 1 ? 'is' : word) === choice.word} onClick={() => { if(active === 2) setOwner(choice.word); if(active === 3) onWord(choice.word as HolidayWord) }}><strong lang="en">{choice.word}</strong><span lang="th">{choice.thai}</span>{(active === 2 ? owner : active === 0 ? 'Where' : active === 1 ? 'is' : word) === choice.word && <Icon name="check"/>}</button>)}
          </div>
        </section>
      </div>
    </div>
  </section>
}
