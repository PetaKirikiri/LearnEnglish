import {Fragment} from 'react'
import {languageRoleIcon,type LanguageDocument} from '../learning/sentenceMatrix/LanguageQuadrant'
import './pictureSentence.css'

type Unit=LanguageDocument['units'][number]
/** Keep small grammatical words with their referent; ownership stays visible as its own picture. */
export function pictureChunks(units:readonly Unit[]){
 const chunks:{english:string;unit:Unit}[]=[]
 for(let i=0;i<units.length;i++){
  const unit=units[i],next=units[i+1]
  if(next&&((['determiner','person-determiner'].includes(unit.role)&&/^(the|a|an)$/i.test(unit.english))||(unit.role==='be'&&['action','person'].includes(next.role)))){
   chunks.push({english:`${unit.english} ${next.english}`,unit:next});i++
  }else chunks.push({english:unit.english,unit})
 }
 return chunks
}
/** Read-only answer artwork uses the same semantic icons as the classroom engine. */
export default function PictureSentence({document}:{document:LanguageDocument}){
 return <span className="picture-sentence" lang="en" aria-label={document.english}>
  {pictureChunks(document.units).map((chunk,index)=><Fragment key={index}>
   {index>0&&<span className="picture-sentence-plus" aria-hidden="true">+</span>}
   <span className="picture-sentence-part" data-role={chunk.unit.role} data-action={chunk.unit.role==='action'?chunk.unit.english.replace(/[?.!]$/,''):undefined}>
    <span className="picture-sentence-art" aria-hidden="true">{languageRoleIcon(chunk.unit,document.construction)}</span>
    <span className="picture-sentence-word">{chunk.english}</span>
   </span>
  </Fragment>)}
 </span>
}
