import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { DocumentEditor } from '../portal/LessonDocument'
import { raceLessonExtensions } from './RaceLessonNodes.ts'
import { connectRaceLesson, type LessonSyncState } from './raceLessonSync'
import RaceLessonQr from './RaceLessonQr'
import { publicPracticeUrl } from './publicLinks'
import TonightSlots from './TonightSlots'
import RaceWalkthrough from './RaceWalkthrough'
import Icon from '../ui/Icon'
import './raceLesson.css'
import './raceLocalDocs.css'
import './lessonWorkspace.css'

const pluralLesson = new URLSearchParams(window.location.search).get('lesson') === 'where-are-my'
const page = { id: 'default', title: 'Teaching', order: 0 }
export default function RaceLessonPage() {
  const [doc] = useState(() => new Y.Doc())
  const [editing, setEditing] = useState(false)
  const [sharing, setSharing] = useState(false)
  const shareDialog = useRef<HTMLDialogElement>(null)
  const [state, setState] = useState<LessonSyncState>({ ready: false, canEdit: false, saving: false, error: '' })
  useEffect(() => connectRaceLesson(doc, setState, pluralLesson ? 'where-are-my' : 'where-is-the'), [doc])
  useEffect(() => {
    const previous = document.title; document.title = `${pluralLesson ? 'Where are my…?' : 'Where is the…?'} · English Success`
    return () => { document.title = previous }
  }, [])
  useEffect(() => {
    if (sharing && !shareDialog.current?.open) shareDialog.current?.showModal()
    if (!sharing && shareDialog.current?.open) shareDialog.current?.close()
  }, [sharing])
  return <main className="race-lesson lesson-workspace" lang="th">
    <aside className="lw-sidebar">
      <a href={import.meta.env.DEV ? '/english/preview/learning' : '/english'} className="lw-brand" aria-label="English Success"><span className="lw-brand-mark"><Icon name="book"/></span><span lang="en">ENGLISH<strong>SUCCESS</strong></span></a>
      <div className="lw-nav-label">บทเรียน</div>
      <nav className="lw-lessons" aria-label="บทเรียน">
        <a href="/english/race/lesson" aria-current={!pluralLesson ? 'page' : undefined}><span className="lw-lesson-number">01</span><span><strong lang="en">Where is the…?</strong><small>26 Oct</small></span><Icon name="arrow"/></a>
        <a href="/english/race/lesson?lesson=where-are-my" aria-current={pluralLesson ? 'page' : undefined}><span className="lw-lesson-number">02</span><span><strong lang="en">Where are my…?</strong><small>27 Oct</small></span><Icon name="arrow"/></a>
      </nav>
      {state.canEdit && <a className="lw-race-link" href="/english/race"><Icon name="flag"/><span>ห้องแข่ง</span><Icon name="arrow"/></a>}
    </aside>
    <div className="lw-main">
      <header className="lw-toolbar"><span><Icon name="book"/>สมุดบทเรียน <span className="lw-crumb">/ {pluralLesson ? '02' : '01'}</span></span><button className="lw-share-button" onClick={() => setSharing(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h-3zM21 14v4m-4 3h4M12 3v2M3 12h3m6-3v4h4M9 12v3m3 3v3"/></svg>เปิดบนมือถือ</button></header>
      <div className="lw-content">
      {!pluralLesson && <a className="lw-guide-jump" href="#race-guide">ก่อนแข่ง · หน้าจอมือถือและตัวอย่างคำถาม ↓</a>}
      <header className="lw-lesson-hero">
        <div className="lw-hero-copy"><span className="lw-lesson-meta">บทเรียน {pluralLesson ? '02' : '01'}<i/> {pluralLesson ? '27' : '26'} Oct</span><h1 lang="en">{pluralLesson ? 'Where are my…?' : 'Where is the…?'}</h1><p>{pluralLesson ? 'ของฉันอยู่ที่ไหน?' : 'อยู่ที่ไหน?'}</p><span className="lw-hero-caption">{pluralLesson ? 'จากสิ่งเดียว → หลายสิ่ง · ของฉัน → ของคุณ' : 'รูปแบบเดียว · ใช้ถามหาได้หลายที่'}</span></div>
        <div className="lw-guide"><span aria-hidden="true"/><img src="/images/fimo/success-wolf-grey-clay.png" alt=""/></div>
      </header>
      {!pluralLesson && <section className="lw-builder" aria-label="ลองสร้างประโยค"><div className="lw-section-heading"><h2>ลองสร้างประโยค</h2><a className="lw-practice" href={publicPracticeUrl}><Icon name="play"/>ฝึกตอบคำถาม<Icon name="arrow"/></a></div><TonightSlots/></section>}
      <section className={`rl-document rl-local-docs lw-notes${editing ? ' is-editing' : ''}`} aria-label="เนื้อหาบทเรียน">
      <div className="rl-doc-toolbar"><h2>เนื้อหาบทเรียน</h2>{state.canEdit && <button disabled={!state.ready} aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit notes'}</button>}{state.saving && <span role="status">Saving…</span>}</div>
      {state.error && <p role="alert" className="rl-save-error">{state.error}</p>}
      {!state.ready ? <p role="status">กำลังเปิดบทเรียน…</p> : <DocumentEditor doc={doc} page={page} editable={editing && state.canEdit} extensions={raceLessonExtensions}/>}
      </section>
      {!pluralLesson && <RaceWalkthrough/>}
      </div>
    </div>
    <dialog className="lw-share-dialog" ref={shareDialog} onClose={() => setSharing(false)} aria-label="เปิดบทเรียนบนมือถือ"><button className="lw-dialog-close" onClick={() => setSharing(false)} aria-label="ปิด"><Icon name="close"/></button>{sharing && <RaceLessonQr lesson={pluralLesson ? 'where-are-my' : 'where-is-the'} destination={pluralLesson ? 'lesson' : 'practice'}/>}</dialog>
  </main>
}
