import { memo, useCallback, useDeferredValue, useMemo, useRef, useState } from 'react'
import { isFlagged, parseDecisions, reviewStorageKey, sentenceReview, type ReviewArea, type ReviewDecision, type ReviewSentence } from './sentenceReviewCatalogue'
import './sentenceReview.css'

function FlagIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 21V4m0 0c5-5 9 5 14 0v10c-5 5-9-5-14 0" /></svg>
}

type Decide = (id: string, change: Partial<Pick<ReviewDecision, 'flagged' | 'note'>>) => void
const SentenceRow = memo(function SentenceRow({ row, decision, onDecide }: {row: ReviewSentence; decision?: ReviewDecision; onDecide: Decide}) {
  const [expanded, setExpanded] = useState(false)
  const flagged = decision?.flagged ?? row.issues.length > 0
  const primary = row.uses[0]
  const current = row.uses.some(use => use.area !== 'excluded')
  const intentional = row.uses.every(use => use.intentionalIncorrect)
  return <li id={`sentence-${row.position}`} value={row.position} className={`sr-row${flagged ? ' sr-flagged' : ''}`}>
    <a className="sr-number" href={`#sentence-${row.position}`} aria-label={`Sentence ${row.position}`}>{String(row.position).padStart(3, '0')}</a>
    <div className="sr-sentence">
      <div className="sr-provenance"><span>{primary.source}</span>{row.uses.length > 1 && <span>+{row.uses.length - 1} uses</span>}{!current && <b>Not in current decks</b>}{intentional && <b>Intentionally incorrect example</b>}</div>
      <h2>{row.english}</h2>
      <p className="sr-answer"><span>{primary.task}</span><span lang="th">✓ {primary.choices[primary.correct]}</span></p>
      {!!row.issues.length && <ul className={`sr-reasons${!flagged ? ' sr-dismissed' : ''}`}>{row.issues.map(issue => <li key={issue.code}><b>{issue.kind === 'scope' ? 'Untaught' : issue.kind === 'answer' ? 'Answers' : 'Context'}</b>{issue.reason}</li>)}</ul>}
      <div className="sr-row-tools">
        <span className="sr-decision">{decision ? (flagged ? 'Flagged by you' : 'Unflagged by you') : flagged ? 'Suggested flag' : ''}</span>
        <button className="sr-details-toggle" aria-expanded={expanded} aria-controls={`details-${row.position}`} onClick={() => setExpanded(value => !value)}>{expanded ? '−' : '+'} Answers, sources & note</button>
        {!!decision?.note && !expanded && <span className="sr-note-preview">{decision.note}</span>}
      </div>
      {expanded && <div className="sr-details" id={`details-${row.position}`}>
        <label className="sr-note">Your note<textarea aria-label={`Note for sentence ${row.position}`} value={decision?.note ?? ''} placeholder="What needs checking?" onChange={event => onDecide(row.id, {note: event.target.value})} /></label>
        {row.uses.map(use => <section className="sr-source" key={`${use.source}:${use.questionId}`}>
          <h3>{use.source} <span>· Question {use.position}</span></h3>
          <p>{use.task}{use.intentionalIncorrect ? ' · Incorrect on purpose' : ''}</p>
          <ol>{use.choices.map((answer, i) => <li key={i} className={use.correct === i ? 'sr-correct' : ''}>{use.correct === i && <span aria-label="Correct answer">✓ </span>}<span lang="th">{answer || '(empty answer)'}</span></li>)}</ol>
          {use.audioUrl && <audio controls preload="none" src={use.audioUrl} aria-label={`Audio for ${row.english}`} />}
          <small>{use.questionId}</small>
        </section>)}
      </div>}
    </div>
    <button className="sr-flag-button" aria-label={`${flagged ? 'Unflag' : 'Flag'} sentence ${row.position}`} aria-pressed={flagged} onClick={() => onDecide(row.id, {flagged: !flagged})}><FlagIcon /><span>{flagged ? 'Flagged' : 'Flag'}</span></button>
  </li>
})

function readDecisions() {
  try { return parseDecisions(localStorage.getItem(reviewStorageKey)) } catch { return {} }
}

export default function SentenceReviewPage() {
  const [decisions, setDecisions] = useState(readDecisions)
  const decisionsRef = useRef(decisions)
  const [storageError, setStorageError] = useState(false)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [area, setArea] = useState<ReviewArea | ''>('')
  const [source, setSource] = useState('')
  const [status, setStatus] = useState('all')
  const sources = useMemo(() => [...new Set(sentenceReview.flatMap(row => row.uses.filter(use => !area || use.area === area).map(use => use.source)))], [area])
  const flaggedCount = sentenceReview.filter(row => isFlagged(row, decisions)).length
  const currentCount = sentenceReview.filter(row => row.uses.some(use => use.area !== 'excluded')).length
  const visible = useMemo(() => {
    const query = deferredSearch.toLowerCase().trim()
    return sentenceReview.filter(row => {
      if (!row.uses.some(use => (!area || use.area === area) && (!source || use.source === source))) return false
      if (status === 'flagged' && !isFlagged(row, decisions)) return false
      if (status === 'unflagged' && isFlagged(row, decisions)) return false
      if (status === 'mine' && !decisions[row.id]) return false
      return !query || [row.english, ...row.uses.flatMap(use => use.choices), ...row.issues.map(issue => issue.reason), decisions[row.id]?.note ?? ''].some(value => value.toLowerCase().includes(query))
    })
  }, [deferredSearch, area, source, status, decisions])
  const onDecide = useCallback<Decide>((id, change) => {
    const latest = {...decisionsRef.current, ...readDecisions()}
    const row = sentenceReview.find(item => item.id === id)!
    const next = {...latest, [id]: {...(latest[id] ?? {flagged: row.issues.length > 0, note: ''}), ...change, updatedAt: new Date().toISOString()}}
    decisionsRef.current = next
    setDecisions(next)
    try { localStorage.setItem(reviewStorageKey, JSON.stringify(next)); setStorageError(false) } catch { setStorageError(true) }
  }, [])
  function exportReview() {
    const body = {exportedAt: new Date().toISOString(), coverage: 'Bundled EnglishSuccess practice, classroom and registered race pools; excluded recordings listed last.', sentences: sentenceReview.map(row => ({...row, flagged: isFlagged(row, decisions), decision: decisions[row.id] ?? null}))}
    const url = URL.createObjectURL(new Blob([JSON.stringify(body, null, 2)], {type: 'application/json'}))
    const link = document.createElement('a')
    link.href = url; link.download = `sentence-review-${new Date().toISOString().slice(0,10)}.json`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <main className="sentence-review">
    <header className="sr-header"><div><span className="sr-brand">SUCCESS UNIVERSITY</span><h1>Sentence review</h1></div><button className="sr-export" onClick={exportReview}>Export review ↓</button></header>
    <div className="sr-summary"><span><strong>{sentenceReview.length.toLocaleString()}</strong> sentences</span><span className="sr-summary-flag"><FlagIcon /><strong>{flaggedCount}</strong> flagged</span><span><strong>{currentCount}</strong> in current decks</span><span><strong>{sentenceReview.length - currentCount}</strong> excluded / not selected</span></div>
    <div className="sr-intro"><p>In course order. Suspect sentences stay in place. Flag or unflag any sentence.</p><details><summary>What’s included</summary><p>Practice levels 1–6, classroom lessons 1–4 and every registered race pool. Excluded recordings follow at the end. Repeated English appears once; expand it to see every source and its original question number. Each learner’s adaptive question order can differ.</p><p>Flags identify things to review, not proof that a sentence is always wrong. Deliberately incorrect grammar exercises are labelled. This page reads the bundled content, not additional live database questions. Changing a flag does not remove a question from the app.</p></details></div>
    <div className="sr-filters">
      <label className="sr-search">Search<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="English, Thai or review note" /></label>
      <label>Area<select value={area} onChange={event => {setArea(event.target.value as ReviewArea | ''); setSource('')}}><option value="">All areas</option><option value="practice">Student practice</option><option value="classroom">Classroom</option><option value="race">Horse race</option><option value="excluded">Excluded / not selected</option></select></label>
      <label>Course / pool<select value={source} onChange={event => setSource(event.target.value)}><option value="">All courses & pools</option>{sources.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>Show<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">Every sentence</option><option value="flagged">Flagged only</option><option value="unflagged">Unflagged only</option><option value="mine">My decisions</option></select></label>
    </div>
    {storageError && <p role="alert" className="sr-storage-error">Your browser could not save this change. Export the review to keep it.</p>}
    <p className="sr-results" aria-live="polite">{visible.length.toLocaleString()} sentences · original order</p>
    <ol className="sr-list">{visible.map(row => <SentenceRow key={row.id} row={row} decision={decisions[row.id]} onDecide={onDecide} />)}</ol>
    {!visible.length && <p className="sr-empty">No sentences match these filters.</p>}
  </main>
}
