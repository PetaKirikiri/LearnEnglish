import { useEffect, useState } from 'react'
import VocabularyPicture from '../VocabularyPicture'
import WordSlotIcon from './WordSlotIcon'
import FadingWords from './FadingWords'
import { wordOpacity,wordTokens,type WordScores } from '../wordProgress/model'
import type { MatrixSettings } from './model'
/** Assessment presentation shared by listening consumers. Snapshot support per question. */
export default function ListeningMatrix({sentence,scores={},settings={},onSnapshot}:{sentence:string;scores?:WordScores;settings?:MatrixSettings;onSnapshot?:(scores:WordScores)=>void}){
 const [snapshot]=useState(scores)
 useEffect(()=>{onSnapshot?.(snapshot)},[snapshot,onSnapshot])
 const words=sentence.split(' '),slots=[words[0],words[1],words[2],words.slice(3).join(' ')]
 return <div className="homework-slots" lang="en" aria-label={settings.fadeMode?'ฟังประโยคภาษาอังกฤษ':sentence}>
 {slots.map((word,slot)=>{
 const opacity=word==='_____'?1:Math.min(...wordTokens(word).map(token=>wordOpacity(token,snapshot,settings)))
 return <div key={slot} className={`homework-slot homework-slot-${slot}`}><small>{slot+1}</small><span aria-hidden="true" style={{opacity}}>{word==='_____'?<span className="foundation-blank-icon">?</span>:slot===3?<VocabularyPicture word={word}/>:<WordSlotIcon slot={slot} plural={word==='are'||word==='were'} past={word==='was'||word==='were'}/>}</span><strong aria-hidden={settings.fadeMode || undefined}><FadingWords text={word} scores={snapshot} settings={settings}/></strong></div>
 })}</div>
}
