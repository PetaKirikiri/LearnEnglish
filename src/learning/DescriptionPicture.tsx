import {descriptions} from './everydayVocabulary'
/** Simple semantic marks remain legible at the same size as vocabulary artwork. */
export default function DescriptionPicture({word}:{word:string}){
 const d=descriptions.find(item=>item.word===word)
 if(!d)return null
 return <svg className="description-picture" viewBox="0 0 100 70" aria-hidden="true">
  {d.group==='colour'?<rect x="12" y="6" width="76" height="58" rx="14" fill={d.colour} stroke="#41556c" strokeWidth="3"/>:
   d.group==='size'?<><rect x="8" y="7" width="53" height="53" rx="8" fill={word==='big'?'#2477df':'#d4deea'} stroke={word==='big'?'#163d6b':'#bdcad8'} strokeWidth="3"/><rect x="73" y="39" width="20" height="20" rx="4" fill={word==='small'?'#2477df':'#d4deea'} stroke={word==='small'?'#163d6b':'#bdcad8'} strokeWidth="3"/></>:
   d.group==='height'?<><g fill={word==='tall'?'#2477df':'#cbd6e2'}><circle cx="29" cy="10" r="8"/><path d="M18 25q11-10 22 0v24h-7v18h-8V49h-7Z"/></g><g fill={word==='short'?'#2477df':'#cbd6e2'}><circle cx="73" cy="32" r="6"/><path d="M64 44q9-7 18 0v14h-6v9h-6v-9h-6Z"/></g></>:
   <><path d="M37 44V15a10 10 0 0 1 20 0v29a17 17 0 1 1-20 0" fill="#fff" stroke="#30485f" strokeWidth="4"/><circle cx="47" cy="56" r="10" fill={word==='hot'?'#e52e35':'#267be4'}/><path d={word==='hot'?'M47 54V17':'M47 54V42'} stroke={word==='hot'?'#e52e35':'#267be4'} strokeWidth="8" strokeLinecap="round"/>{word==='hot'?<path d="M76 47q-12-10 0-20t0-20M90 47q-12-10 0-20" fill="none" stroke="#e52e35" strokeWidth="4" strokeLinecap="round"/>:<path d="M79 10v32M65 18l28 16M65 34l28-16" stroke="#267be4" strokeWidth="4"/>}</>}
 </svg>
}
