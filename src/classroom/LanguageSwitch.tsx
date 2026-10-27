import { createPortal } from 'react-dom'
import { useLanguage, setLanguage } from './language'
import './language.css'
export function LanguageSwitch(){const lang=useLanguage();return createPortal(<div className="cw-language-switch" role="group" aria-label={lang==='th'?'ภาษา':'Language'}>{(['en','th'] as const).map(value=><button key={value} aria-label={value==='en'?'English':'ภาษาไทย'} title={value==='en'?'English':'ภาษาไทย'} aria-pressed={lang===value} onClick={()=>setLanguage(value)}><span aria-hidden="true">{value==='en'?'🇬🇧':'🇹🇭'}</span></button>)}</div>,document.body)}
