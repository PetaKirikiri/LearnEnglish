import { getQuizCatalogue } from '../learning/quizContent'
import { buildWordCollection } from '../learning/wordCollection'
import WordCollectionPanel from './WordCollectionPanel'
import { useEffect, useMemo, useState } from 'react'
import { loadLearnerEvents } from '../learning/progressSync'
import type { ProgressEvent } from '../learning/progressData'
import WordConfidencePanel from './WordConfidencePanel'
export default function MemberProfilePage({ member, onBack }: { member: { id: string; name: string }; onBack: () => void }) {
  const [snapshot, setSnapshot] = useState<{ events: ProgressEvent[]; now: number } | null>(null)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    void loadLearnerEvents(member.id).then(events => { if (active) { setSnapshot({ events, now: Date.now() }); setError(''); setLoading(false) } }).catch(() => { if (active) { setError('Could not load this learner’s practice. Please try again.'); setLoading(false) } })
    return () => { active = false }
  }, [member.id, refresh])
  const collection = useMemo(() => {
    if (!snapshot) return null
    const bank = getQuizCatalogue()
    return buildWordCollection(snapshot.events, [...bank.vocabulary, ...bank.sentences], snapshot.now)
  }, [snapshot])
  return <section className="mx-auto max-w-6xl space-y-6"><button type="button" onClick={onBack} className="text-sm font-semibold text-teal-800">← Members</button><header className="flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-slate-500">Learner profile</p><h1 className="mt-2 text-3xl font-bold">{member.name}</h1></div><button disabled={loading} onClick={() => { setLoading(true); setRefresh(v => v + 1) }} className="rounded-lg border px-4 py-2 disabled:opacity-40">Refresh</button></header>{loading && <p role="status">Loading word confidence…</p>}{error && <p role="alert" className="text-red-700">{error}</p>}{snapshot && <><p className="text-xs text-slate-500">{error ? 'Showing previously loaded data. ' : ''}Updated {new Date(snapshot.now).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })} Bangkok time</p>{!snapshot.events.length && <p className="rounded-xl bg-slate-50 p-4 text-sm">No practice has synced for this learner yet. Confidence will appear as they practise.</p>}<>{collection && <WordCollectionPanel collection={collection} />}<details><summary className="cursor-pointer text-sm font-semibold">Word confidence details</summary><div className="mt-5"><WordConfidencePanel events={snapshot.events} now={snapshot.now} /></div></details></></>}</section>
}
