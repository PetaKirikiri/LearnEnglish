import { useEffect, useRef, useState } from 'react'
import { HOST_KEY, raceRequest, useRaceConnection } from './connection'
import { racePools } from './pools'
import { holidayNouns, holidayWordFor } from './holidayQuestions'
import { meaningChoices } from './meaningChoices'
import type { RaceCredential, RaceView } from './types'
import './raceAdmin.css'

const DRAFT_KEY = 'english-race:next-content'
type Selection = { stage: string; questionIds: string[] }
function initialSelection(): Selection {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') as Selection | null
    const pool = racePools.find(p => p.id === saved?.stage)
    if (pool && Array.isArray(saved?.questionIds)) return { stage: pool.id, questionIds: saved.questionIds.filter(id => pool.questions.some(q => q.id === id)) }
  } catch { /* Use tonight's starting set. */ }
  const pool = racePools.find(p => p.id === 'where-is-the')!
  return { stage: pool.id, questionIds: pool.questions.map(q => q.id) }
}

export default function RaceAdminPage() {
  const { credentials, view, connection, sync, remember, forget } = useRaceConnection(HOST_KEY)
  const [selection, setSelection] = useState(initialSelection)
  const [canHost, setCanHost] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const actionLock = useRef(false)
  const loadedRoom = useRef('')
  const edited = useRef(false)
  const audio = useRef<HTMLAudioElement>(null)
  const pool = racePools.find(p => p.id === selection.stage)!
  const judgement = pool.kind === 'judgement'
  const holidayWords = pool.id === 'where-is-the' || pool.id === 'holiday-meaning'
  const questions = pool.questions.filter(q => selection.questionIds.includes(q.id))
  const valid = judgement ? questions.some(q => q.correct === 0) && questions.some(q => q.correct === 1) : pool.kind === 'meaning' ? questions.length >= 2 : questions.length === 2
  const previews = valid ? meaningChoices(questions.map(q => ({ id: q.id, choices: q.answers.map(a => a.map(s => s.text).join('')), correct: q.correct }))) : []
  const racing = view?.phase === 'answering'
  useEffect(() => {
    let active = true
    void raceRequest<{ canHost: boolean }>('config').then(config => { if (active) setCanHost(config.canHost) }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!view || loadedRoom.current === view.id) return
    loadedRoom.current = view.id
    const currentPool = racePools.find(p => p.id === view.stageId)
    if (!currentPool || edited.current) return
    const available = new Set(currentPool.questions.map(q => q.id))
    const next = { stage: currentPool.id, questionIds: (view.questionIds ?? [...available]).filter(id => available.has(id)) }
    setSelection(next)
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
  }, [view])
  function select(next: Selection) { edited.current = true; setSelection(next); localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); setError(''); setSaved(false) }
  function selectPool(id: string) {
    const next = racePools.find(p => p.id === id)!
    const words = new Set(questions.map(q => holidayWordFor(q.id)).filter(Boolean))
    const sameWords = holidayWords && (next.id === 'holiday-meaning' || next.id === 'where-is-the')
    select({ stage: id, questionIds: next.questions.filter(q => !sameWords || words.has(holidayWordFor(q.id))).map(q => q.id) })
  }
  function toggle(ids: string[]) {
    const remove = ids.every(id => selection.questionIds.includes(id))
    select({ ...selection, questionIds: remove ? selection.questionIds.filter(id => !ids.includes(id)) : [...new Set([...selection.questionIds, ...ids])] })
  }
  async function saveSettings() {
    if (actionLock.current) return
    actionLock.current = true; setBusy(true); setError(''); setSaved(false)
    try {
      const body = { stage: selection.stage, questionIds: selection.questionIds }
      if (!credentials) remember(await raceRequest<RaceCredential>('create', null, body))
      else if (view) sync(await raceRequest<RaceView>('prepare', credentials, { ...body, run: view.run }))
      else return
      setSaved(true)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update the race.') }
    finally { actionLock.current = false; setBusy(false) }
  }
  function previewAudio(url?: string) {
    if (!audio.current || !url) return
    audio.current.src = url
    void audio.current.play().catch(() => setError('The audio could not play. Try again.'))
  }
  return <main className="race-admin">
    <audio ref={audio}/>
    <header className="race-admin-header">
      <h1>Race settings</h1>
      <a href="/english/race/lesson">← Lesson notes</a>
      <a href="/english/race">Open race · QR ↗</a>
    </header>
    {(error || connection) && <div role="alert" className="race-admin-error">{error || connection}{connection && <button onClick={forget}>Open a new classroom</button>}</div>}
    {canHost === false && !credentials && <p className="race-admin-error">Open this page on the teacher’s laptop.</p>}
    <section className="race-admin-content" aria-label="Next race settings">
        <fieldset className="race-admin-types"><legend>Answer type</legend>
          <label><input type="radio" name="answer-type" checked={judgement} onChange={() => selectPool('where-is-the')}/><strong>Correct or wrong</strong></label>
          <label><input type="radio" name="answer-type" checked={!judgement} onChange={() => selectPool('holiday-meaning')}/><strong>Choose the meaning</strong></label>
        </fieldset>
        <label className="race-admin-select">Content<select value={pool.id} onChange={e => selectPool(e.target.value)}>{racePools.filter(p => (p.kind === 'judgement') === judgement).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
        {holidayWords && <fieldset className="race-admin-words"><legend>Words</legend>{holidayNouns.map(noun => {
          const ids = pool.questions.filter(q => holidayWordFor(q.id) === noun).map(q => q.id)
          return <label key={noun}><input type="checkbox" checked={ids.every(id => selection.questionIds.includes(id))} onChange={() => toggle(ids)}/>{noun}</label>
        })}</fieldset>}
        <details className="race-admin-questions" open={!holidayWords}>
          <summary>Questions <span>{questions.length}</span></summary>
          <div>{pool.questions.map(q => <article key={q.id}>
            {(holidayWords || pool.id === 'tonight-slots') && <input type="checkbox" aria-label={`Include ${q.english}`} checked={selection.questionIds.includes(q.id)} onChange={() => toggle([q.id])}/>}
            <div><strong>{q.english}</strong><span>{pool.kind === 'meaning' ? previews.find(p => p.id === q.id)?.choices.join(' · ') ?? q.answers[q.correct].map(s => s.text).join('') : q.answers[q.correct].map(s => s.text).join('')}</span>
              {pool.kind === 'meaning' && valid && selection.questionIds.includes(q.id) && q.meaningDistractor && <span className="race-admin-curveball">{q.answers[q.correct].map(s => s.text).join('')} · {q.meaningDistractor}</span>}
            </div>
            {q.audioUrl && <button type="button" aria-label={`Play ${q.english}`} onClick={() => previewAudio(q.audioUrl)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 9 4 0 5-4v14l-5-4H4zm12-2c4 3 4 7 0 10m3-13c6 5 6 11 0 16"/></svg></button>}
          </article>)}</div>
        </details>
        {!valid && <p className="race-admin-validation">{judgement ? 'Include at least one correct and one wrong sentence.' : 'Choose at least two words for the two answers.'}</p>}
        {racing && <p className="race-admin-note">Finish the current race before applying changes.</p>}
        <footer className="race-admin-actions">
          <button className="race-admin-primary" disabled={busy || !valid || !!racing || !!connection || (credentials ? !view : canHost !== true)} onClick={() => void saveSettings()}>{busy ? 'Saving…' : 'Done'}</button>
          {saved && <span role="status">Updated</span>}
        </footer>
    </section>
  </main>
}
