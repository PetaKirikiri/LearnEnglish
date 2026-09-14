import { useEffect, useRef, useState } from 'react'
import { readings } from '../content/readings'
import { useAuth } from '../auth/authContext'
import WordHelp from '../learning/WordHelp'
import Icon from '../ui/Icon'

export default function ReadingPage() {
  const { user } = useAuth()
  const storageKey = `fifa:reading:${user?.id ?? 'guest'}`
  const [selected, setSelected] = useState<string | null>(null)
  const [saved, setSaved] = useState<{ id: string; y: number } | null>(() => { try { return JSON.parse(localStorage.getItem(storageKey) ?? 'null') } catch { return null } })
  const restoreY = useRef(0)
  const reading = readings.find(item => item.id === selected)
  useEffect(() => {
    if (!selected) return
    const frame = requestAnimationFrame(() => window.scrollTo(0, restoreY.current))
    const save = () => localStorage.setItem(storageKey, JSON.stringify({ id: selected, y: window.scrollY }))
    window.addEventListener('scroll', save, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', save) }
  }, [selected, storageKey])
  function open(id: string, y = 0) { restoreY.current = y; setSelected(id); const next = { id, y }; setSaved(next); localStorage.setItem(storageKey, JSON.stringify(next)) }
  if (!reading) return <section className="mx-auto max-w-3xl">
    <div className="mb-7 flex items-end justify-between"><h1 className="text-3xl font-bold tracking-tight">Stories</h1><span className="text-sm text-slate-500">{readings.length} stories</span></div>
    {saved && readings.some(item => item.id === saved.id) && <button className="primary-action mb-5 w-full justify-between" onClick={() => open(saved.id, saved.y)}><span className="text-left"><span className="block text-xs font-normal text-emerald-200">Continue reading</span>{readings.find(item => item.id === saved.id)?.title}</span><Icon name="arrow" /></button>}
    <div className="grid gap-3 sm:grid-cols-2">{readings.map((story, index) => <button key={story.id} onClick={() => open(story.id)} className="group flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-600 hover:shadow-md"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 font-bold text-teal-800">{String(story.chapter ?? index + 1).padStart(2, '0')}</span><span className="flex-1 font-semibold">{story.title}</span><Icon name="arrow" className="h-4 w-4 text-slate-400" /></button>)}</div>
  </section>
  return <article className="mx-auto max-w-3xl">
    <div className="mb-6 flex items-center justify-between"><button onClick={() => { try { setSaved(JSON.parse(localStorage.getItem(storageKey) ?? 'null')) } catch { /* Keep last known position. */ } setSelected(null); window.scrollTo(0, 0) }} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800"><Icon name="grid" />Stories</button><span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{reading.chapter ? `Story ${reading.chapter}` : 'Story'}</span></div>
    <div className="rounded-3xl border border-slate-200/70 bg-white p-6 sm:p-10"><h1 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl">{reading.title}</h1><div className="space-y-6 text-lg leading-9 sm:text-xl">{reading.paragraphs.map(paragraph => <p key={paragraph} className="whitespace-pre-line"><WordHelp text={paragraph} /></p>)}</div></div>
  </article>
}
