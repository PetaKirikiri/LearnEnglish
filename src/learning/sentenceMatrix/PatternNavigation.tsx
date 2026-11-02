import {useRef} from 'react'
import Icon from '../../ui/Icon'
import {getLanguage} from '../../classroom/language'
export default function PatternNavigation({pattern,onChange,label='Sentence patterns'}:{pattern:'question'|'answer';onChange:(mode:'question'|'answer')=>void;label?:string}){
 const touchX=useRef<number|null>(null),th=getLanguage()==='th'
 return (    <nav className="cw-pattern-carousel" aria-label={label} onTouchStart={e=>{touchX.current=e.touches[0].clientX}} onTouchEnd={e=>{
      if(touchX.current!==null){const delta=e.changedTouches[0].clientX-touchX.current;if(Math.abs(delta)>45)onChange(delta<0?'answer':'question')};touchX.current=null
    }}>
      <button type="button" className="cw-pattern-arrow" aria-label="Previous pattern" disabled={pattern==='question'} onClick={()=>onChange('question')}><Icon name="back"/></button>
      <div className="cw-pattern-tabs">{(['question','answer'] as const).map(mode=><button type="button" key={mode} aria-pressed={pattern===mode} onClick={()=>onChange(mode)}><span aria-hidden="true">{mode==='question'?'?':'↳'}</span>{mode==='question'?(th?'ถาม':'Ask'):(th?'ตอบ':'Answer')}</button>)}</div>
      <button type="button" className="cw-pattern-arrow" aria-label="Next pattern" disabled={pattern==='answer'} onClick={()=>onChange('answer')}><Icon name="arrow"/></button>
    </nav>
)
}
