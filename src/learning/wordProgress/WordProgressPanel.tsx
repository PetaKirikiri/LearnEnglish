import { useEffect,useState } from 'react'
import { loadWordProgress } from './store'
import type { WordProgress } from './model'
export default function WordProgressPanel({userId}:{userId:string}){return <ProgressTable key={userId} userId={userId}/>}
function ProgressTable({userId}:{userId:string}){
 const [rows,setRows]=useState<WordProgress[]>([]),[state,setState]=useState('loading'),[refresh,setRefresh]=useState(0)
 useEffect(()=>{let alive=true;void loadWordProgress(userId).then(data=>{if(alive){setRows(data);setState('ready')}}).catch(()=>{if(alive)setState('error')});return()=>{alive=false}},[userId,refresh])
 return <section className="rounded-2xl bg-white p-5" aria-label="Listening word progress"><header className="flex justify-between gap-4"><h2 className="font-bold">ความก้าวหน้าของคำศัพท์</h2><button onClick={()=>{setState('loading');setRefresh(x=>x+1)}} aria-label="Refresh word scores">↻</button></header>
 {state==='loading'?<p role="status">กำลังโหลด…</p>:state==='error'?<p role="alert">โหลดความคืบหน้าไม่ได้ กรุณาลองอีกครั้ง</p>:!rows.length?<p>ยังไม่มีคำตอบที่บันทึก</p>:<div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{['คำ','คะแนน','ถูกล่าสุด','ฟังอย่างเดียว','ครั้งล่าสุด'].map(h=><th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{[...rows].sort((a,b)=>b.correct-a.correct).map(row=><tr key={row.word_id}><td className="p-2">{row.word_id.slice(3)}</td><td className="p-2">{row.correct}</td><td className="p-2">{row.recent_results.length?Math.round(row.recent_results.filter(Boolean).length/row.recent_results.length*100):0}%</td><td className="p-2">{row.listening_correct}</td><td className="p-2">{new Date(row.last_practised).toLocaleDateString('th-TH',{timeZone:'Asia/Bangkok'})}</td></tr>)}</tbody></table></div>}</section>
}
