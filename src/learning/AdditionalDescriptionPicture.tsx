import type {ReactNode} from 'react'
/** Matched pairs use the same blue selection and muted comparison as size/height. */
export default function AdditionalDescriptionPicture({word,group}:{word:string;group:string}){
 const first=['clean','wet','new','full','open','heavy','happy','fast','soft','thick'].includes(word)
 const scene=(positive:boolean):ReactNode=>{
  switch(group){
   case 'cleanliness':return <><path d="m8 16 10-6h12l10 6-5 12-6-3v32H19V25l-6 3Z" fill="currentColor"/>{positive?<path d="m23 26 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="white"/>:<g fill="#795338"><ellipse cx="23" cy="35" rx="6" ry="4"/><circle cx="29" cy="47" r="4"/><circle cx="17" cy="28" r="3"/></g>}</>
   case 'moisture':return <><path d="M8 31h32v24H8z" fill="currentColor"/>{positive?<g fill="#267be4"><path d="M16 7q-12 16 0 16t0-16M33 14q-10 14 0 14t0-14"/></g>:<g stroke="#d6a323" strokeWidth="3"><circle cx="24" cy="16" r="7" fill="#ffdc52"/><path d="M24 3v4m0 18v4M11 16H7m34 0h-4M14 6l3 3m14 14 3 3M14 26l3-3M31 9l3-3"/></g>}</>
   case 'condition':return <><path d="M9 16h29v43H9z" fill="currentColor" stroke="#41556c" strokeWidth="2"/><path d="M14 17v41" stroke="white" strokeWidth="2"/>{positive?<path d="m31 3 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#ffda39"/>:<path d="m22 16 4 12-7 9 8 9-5 13m-8-17 18 4" fill="none" stroke="#795338" strokeWidth="3"/>}</>
   case 'capacity':return <><path d="m10 14 4 44h22l4-44Z" fill="white" stroke="currentColor" strokeWidth="3"/>{positive&&<path d="m13 24 3 31h18l3-31Z" fill="#267be4"/>}</>
   case 'openness':return <><path d="M9 9h30v51H9Z" fill="#d4deea" stroke="#41556c" strokeWidth="2"/><path d={positive?'M10 9 29 17v48L10 59Z':'M10 10h28v49H10Z'} fill="currentColor" stroke="#41556c" strokeWidth="2"/><circle cx={positive?24:33} cy="36" r="2" fill="#ffdc39"/></>
   case 'weight':return <><path d="M7 58h35M24 15v38m-6-6 6 6 6-6" fill="none" stroke="currentColor" strokeWidth={positive?5:2}/>{positive?<><rect x="9" y="23" width="31" height="24" rx="5" fill="currentColor"/><path d="M19 24v-6h12v6" fill="none" stroke="currentColor" strokeWidth="4"/></>:<path d="M12 39Q8 9 34 8q8 27-22 31m0 8L32 13" fill="#e7f0fa" stroke="currentColor" strokeWidth="3"/>}</>
   case 'feeling':return <><circle cx="24" cy="34" r="21" fill="currentColor"/><g stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M16 27v2m16-2v2"/><path d={positive?'M13 39q11 15 22 0':'M13 46q11-15 22 0'} fill="none"/></g></>
   case 'speed':return <><path d="m9 32 7-12h16l9 12v17H9Z" fill="currentColor"/><path d="m18 24-4 9h22l-6-9Z" fill="white"/><circle cx="15" cy="49" r="5" fill="#41556c"/><circle cx="35" cy="49" r="5" fill="#41556c"/>{positive?<path d="M1 18h11M0 27h8M0 39h6" stroke="currentColor" strokeWidth="3"/>:<path d="M20 9h5" stroke="currentColor" strokeWidth="3"/>}</>
   case 'texture':return positive?<><path d="M6 20q18-6 36 0-5 14 0 28-18 6-36 0 5-14 0-28Z" fill="currentColor"/><path d="M13 25q11-3 22 0M13 43q11 3 22 0" stroke="white" strokeWidth="2" fill="none"/></>:<><path d="m7 25 18-10 18 10v25L25 60 7 50Z" fill="currentColor" stroke="#41556c" strokeWidth="2"/><path d="m7 25 18 11 18-11M25 36v24" stroke="white" strokeWidth="2" fill="none"/></>
   case 'thickness':return <><path d={positive?'M6 20h36v34H6Z':'M6 35h36v8H6Z'} fill="white" stroke="currentColor" strokeWidth="4"/>{positive&&<path d="M10 28h28m-28 8h28m-28 8h28" stroke="#a7b6c7" strokeWidth="2"/>}</>
   default:return null
  }
 }
 return <svg className="description-picture" viewBox="0 0 100 70" aria-hidden="true"><g color={first?'#2477df':'#cbd6e2'} opacity={first?1:.55}>{scene(true)}</g><g transform="translate(52)" color={first?'#cbd6e2':'#2477df'} opacity={first?.55:1}>{scene(false)}</g></svg>
}
