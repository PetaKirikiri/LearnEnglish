import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { inviteCode, inviteLink } from '../learning/groupInvites'

type Group = { id: string; name: string; invite_code: string; members: number }
type Board = { weekStart: string; weekEnd: string; rows: { id: string; name: string; rank: number; points: number }[] }
const buttonClass = 'min-h-11 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50'

export default function GroupLeaderboardPage({ userId, onExit, onPlay }: { userId: string; onExit: () => void; onPlay: () => void }) {
  const [groups, setGroups] = useState<Group[]>([])
  const [selected, setSelected] = useState('')
  const [code, setCode] = useState(() => new URLSearchParams(window.location.search).get('group') ?? '')
  const [groupName, setGroupName] = useState('FIFA & friends')
  const [form, setForm] = useState<'join' | 'create' | null>(() => new URLSearchParams(window.location.search).has('group') ? 'join' : null)
  const [previous, setPrevious] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState(false)
  const [groupLoading, setGroupLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState<{ key: string; data?: Board; error?: string } | null>(null)
  const group = groups.find(g => g.id === selected)
  const boardKey = `${selected}:${previous}:${refresh}`
  const board = result?.key === boardKey ? result.data : undefined
  const boardError = result?.key === boardKey ? result.error : undefined

  useEffect(() => {
    let active = true
    void (async () => {
      const { data, error: failure } = await supabase.rpc('fifa_english_my_groups').then(result => result, () => ({ data: null, error: true }))
      if (!active) return
      if (failure) { setError('Could not load groups. Check your connection and refresh.'); setGroups([]) }
      else {
        const next = (data ?? []) as Group[]
        setGroups(next)
        setSelected(old => next.some(g => g.id === old) ? old : next[0]?.id ?? '')
        setError('')
      }
      setGroupLoading(false)
    })()
    return () => { active = false }
  }, [refresh, userId])

  useEffect(() => {
    if (!selected) return
    let active = true
    void (async () => {
      const { data, error: failure } = await supabase.rpc('fifa_english_group_board', { target_group: selected, previous_week: previous }).then(result => result, () => ({ data: null, error: true }))
      if (active) setResult({ key: boardKey, ...(failure ? { error: 'Scores could not be loaded. Please refresh.' } : { data: data as Board }) })
    })()
    return () => { active = false }
  }, [selected, previous, boardKey])

  useEffect(() => {
    const update = () => { if (document.visibilityState === 'visible') setRefresh(n => n + 1) }
    const timer = window.setInterval(update, 30000)
    document.addEventListener('visibilitychange', update)
    window.addEventListener('fifa-progress-sync', update)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); window.removeEventListener('fifa-progress-sync', update) }
  }, [])

  async function submit() {
    if (busy) return
    const normalized = inviteCode(code)
    if (form === 'join' && !normalized) { setError('Enter the 16-character invite code or paste the invite link.'); return }
    if (form === 'create' && !groupName.trim()) { setError('Give your group a name.'); return }
    setBusy(true); setError(''); setNotice('')
    try {
      const { data, error: failure } = form === 'join'
        ? await supabase.rpc('fifa_english_join_group', { code: normalized })
        : await supabase.rpc('fifa_english_create_group', { group_name: groupName.trim() })
      if (failure) throw failure
      setSelected(data as string); setPrevious(false); setForm(null); setRefresh(n => n + 1)
      const url = new URL(window.location.href); url.searchParams.delete('group'); window.history.replaceState(null, '', url)
    } catch (failure) { setError(failure instanceof Error ? failure.message : (failure as { message?: string })?.message ?? 'Could not save. Please try again.') }
    finally { setBusy(false) }
  }

  async function share() {
    if (!group) return
    const url = inviteLink(group.invite_code)
    try {
      if (navigator.share) await navigator.share({ title: group.name, text: `Join ${group.name} on FIFA English`, url })
      else { await navigator.clipboard.writeText(url); setNotice('Invite link copied. Send it in LINE.') }
    } catch (failure) {
      if ((failure as Error).name !== 'AbortError') setNotice('Copy the invite code below to share this group.')
    }
  }

  async function leave() {
    if (busy || !group || !window.confirm(`Leave ${group.name}? You can rejoin with its invite code.`)) return
    setBusy(true)
    try {
      const { error: failure } = await supabase.rpc('fifa_english_leave_group', { target_group: group.id })
      if (failure) throw failure
      setGroups(old => old.filter(g => g.id !== group.id)); setSelected(''); setResult(null); setRefresh(n => n + 1)
    } catch { setError('Could not leave the group. Try again.') }
    finally { setBusy(false) }
  }

  return <main className="min-h-[100dvh] bg-[#f7f8fa] px-5 py-7 text-slate-900">
    <div className="mx-auto max-w-lg space-y-5">
      <header className="flex items-center gap-4"><button aria-label="Back to home" onClick={onExit} className="h-11 w-11 rounded-full bg-white text-2xl">‹</button><h1 className="flex-1 text-2xl font-bold tracking-tight">Leaderboard</h1><button aria-label="Refresh leaderboard" onClick={() => setRefresh(n => n + 1)} className="h-11 w-11 rounded-full bg-white text-xl">↻</button></header>
      {groupLoading ? <p role="status" className="text-sm text-slate-500">Loading groups…</p> : null}
      {groups.length ? <label className="block"><span className="sr-only">Your group</span><select value={selected} onChange={e => { setSelected(e.target.value); setNotice('') }} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-lg font-bold">{groups.map(g => <option value={g.id} key={g.id}>{g.name} · {g.members}</option>)}</select></label> : !groupLoading && !error ? <section className="rounded-3xl bg-blue-50 p-7"><h2 className="text-xl font-bold">Your friends. Your league.</h2><p className="mt-2 text-sm leading-6 text-slate-600">Create a group or join your friends with an invite.</p></section> : null}
      <div className="flex gap-3"><button onClick={() => { setForm(form === 'join' ? null : 'join'); setError('') }} className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">Join group</button><button onClick={() => { setForm(form === 'create' ? null : 'create'); setError('') }} className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">Create group</button></div>
      {form ? <form onSubmit={e => { e.preventDefault(); void submit() }} className="space-y-3 rounded-2xl bg-white p-5">
        <label className="block text-sm font-bold">{form === 'join' ? 'Invite code or link' : 'Group name'}<input value={form === 'join' ? code : groupName} onChange={e => form === 'join' ? setCode(e.target.value) : setGroupName(e.target.value)} maxLength={form === 'join' ? 500 : 60} disabled={busy} autoCapitalize="off" className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label>
        <p className="text-xs leading-5 text-slate-500">Your name and weekly score will be visible to this group. Your individual answers stay private.</p>
        <button disabled={busy} className={buttonClass}>{busy ? 'Saving…' : form === 'join' ? 'Join' : 'Create'}</button>
      </form> : null}
      {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
      {group ? <>
        <div className="flex items-center justify-between gap-3"><div className="flex rounded-xl bg-slate-200/60 p-1">{[false,true].map(p => <button key={String(p)} aria-pressed={previous===p} onClick={() => setPrevious(p)} className={`rounded-lg px-3 py-2 text-sm font-bold ${previous===p ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{p ? 'Last week' : 'This week'}</button>)}</div><button onClick={() => void share()} className="min-h-11 px-3 text-sm font-bold text-blue-700">Invite friends</button></div>
        {boardError ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{boardError}</p> : !board ? <p role="status" className="text-sm text-slate-500">Loading scores…</p> : <>
          <p className="text-xs text-slate-500">Week of {board.weekStart} · Resets {board.weekEnd}, Bangkok time</p>
          <ol aria-label="Group rankings" className="overflow-hidden rounded-3xl border border-slate-200 bg-white">{board.rows.map(row => <li key={row.id} className={`flex items-center gap-4 border-b border-slate-100 px-5 py-5 last:border-0 ${row.id===userId ? 'bg-blue-50' : ''}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold ${row.rank===1 && row.points>0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>{row.points ? row.rank : '—'}</span><span className="min-w-0 flex-1 break-words font-bold">{row.name}{row.id===userId ? <span className="ml-2 text-xs font-normal text-blue-700">You</span> : null}</span><span className="text-right"><strong className="block text-xl">{row.points}</strong><span className="text-xs text-slate-500">points</span></span></li>)}</ol>
          {board.rows.every(r => !r.points) ? <p className="text-center text-sm text-slate-500">{previous ? 'No points were earned last week.' : 'First points are up for grabs.'}</p> : null}
        </>}
        {!previous ? <button onClick={onPlay} className={`${buttonClass} w-full`}>Play</button> : null}
        <details className="rounded-2xl bg-white p-4 text-sm"><summary className="cursor-pointer font-bold">Scoring & invite code</summary><p className="mt-3 leading-6 text-slate-600">10 points for each different question answered correctly this week. A repeat earns no extra points. A mistake can be retried. Equal scores share a rank. Scores use the week your answers sync, and start with this leaderboard update—not old practice.</p><p className="mt-3 text-xs text-slate-500">Only group members can see this board. Anyone with the invite can join.</p><p className="mt-3 break-all font-mono text-blue-800">{group.invite_code}</p><button disabled={busy} onClick={() => void leave()} className="mt-3 min-h-11 text-sm text-red-700">Leave group</button></details>
      </> : null}
      {notice ? <p role="status" className="text-sm text-blue-800">{notice}</p> : null}
    </div>
  </main>
}
