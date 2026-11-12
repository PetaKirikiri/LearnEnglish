import '../learning/sentencePalette.css'
import {Fragment,type ReactNode,type CSSProperties} from 'react'
import {languageRoleIcon,type LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'
import {sentenceVerbType,sentenceVerbLabels} from '../learning/sentenceMatrix/sentenceRoles'
import {sentenceLinks} from '../learning/sentenceMatrix/sentenceLinks'
import './pictureSentence.css'

type Unit=LanguageDocument['units'][number]
/** Every word keeps its own picture; shared links provide the outer shape. */
export function pictureChunks(units:readonly Unit[]){return units.map(unit=>({english:unit.english,unit}))}
/** Read-only answers share the question's semantic links, icons and colours. */
export default function PictureSentence({document,coloured=true}:{document:LanguageDocument;coloured?:boolean}){
 const links=sentenceLinks(document.units),parts:ReactNode[]=[]
 const roles=document.units.map(unit=>unit.role)
 const tile=(unit:Unit,index:number)=><span data-word-type={sentenceVerbType(unit.role,roles)} title={sentenceVerbType(unit.role,roles)?sentenceVerbLabels[sentenceVerbType(unit.role,roles)!]:undefined} key={index} className="picture-sentence-part" data-role={unit.role} data-action={unit.role==='action'?unit.english.replace(/[?.!]$/,''):undefined}>
  <span className="picture-sentence-art" aria-hidden="true">{languageRoleIcon(unit,document.construction)}</span>
  <span className="picture-sentence-word">{unit.english}</span>
 </span>
 for(let index=0;index<document.units.length;index++){
  const link=links.find(link=>link.start===index)
  if(link){parts.push(<span key={index} className="picture-sentence-group" data-link={link.kind} role="group" aria-label={link.kind==='noun'?'Noun phrase':'Subject and matching verb'} style={{'--picture-units':link.end-link.start} as CSSProperties}>{document.units.slice(index,link.end).map((unit,offset)=>tile(unit,index+offset))}</span>);index=link.end-1}
  else parts.push(tile(document.units[index],index))
 }
 return <span className="picture-sentence" data-coloured={coloured||undefined} lang="en" aria-label={document.english}>
  {parts.map((part,index)=><Fragment key={index}>{index>0&&<span className="picture-sentence-plus" aria-hidden="true">+</span>}{part}</Fragment>)}
 </span>
}
