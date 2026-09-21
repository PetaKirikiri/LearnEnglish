import { useEffect, useState } from 'react'
import MemberProfilePage from './MemberProfilePage'
import { supabase } from '../lib/supabase'

type Member = { id: string; name: string; firstSeen: string | null; lastActive: string | null; logins: number; answers: number; correct: number; weeklyPoints: number; groups: {name: string; joinedAt: string}[] }
const date = (value: string | null) => value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(new Date(value)) : '—'
export default function MembersTablePage() {
  const [selected, setSelected] = useState<Member | null>(null)
  const [members,setMembers] = useState<Member[]>([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [search,setSearch] = useState('')
  useEffect(() => {
    let active=true
    void (async () => {
      try {
        const result=await supabase.rpc('fifa_english_admin_members')
        if (result.error) throw result.error
        if (active) { setMembers(result.data as Member[]); setError('') }
      } catch { if (active) { setError('Could not load members. Refresh to retry.'); setMembers([]) } }
      finally { if (active) setLoading(false) }
    })()
    return () => { active=false }
  },[])
  const rows=members.filter(m=>m.name.toLowerCase().includes(search.trim().toLowerCase()))
  if (selected) return <MemberProfilePage key={selected.id} member={selected} onBack={() => setSelected(null)} />
  return <section aria-label="Members" className="members-sheet">
    <div className="sheet-toolbar"><input aria-label="Search members" type="search" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} /></div>
    {error && <p role="alert" className="my-3 text-red-700">{error}</p>}
    {loading ? <p role="status">Loading members…</p> : <div className="sheet-scroll"><table className="data-sheet"><caption className="sr-only">Joined EnglishSuccess members</caption><thead><tr>{['#','Member','First seen','Last active','Logins','Answers','Correct','Accuracy','This week','Groups · joined'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((m,i)=><tr key={m.id}><td className="sheet-number">{i+1}</td><th scope="row"><button type="button" onClick={() => setSelected(m)} className="font-semibold text-teal-800 underline underline-offset-4" aria-label={`Open ${m.name} profile`}>{m.name}</button></th><td className="whitespace-nowrap">{date(m.firstSeen)}</td><td className="whitespace-nowrap">{date(m.lastActive)}</td><td>{m.logins}</td><td>{m.answers}</td><td>{m.correct}</td><td>{m.answers ? `${Math.round(m.correct/m.answers*100)}%` : '—'}</td><td>{m.weeklyPoints} pts</td><td>{m.groups.length ? m.groups.map(g=><div key={g.name} className="whitespace-nowrap">{g.name} · {date(g.joinedAt)}</div>) : '—'}</td></tr>)}</tbody></table>{!rows.length && !error && <p className="p-5 text-sm text-slate-500">{members.length ? 'No matching members.' : 'No app members have joined yet.'}</p>}</div>}
  </section>
}
