import type {ReactNode} from 'react'
import NounModeToggle,{type NounSwapperRequest} from './NounModeToggle'

/** Canonical yellow block, shared by every construction and lesson. */
export default function NounGroup({children,size,label='Noun phrase',swapper}:{children:ReactNode;size:number;label?:string;swapper?:NounSwapperRequest}){
 if(size!==1&&size!==2)throw new Error('A noun block must be a single pronoun/name/noun or separate determiner and noun.')
 return <span className="cw-noun-group" role="group" aria-label={label} data-group-size={size}>
  {swapper&&<div className="matrix-layout-inline-control"><NounModeToggle {...swapper}/></div>}
  {children}
 </span>
}
