import { useEffect, useState } from 'react'
import PhonePractice from './PhonePractice'
import CohortLeaderboard from './CohortLeaderboard'
import { supabase } from '../lib/supabase'
import { homeworkLineUrl, recogniseHomeworkAccount, homeworkDestination } from '../auth/homeworkLine'
import './phonePractice.css'

export default function HomeworkEntry() {
  const [tester,setTester] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [state, setState] = useState<'loading'|'error'>('loading')
  const [error, setError] = useState('')
  const local = import.meta.env.DEV && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  async function connect(register = false) {
    setState('loading')
    try {
      const id = await recogniseHomeworkAccount(register)
      if (id) { const joined = await supabase.rpc('join_english_success'); if(joined.error) throw joined.error; setAccount(id) }
      else throw new Error('เชื่อมต่อไม่สำเร็จ')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'เชื่อมต่อไม่สำเร็จ'); setState('error') }
  }
  useEffect(() => {
    if (local) {
      void supabase.auth.getUser().then(async ({data}) => { if(data.user) setAccount(data.user.id) })
      return
    }
    let active = true
    void recogniseHomeworkAccount().then(async id => {
      if (!active) return
      if (id) { const joined = await supabase.rpc('join_english_success'); if(joined.error) throw joined.error; if(active)setAccount(id) }
      else throw new Error('เชื่อมต่อไม่สำเร็จ')
    }).catch(cause => {
      if (!active) return
      setError(cause instanceof Error ? cause.message : 'เชื่อมต่อไม่สำเร็จ')
      setState('error')
    })
    return () => { active = false }
  }, [local])
  useEffect(() => {
    let active=true
    setTester(false)
    if(account) void supabase.from('english_tester_accounts').select('learner_id').eq('learner_id',account).maybeSingle().then(({data,error})=>{if(active)setTester(!error && !!data)})
    return ()=>{active=false}
  },[account])
  if (local || account) return homeworkDestination() === 'scoreboard' ? <CohortLeaderboard userId={account ?? undefined}/> : <PhonePractice key={account ?? 'local'} userId={account ?? undefined} tester={tester}/>
  const link = homeworkLineUrl(new URLSearchParams(location.search).get('lesson') === '2' ? 2 : 1)
  return <main className="phone-practice" lang="th"><div className="practice-shell"><section className="practice-complete" aria-live="polite">
    
    {state === 'loading' ? <span role="status" aria-label="กำลังเชื่อมต่อ" style={{display:'block',width:28,height:28,border:'3px solid #dbe8ff',borderTopColor:'#1877ef',borderRadius:'50%'}}/> : <><p role="alert" style={{fontSize:20}}>{error}</p><button onClick={() => void connect()}>ลองอีกครั้ง</button>{link && <a href={link + (homeworkDestination() === 'scoreboard' ? '&view=scoreboard' : '')}>เปิดใน LINE</a>}</>}

  </section></div></main>
}
