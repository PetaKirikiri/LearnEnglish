import { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { DocumentEditor } from '../portal/LessonDocument'
import { raceLessonExtensions } from './RaceLessonNodes.ts'
import { connectRaceLesson, type LessonSyncState } from './raceLessonSync'
import RaceLessonQr from './RaceLessonQr'
import './raceLesson.css'
import './raceLocalDocs.css'

const page = { id: 'default', title: 'Teaching', order: 0 }
export default function RaceLessonPage() {
  const [doc] = useState(() => new Y.Doc())
  const [editing, setEditing] = useState(false)
  const [state, setState] = useState<LessonSyncState>({ ready: false, canEdit: false, saving: false, error: '' })
  useEffect(() => connectRaceLesson(doc, setState), [doc])
  useEffect(() => {
    const previous = document.title; document.title = 'Where is the…? · English Success'
    return () => { document.title = previous }
  }, [])
  return <main className="race-lesson" lang="th">
    <header className="rl-header">
      <a href={import.meta.env.DEV ? "/english/preview/learning" : "/english"} className="rl-brand" aria-label="English Success"><img src="/images/fimo/success-wolf-grey-clay.png" alt=""/><span lang="en">ENGLISH<strong>SUCCESS</strong></span></a>
      {state.canEdit && <a className="rl-start" href="/english/race">เข้าห้องแข่ง · QR <span aria-hidden="true">↗</span></a>}
    </header>
    <RaceLessonQr/>
    <div className="rl-document rl-local-docs">
      <div className="rl-doc-toolbar"><span>Teaching</span>{state.canEdit && <button disabled={!state.ready} aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit notes'}</button>}{state.saving && <span role="status">Saving…</span>}</div>
      {state.error && <p role="alert" className="rl-save-error">{state.error}</p>}
      {!state.ready ? <p role="status">กำลังเปิดบทเรียน…</p> : <DocumentEditor doc={doc} page={page} editable={editing && state.canEdit} extensions={raceLessonExtensions}/>}
      {state.canEdit && <footer className="rl-finish"><div><span className="rl-eyebrow">พร้อมแล้ว</span><h2>ไปสนามแข่งกัน</h2></div>{state.canEdit && <a className="rl-start" href="/english/race">เข้าห้องแข่ง · QR <span aria-hidden="true">↗</span></a>}</footer>}
    </div>
  </main>
}
