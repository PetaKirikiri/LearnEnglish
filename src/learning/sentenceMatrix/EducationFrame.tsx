import {useEffect,useRef,type CSSProperties,type ReactNode} from 'react'
import {t,getLanguage} from '../../classroom/language'
import Icon from '../../ui/Icon'
import '../../classroom/wordExplanation.css'

/** Canonical education header, reference sheet, Back/Escape and entry focus. */
export default function EducationFrame({id,selected,category,colour,ink,icon,gloss,onBack,children}:{
 id:string;selected:string;category:string;colour:string;ink:string;icon:ReactNode;gloss:string;onBack:()=>void;children:ReactNode
}){
 const heading=useRef<HTMLElement>(null)
 useEffect(()=>{heading.current?.focus({preventScroll:true})},[])
 return <section id={id} className="cw-word-explanation" style={{'--word-colour':colour,'--word-ink':ink} as CSSProperties} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onBack()}}}>
  <header ref={heading} tabIndex={-1} aria-label={selected} className="cw-word-heading">
   <button type="button" className="cw-word-return" onClick={onBack} aria-label={t('กลับไปที่ประโยค')}><Icon name="back"/></button>
   <div className="cw-simple-word-title">{icon}<div><span className="cw-word-category">{category}</span><h1>{selected}</h1><p lang={getLanguage()}><span className="cw-word-gloss-text">{gloss}</span></p></div></div>
  </header>
  <div className="cw-word-body"><article className="cw-reference-sheet">{children}</article></div>
 </section>
}
