import { useCallback, useEffect, useRef, useState } from 'react'
import { BrainIcon } from './WordVisuals'
import { cachedConfidence, loadConfidence, saveConfidence } from './confidence'
export default function WordConfidence({userId,word}:{userId:string;word:string}) {
  const [score,setScore]=useState<number|null>(()=>cachedConfidence(userId,word)?.score??null)
  const [status,setStatus]=useState('loading')
  const request=useRef(0)
  useEffect(()=>{
    const lifecycle=request
    const version=++lifecycle.current
    void loadConfidence(userId,word).then(result=>{if(request.current===version){setScore(result.score);setStatus(result.source)}},()=>{if(request.current===version)setStatus('error')})
    return ()=>{lifecycle.current++}
  },[userId,word])
  const rate=useCallback((value:number) => {
    const version=++request.current
    setScore(value);setStatus('saving')
    void saveConfidence(userId,word,value).then(result=>{if(request.current===version)setStatus(result)},()=>{if(request.current===version)setStatus('error')})
  },[userId,word])
  useEffect(()=>{const retry=()=>{const value=cachedConfidence(userId,word);if(value?.pending)rate(value.score)};window.addEventListener('online',retry);return()=>window.removeEventListener('online',retry)},[userId,word,rate])
  return <section className="word-confidence" lang="th">
    <div className="confidence-visual-heading"><BrainIcon/><h3>ความมั่นใจของฉัน</h3><span className="confidence-track" aria-hidden="true"/><span className="confidence-value" aria-label="คะแนนความมั่นใจ">{score===null?<small>{status==='loading'?'กำลังโหลด…':'ยังไม่ประเมิน'}</small>:<>{score}<small>/ 5</small></>}</span></div>
    <div className="confidence-scores" role="group" aria-label={`ความมั่นใจในคำว่า ${word}`}>{[1,2,3,4,5].map(value=><button key={value} type="button" aria-pressed={score===value} aria-label={`${value} จาก 5 — ${['ยังไม่มั่นใจ','ไม่ค่อยมั่นใจ','พอมั่นใจ','มั่นใจ','มั่นใจมาก'][value-1]}`} title={['ยังไม่มั่นใจ','ไม่ค่อยมั่นใจ','พอมั่นใจ','มั่นใจ','มั่นใจมาก'][value-1]} onClick={()=>rate(value)}><span className="confidence-face-art" style={{backgroundPosition:`${((value-1)%3)*50}% ${value<=3?0:100}%`}} aria-hidden="true"/>{score===value&&<span className="confidence-selected" aria-hidden="true">✓</span>}</button>)}</div>
    <div className="confidence-scale" aria-hidden="true"><span>ยังไม่มั่นใจ</span><span>มั่นใจมาก</span></div>
    <div className="confidence-save-state" role="status" title={status==='local'?'บันทึกบนเครื่องนี้':status==='saved'?'บันทึกแล้ว':undefined}><span className="sr-only">{status==='saving'?'กำลังบันทึก…':status==='loading'?'กำลังโหลด…':status==='local'?'บันทึกบนเครื่องนี้':status==='error'||status==='pending'?'ยังบันทึกลงบัญชีไม่ได้':score!==null?'บันทึกแล้ว':''}</span>{score!==null&&(status==='saved'||status==='local')&&<span aria-hidden="true">✓</span>}{(status==='saving'||status==='loading')&&<span className="confidence-saving" aria-hidden="true"/>}</div>
    {(status==='error'||status==='pending')&&<button type="button" className="word-retry" onClick={()=>score!==null?rate(score):void loadConfidence(userId,word).then(r=>{setScore(r.score);setStatus(r.source)},()=>setStatus('error'))}>ลองอีกครั้ง</button>}
  </section>
}
