import { useMemo } from 'react'
import type { ProgressEvent } from './progressData'
import { assessmentResults, createExamAssessment, examEvidence } from './examReadiness'
const labels = {vocabulary:'คำศัพท์',dialogue:'บทสนทนา',grammar:'ตำแหน่ง',reading:'การอ่าน'}
export default function ExamProgressPanel({events,onStart,available,active}:{events:readonly ProgressEvent[];onStart:()=>void;available:boolean;active:boolean}) {
 const coverage=useMemo(()=>examEvidence(events),[events])
 const results=useMemo(()=>assessmentResults(events),[events])
 const canStart=useMemo(()=>createExamAssessment(events,()=>0.5)!==null,[events])
 const latest=results[0]
 return <section className="exam-progress question-panel mb-6" lang="th" aria-label="Exam preparation">
  <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">เตรียมสอบ · บท 3–4</h2><button type="button" className="primary-action" onClick={onStart} disabled={!available||(!active&&!canStart)}>{active?'ทำต่อ': 'ทดสอบ 40 ข้อ'} →</button></div>
  <table className="mt-5 w-full text-left text-sm"><thead><tr><th>หัวข้อ</th><th>ลองแล้ว</th><th>ทำได้เอง</th></tr></thead><tbody>{coverage.map(c=><tr key={c.category}><th className="py-2 font-medium">{labels[c.category]}</th><td>{c.seen} / {c.total}</td><td>{c.secure} / {c.total}</td></tr>)}</tbody></table>
  <details className="mt-3 text-sm"><summary className="cursor-pointer">ⓘ ทำได้เอง</summary><p className="mt-2">ตอบตัวอย่างฝึกที่ต่างกันครบ: คำศัพท์และตำแหน่ง 3 ข้อ บทสนทนาและการอ่าน 2 ข้อ ในอย่างน้อย 2 รอบ โดยไม่เปิดตัวช่วย หากตอบผิดหรือใช้ตัวช่วย ต้องฝึกยืนยันใหม่ ไม่ใช่การรับรองคะแนนสอบจริง</p></details>
  {!available&&<p role="status" className="mt-3 text-sm">กำลังรอข้อมูลล่าสุดก่อนเริ่มทดสอบ</p>}
  {available&&!active&&!canStart&&<p className="mt-3 text-sm">ยังไม่มีชุดใหม่ครบ 40 ข้อ ฝึกต่อได้ตามปกติ</p>}
  {latest&&<div className="mt-5 border-t border-current/20 pt-4"><strong>{latest.complete?`${latest.sections.reduce((n,s)=>n+s.correct,0)} / 40`:`ยังไม่ครบ · ${latest.answered} / 40`}</strong><div className="mt-2 grid grid-cols-2 gap-2 text-sm">{latest.sections.map(s=><span key={s.category}>{labels[s.category]} · {s.correct} / 10</span>)}</div></div>}
 </section>
}
