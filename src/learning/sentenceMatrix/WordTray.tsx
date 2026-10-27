import { useEffect, useRef, useState } from 'react'
import Icon from '../../ui/Icon'
import VocabularyPicture from '../VocabularyPicture'
import WordSlotIcon from './WordSlotIcon'

/** A fixed-height selection rail. Scrolling this rail never scrolls the lesson. */
export default function WordTray({id,active,choices,selected,canChoose,onChoose,onClose}: {
  id:string;active:number|null;choices:readonly {word:string;thai:string}[];selected:string;
  canChoose:(word:string)=>boolean;onChoose:(word:string)=>void;onClose:()=>void;
}) {
  const belt=useRef<HTMLDivElement>(null)
  const [cursor,setCursor]=useState(selected)
  const available=choices.filter(choice=>canChoose(choice.word))
  const cursorIndex=Math.max(0,available.findIndex(choice=>choice.word===cursor))
  function reveal(button:HTMLButtonElement, smooth=false) {
    const rail=belt.current
    if(!rail) return
    button.focus({preventScroll:true})
    const railBox=rail.getBoundingClientRect(), box=button.getBoundingClientRect()
    rail.scrollBy?.({left:box.x-railBox.x-(railBox.width-box.width)/2,behavior:smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'instant'})
  }
  useEffect(()=>{
    if(active===null) return
    const button=belt.current?.querySelector<HTMLButtonElement>('[aria-pressed=true]')
    if(button) reveal(button)
  },[active])
  function move(direction:number) {
    const buttons=[...belt.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []]
    const focused=buttons.findIndex(button=>button.dataset.word===cursor)
    const selectedIndex=buttons.findIndex(button=>button.getAttribute('aria-pressed')==='true')
    const next=buttons[Math.max(0,Math.min(buttons.length-1,(focused<0?selectedIndex:focused)+direction))]
    if(next) reveal(next,true)
  }
  return <div className="cw-word-dock">
    <div className={`cw-word-conveyor${active!==null?' is-open':''}`} id={id} hidden={active===null} data-slot={active}>
      <button type="button" className="cw-belt-close" aria-label="Close word picker" onClick={onClose}><Icon name="close"/></button>
      <button type="button" className="cw-belt-arrow" aria-label="Previous words" disabled={cursorIndex===0} onClick={()=>move(-1)}><Icon name="back"/></button>
      <div className="cw-word-belt" ref={belt} role="group" aria-label="Choose a word" onKeyDown={event=>{
        if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1)}
        if(event.key==='Home'||event.key==='End'){event.preventDefault();move(event.key==='Home'?-choices.length:choices.length)}
      }}>
        {choices.map(choice=><button type="button" className="cw-word-chip" key={choice.word} data-word={choice.word} onFocus={()=>setCursor(choice.word)} aria-pressed={selected===choice.word} disabled={!canChoose(choice.word)} onClick={()=>onChoose(choice.word)}>
          <span className="cw-word-art">{active===3 ? <VocabularyPicture word={choice.word}/> : <WordSlotIcon slot={active??2} plural={choice.word==='are'}/>}</span>
          <strong lang="en">{choice.word}</strong><span lang="th">{choice.thai}</span>
          {selected===choice.word && <span className="cw-choice-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4 10-10"/></svg></span>}
        </button>)}
      </div>
      <button type="button" className="cw-belt-arrow" aria-label="Next words" disabled={cursorIndex===available.length-1} onClick={()=>move(1)}><Icon name="arrow"/></button>
    </div>
  </div>
}
