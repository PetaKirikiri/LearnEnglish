import VocabularyPicture from '../VocabularyPicture'
import MatrixCard from './MatrixCard'
import '../../classroom/sentenceLine.css'
import WordSlotIcon from './WordSlotIcon'
import { getLanguage } from '../../classroom/language'
import type { ClassroomWord, Tense } from './model'
import './wordUsageVisual.css'

/** Number agreement is shown with the actual noun artwork, not abstract prose. */
export default function WordUsageVisual({item,tense='present'}:{item:ClassroomWord;tense?:Tense}) {
 const th=getLanguage()==='th'
 const singularVerb=tense==='past'?'was':'is', pluralVerb=tense==='past'?'were':'are'
 const forms=item.pairOnly
  ? [{word:item.word,plural:true,pair:true}]
  : item.singular && item.plural
   ? [{word:item.singular,plural:false,pair:false},{word:item.plural,plural:true,pair:false}]
   : [{word:item.word,plural:item.number==='plural',pair:false}]
 const singular=item.singular??item.word
 const plural=item.plural??item.word
 let shared=0
 while(shared<singular.length && shared<plural.length && singular[shared]===plural[shared])shared++
 return <div className="cw-usage-visual">
  <p className="cw-agreement-purpose">{item.pairOnly
   ? (th?`คำนี้เป็นรูปพหูพจน์ จึงใช้ ${pluralVerb} แม้มีหนึ่งคู่`:`This noun is plural, so use ${pluralVerb}—even for one pair.`)
   : (th?`ดูจำนวนสิ่งของ แล้วเลือก ${singularVerb} หรือ ${pluralVerb} ให้ตรงกัน`:`Use the number of things to choose ${singularVerb} or ${pluralVerb}.`)}</p>
  {tense==='past' && <p className="cw-time-caption">{th?'↶ ก่อนหน้านี้':'↶ Before · past time'}</p>}
  <div className={`cw-number-comparison${forms.length===1?' is-single':''}`}>
   {forms.map(form=><figure key={form.word} className={`cw-number-example${form.word===item.word?' is-current':''}`} aria-label={`${form.word}: ${form.plural?pluralVerb:singularVerb}`}>
    <figcaption><span className="cw-quantity">{form.pair?'1':form.plural?'2+':'1'}</span>{form.pair?(th?'หนึ่งคู่':'One pair'):form.plural?(th?'หลายสิ่ง':'More than one'):(th?'หนึ่งสิ่ง':'One thing')}</figcaption>
    <VocabularyPicture word={form.word}/>
    <strong className="cw-form-word" lang="en">{form.plural && !form.pair && item.singular?<>{form.word.slice(0,shared)}<mark>{form.word.slice(shared)}</mark></>:form.word}</strong>
    <span className="cw-form-meaning" lang="th">{item.thai}</span>
    <svg className="cw-agreement-arrow" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v17m-5-5 5 5 5-5"/></svg>
    <div className="cw-verb-match cw-sentence-board"><h3 className="cw-verb-caption">{th?'ใช้กับ':'Use with'}</h3><div className="example-matrix"><MatrixCard slot={1}>
     <span className="cw-slot-role"><WordSlotIcon slot={1} plural={form.plural} past={tense==='past'}/></span>
     <strong className="example-source" lang="en">{form.plural?pluralVerb:singularVerb}</strong>
     <span className="example-gloss" lang="th">{tense==='past'?'อยู่ · ก่อนหน้านี้':'อยู่'}</span>
    </MatrixCard></div></div>
   </figure>)}
  </div>

 </div>
}
