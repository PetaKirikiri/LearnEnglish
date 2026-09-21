import { wordProfiles } from '../../content/languageData'
import { normalizeHelpWord } from '../helpPoints'
import { FlowArrow, QuantityIcon } from './WordVisuals'
import { tenseInContext } from './tense'
export default function WordDetails({word,context}:{word:string;context:string}) {
 const normalized=normalizeHelpWord(word),profile=wordProfiles[normalized]
 if(!profile)return <p className="word-data-note" lang="th">ยังไม่มีข้อมูลรูปคำ</p>
 const ambiguous=profile.nouns.length>0&&profile.verbs.length>0
 return <div className="word-details" lang="th">
  {profile.grammar_note_th&&<section><h3>รูปคำและการใช้</h3><p>{profile.grammar_note_th}</p></section>}
  {profile.verbs.map(verb=>{
   const tense=tenseInContext(normalized,context,verb)
   return <section key={verb.base}><h3>{ambiguous?'เมื่อใช้เป็นกริยา':'รูปคำกริยา'}</h3>
    {tense&&<p className="word-tense">{tense}</p>}
    <div className="word-forms verb-forms">{([['รูปพื้นฐาน',verb.base],...(verb.base==='be'?[['ปัจจุบัน · I / you / we / they','am / are']]:[]),['ปัจจุบัน · he / she / it',verb.third],['อดีต · ช่อง 2',verb.past],['ช่อง 3 · ใช้กับกริยาช่วย',verb.participle],['รูป -ing',verb.ing]]).map(([label,value])=><div key={label} data-current={(tense?.includes('รูปถูกกระทำ')?label.startsWith('ช่อง 3'):value.split(' / ').includes(normalized))||undefined}><span>{label}</span><b lang="en">{value}</b></div>)}</div>
    {!tense&&<p className="word-data-note">รูปคำอย่างเดียวอาจบอกเวลาไม่ได้ ต้องดูกริยาช่วยและประโยคด้วย</p>}
   </section>
  })}
  {(profile.usage_frames?.length||profile.before.length||profile.after.length)?<section className="word-neighbours" aria-label="รูปแบบคำก่อนและหลัง">
   {profile.usage_frames?.length?profile.usage_frames.map((frame,index)=><div className="word-orbit teaching-orbit" key={index} data-source="teaching">
    <div className="orbit-side orbit-before">{frame.before.map(before=><span key={before} lang="en">{before}</span>)}</div>
    <FlowArrow/><strong className="orbit-focus has-quantity" lang="en">
     <QuantityIcon plural={frame.after.includes('are')}/>
     <span className="sr-only" lang="th">{frame.after.includes('are')?'หลายสิ่ง: ':'หนึ่งสิ่ง: '}</span>
     <span>{frame.word??word}</span>
    </strong><FlowArrow/>
    <div className="orbit-side orbit-after">{frame.after.map(after=><span key={after} lang="en">{after}</span>)}</div>
   </div>):<div className="word-orbit" data-source="corpus">
    <div className="orbit-side orbit-before">{profile.before.slice(0,5).map(item=><span key={item.word} title={`${item.word} ${word} · ${item.count} ครั้ง`} lang="en">{item.word}<i style={{width:`${Math.max(15,item.count/(profile.before[0]?.count??1)*100)}%`}} aria-hidden="true"/></span>)}</div>
    {profile.before.length>0?<FlowArrow/>:<span/>}<strong className="orbit-focus" lang="en">{word}</strong>{profile.after.length>0?<FlowArrow/>:<span/>}
    <div className="orbit-side orbit-after">{profile.after.slice(0,5).map(item=><span key={item.word} title={`${word} ${item.word} · ${item.count} ครั้ง`} lang="en">{item.word}<i style={{width:`${Math.max(15,item.count/(profile.after[0]?.count??1)*100)}%`}} aria-hidden="true"/></span>)}</div>
   </div>}
  </section>:null}
  {profile.nouns.map(noun=>(noun.note_th||noun.countability==='uncountable'||noun.countability==='plural-only')&&<p className="word-data-note" key={noun.singular}>{noun.note_th??(noun.countability==='uncountable'?'คำนามนับไม่ได้':'ใช้รูปพหูพจน์')}</p>)}



 </div>
}
