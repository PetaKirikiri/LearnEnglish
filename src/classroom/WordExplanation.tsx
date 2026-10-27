import { t, getLanguage } from './language'
import { useEffect, useRef, type CSSProperties } from 'react'
import { lessonOneCatalogue, type ClassroomWord } from './wordCatalogue'
import VocabularyPicture from '../learning/VocabularyPicture'
import { slotReferences, fixedWordReferences, type ReferenceRow } from './wordReference'
import WordSlotIcon from './WordSlotIcon'
import './wordExplanation.css'

export type Determiner = 'the' | 'my' | 'your'
const meanings = {
  the: { title:'สิ่งที่รู้กันว่าหมายถึงอันไหน', explanation:'ใช้เมื่อผู้พูดและผู้ฟังรู้ว่ากำลังพูดถึงสิ่งไหน', gloss:'ที่กำลังพูดถึง' },
  my: { title:'ของคนที่กำลังพูด', explanation:'ใช้เมื่อสิ่งนั้นเป็นของผู้พูด', gloss:'ของฉัน' },
  your: { title:'ของคนที่เราพูดด้วย', explanation:'ใช้เมื่อสิ่งนั้นเป็นของผู้ฟัง', gloss:'ของคุณ' },
} as const
const types = [
  {name:'คำถาม',english:'Question word',role:'บอกว่าเราต้องการรู้อะไร',explanation:'คำถามแต่ละคำใช้ถามข้อมูลต่างกัน ในประโยคนี้เราต้องการรู้สถานที่',colour:'#df2944',ink:'#fff'},
  {name:'คำกริยา',english:'Verb · be',role:'เชื่อมสิ่งที่พูดถึงกับข้อมูลของสิ่งนั้น',explanation:'ในคำถามนี้ กริยา be อยู่หน้าสิ่งที่ถามถึง รูปของคำเปลี่ยนตามเวลาและสิ่งที่พูดถึง',colour:'#128247',ink:'#fff'},
  {name:'คำกำหนดนาม',english:'Determiner',role:'บอกว่าสิ่งไหน หรือของใคร',explanation:'อยู่หน้าคำนาม และทำงานร่วมกับคำนาม เช่น สิ่งที่รู้กัน ของฉัน หรือของคุณ',colour:'#ffd43b',ink:'#18385e'},
  {name:'คำนาม',english:'Noun',role:'ชื่อของคน สถานที่ หรือสิ่งของ',explanation:'ในช่องนี้ เราใส่ชื่อสิ่งที่ต้องการถามหา เปลี่ยนคำนามได้โดยใช้รูปประโยคเดิม',colour:'#ffd43b',ink:'#18385e'},
] as const

export default function WordExplanation({slot,value,onChange,onBack,word,thai,onWord,catalogue=lessonOneCatalogue,verb='is',onVerb}: {slot:number;value:Determiner;onChange:(word:Determiner)=>void;onBack:()=>void;word:string;thai:string;onWord:(word:string)=>void;catalogue?:readonly ClassroomWord[];verb?:'is'|'are';onVerb?:(verb:'is'|'are')=>void}) {
  const back = useRef<HTMLButtonElement>(null)
  useEffect(()=>{back.current?.focus({preventScroll:true})},[])
  const type = types[slot]
  const selected = ['Where',verb,value,word][slot]
  const owner = meanings[value]
  const category = slotReferences[slot]
  const item = catalogue.find(item=>item.word===word)!
  const numberRows: readonly ReferenceRow[] = item.pairOnly ? [['จำนวน','คำนี้ใช้เป็นพหูพจน์ แม้หมายถึงหนึ่งคู่ จึงใช้ are'],['รูปคำ','ไม่ตัด s ออกเพื่อบอกว่ามีหนึ่งคู่']] : item.number ? [['จำนวน',item.number==='plural'?'หลายสิ่ง ใช้ are ในคำถามนี้':'หนึ่งสิ่ง ใช้ is ในคำถามนี้'],['รูปคำ',`${item.singular} → ${item.plural}`],['ความสัมพันธ์','my และ your ไม่ได้บอกจำนวน ให้ดูคำนามเพื่อเลือก is หรือ are']] : [['จำนวน','รูปที่แสดงเป็นเอกพจน์ หมายถึงหนึ่งหน่วย'],['การใช้','เมื่อใช้คำนามนับได้เอกพจน์ในประโยค โดยทั่วไปต้องมีคำกำหนดนามอยู่ข้างหน้า']]
  const detail = fixedWordReferences[selected] ?? {
    meaning:thai,
    function:'คำนามนับได้ ใช้เรียกสถานที่หรือสิ่งของ',
    usage:numberRows,
  }
  return <section id="word-explanation" className="cw-word-explanation" style={{'--word-colour':type.colour,'--word-ink':type.ink} as CSSProperties} onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onBack()}}}>
    <header className="cw-word-heading">
      <button ref={back} className="cw-word-return" onClick={onBack} aria-label={t('กลับไปที่ประโยค')} title={t('กลับไปที่ประโยค')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6"/><path d="M8 12h12"/></svg></button>
      <div className="cw-simple-word-title">
        <WordSlotIcon slot={slot} plural={item.number==='plural'}/>
        <div><h1>{selected}</h1><p lang={getLanguage()}>{slot===0?'ที่ไหน':slot===1?'อยู่ · ปัจจุบัน':slot===2?owner.gloss:thai}</p></div>
      </div>
    </header>
    <div className="cw-word-body">
      <article className="cw-reference-sheet">
      <section className="cw-reference-intro" lang={getLanguage()}>
        <WordSlotIcon slot={slot} plural={item.number==='plural'}/>
        <div><h2>{t(category.name)} {getLanguage()==='th' && <span lang="en">{category.english}</span>}</h2>
        <p>{t(category.responsibility)}</p></div>
      </section>
      <section className="cw-reference-mechanics" lang={getLanguage()}>
        <h2><span className="cw-reference-art cw-reference-art-join" aria-hidden="true"/>{t('การทำงานของช่องนี้')}</h2>
        <ReferenceRows rows={category.mechanics}/>
      </section>
      <section className="cw-reference-word" lang={getLanguage()}>
        <div className="cw-reference-word-title"><h2 lang="en">{selected}</h2><p>{slot < 2 || slot === 3 ? detail.meaning : t(detail.meaning)}</p></div>
        <p className="cw-reference-function">{t(detail.function)}</p>
        <h3><span className="cw-reference-art cw-reference-art-guide" aria-hidden="true"/>{t('ข้อควรรู้ในการใช้')}</h3>
        <ReferenceRows rows={detail.usage}/>
      {(slot===2 || slot===3 || (slot===1 && onVerb)) && <div className="cw-word-options" role="group" aria-label={t('เลือกคำ')}>
        {(slot===1 ? [{word:'is',thai:'หนึ่งสิ่ง'},{word:'are',thai:'หลายสิ่ง'}] : slot===2 ? Object.entries(meanings).map(([word,item])=>({word,thai:item.gloss})) : catalogue).map(option=><button key={option.word} aria-pressed={selected===option.word} disabled={slot===1 && option.word==='is' && item.pairOnly} onClick={()=>slot===1?onVerb?.(option.word as 'is'|'are'):slot===2?onChange(option.word as Determiner):onWord(option.word)}>{slot===3 && <VocabularyPicture word={option.word}/>}<strong>{option.word}</strong><span lang={getLanguage()}>{option.thai}</span></button>)}
      </div>}
      </section>
      </article>
    </div>
  </section>
}

function ReferenceRows({rows}:{rows:readonly ReferenceRow[]}) {
  return <dl className="cw-reference-rows" lang={getLanguage()}>{rows.map(([label,value])=><div key={label}><dt>{t(label)}</dt><dd>{t(value)}</dd></div>)}</dl>
}
