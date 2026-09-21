export function BrainIcon() {
 return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 7c-2-5-8-3-8 1-5 0-6 6-3 9-2 4 1 8 5 8 1 4 6 3 6 0V7Zm0 0c2-5 8-3 8 1 5 0 6 6 3 9 2 4-1 8-5 8-1 4-6 3-6 0V7Z"/><path d="M8 8c0 3 2 4 4 4M5 17c3-2 6 0 6 3m13-12c0 3-2 4-4 4m7 5c-3-2-6 0-6 3M11 25v-2m10 2v-2"/></svg>
}
export function ConfidenceFace({level}:{level:number}) {
 return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <circle cx="20" cy="21" r="14.5" fill="currentColor" fillOpacity=".06"/>
  {level<4?<><circle cx="15" cy="19" r="1.15" fill="currentColor" stroke="none"/><circle cx="25" cy="19" r="1.15" fill="currentColor" stroke="none"/></>:<><path d="M12 19q3-4 6 0M22 19q3-4 6 0"/></>}
  {level===1&&<><path d="m11 14 6 1m6-1 5-2M14 28q3-4 6-1t6-1"/><path d="M5 7h.01M8 3c3-1 4 2 2 3L8 8"/></>}
  {level===2&&<path d="m12 14 5 1M14 27q6-3 12-1"/>}
  {level===3&&<path d="M14 26q6 4 12 0"/>}
  {level===4&&<path d="M13 25q7 9 14 0"/>}
  {level===5&&<><path d="M13 24h14q-1 9-7 9t-7-9Z" fill="currentColor" fillOpacity=".15"/><path d="m33 2 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="currentColor" strokeWidth="1"/></>}
 </svg>
}
export function FlowArrow() {
 return <svg viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 8h19m-6-5 6 5-6 5"/></svg>
}

export function QuantityIcon({plural}:{plural:boolean}) {
 return <svg className="word-quantity" viewBox="0 0 72 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
  {(plural?[3,27,51]:[27]).map(x=><g key={x} transform={`translate(${x} 1)`}>
   <path d="m9 0 9 5v11l-9 5-9-5V5Z" fill="currentColor" fillOpacity=".18"/>
   <path d="m0 5 9 5 9-5M9 10v11"/>
  </g>)}
 </svg>
}
