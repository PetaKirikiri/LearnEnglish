import { useState } from 'react'
import ExampleLanguage from '../learning/ExampleLanguage'
import { guideModes, raceGuide } from './raceGuide'
import { WINDOW_MS } from './rules'
import './raceWalkthrough.css'

function ScreenIcon({ phone = false }: { phone?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{phone ? <><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/></> : <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 22h8m-4-5v5"/></>}</svg>
}

export default function RaceWalkthrough({ stageId, questionIds }: { stageId?: string; questionIds?: string[] }) {
  const [mode, setMode] = useState('tonight-slots')
  const selected = stageId ?? mode
  const guide = raceGuide(selected, questionIds)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  if (!guide || !guide.examples.length) return null
  const example = guide.examples[index % guide.examples.length]
  const chooseExample = (next: number) => { setIndex(next); setPicked(null) }
  return <section className="race-walkthrough" id="race-guide" lang="th" aria-label="ก่อนแข่ง ดูหน้าจอและตัวอย่างคำถาม">
    <header className="rw-heading"><div><span>ก่อนแข่ง</span><h2>ดูจอใหญ่ → ตอบบนมือถือ</h2></div><span className="rw-time">{WINDOW_MS / 1000} วินาที / ข้อ</span></header>
    {!stageId && <div className="rw-modes" aria-label="รูปแบบที่ครูเลือก">{guideModes.map(item => <button key={item.id} aria-pressed={selected === item.id} onClick={() => { setMode(item.id); chooseExample(0) }}>{item.label}</button>)}</div>}
    <div className="rw-layout">
      <figure className="rw-phone"><figcaption><ScreenIcon phone/><strong>บนมือถือของนักเรียน</strong></figcaption><img src={`/images/race/guide/${guide.judgement ? 'judgement' : 'meaning'}-phone.png`} width="480" height="550" alt={guide.judgement ? 'หน้าจอจริง มีม้า แถบเวลา และปุ่มไม่ถูกต้องกับถูกต้อง' : 'หน้าจอจริง มีม้า แถบเวลา และคำตอบภาษาไทยสองตัวเลือก'}/><p>ภาพจากเกมจริง · คำตอบเปลี่ยนตามข้อ</p></figure>
      <div className="rw-demo">
        <div className="rw-screen-heading"><ScreenIcon/><strong>คำถามอยู่บนจอห้องเรียน</strong></div>
        <p className="rw-caption">{guide.hasAudio ? 'ดูประโยคและฟังเสียง แล้วตอบบนมือถือ' : 'อ่านประโยคบนจอ แล้วเลือกความหมายบนมือถือ'}</p>
        <div className="rw-examples" aria-label="ตัวอย่างจากชุดคำถาม">{guide.examples.map((item, i) => <button key={`${item.sourceId}-${i}`} aria-label={`ตัวอย่าง ${i + 1}: ${item.label}`} aria-pressed={i === index % guide.examples.length} onClick={() => chooseExample(i)}>{i + 1}</button>)}</div>
        <div className="rw-example" key={`${selected}-${example.sourceId}-${index}`}><h3>{example.label}</h3><ExampleLanguage matrix english={example.english} units={example.units} thai={example.thai}/></div>
        <p className="rw-caption">ตัวอย่างสอนก่อนแข่ง มีคำแปลช่วย · ในเกมดูภาษาอังกฤษบนจอใหญ่</p>
        <div className="rw-try"><span><ScreenIcon phone/>ลองเลือกคำตอบ</span><div>{example.choices.map((choice, i) => <button key={`${choice}-${i}`} aria-pressed={picked === i} onClick={() => setPicked(i)}>{guide.judgement && <b aria-hidden="true">{i === 0 ? '✓' : '×'}</b>}{choice}</button>)}</div><p className="rw-feedback" role="status">{picked !== null ? `${picked === example.correct ? '✓ ถูกต้อง' : 'ลองอีกครั้ง'} · ${example.explanation}` : ' '}</p></div>
        <div className="rw-rules"><span>✓ ตอบถูกและเร็ว → ม้าวิ่งเร็วขึ้น</span><span>✦ ถูกติดกัน 5 ข้อ → ม้าสีทอง</span>{guide.judgement && <span>← ปัดซ้าย = ผิด · ปัดขวา = ถูก →</span>}</div>
      </div>
    </div>
    <footer className="rw-footer"><span>สแกน QR → ใส่ชื่อ → รอครูเริ่ม</span><span>{guide.judgement ? 'ตรวจรูปประโยค' : 'เลือกความหมาย'} · {guide.questionCount} คำถามในชุด{!stageId && ' · ครูเลือกคำที่จะใช้ได้'}</span></footer>
  </section>
}
