import { useEffect, useState } from 'react'
import { loadLearnerEvents } from './progressSync'
import { summarizeProgress, questionProgressKey } from './progressData'
import { getQuizCatalogue } from './quizContent'
const catalogue = getQuizCatalogue()
export default function LearningJourney({ userId, syncState }: { userId: string; syncState: string }) {
  const [counts, setCounts] = useState<{ words: number; sentences: number } | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    void loadLearnerEvents(userId).then(events => {
      if (!active) return
      const summary = summarizeProgress(events)
      const count = (mode: 'vocabulary' | 'sentences') => catalogue[mode].filter(q => summary.items.get(questionProgressKey(q))?.status === 'Learned').length
      setCounts({ words: count('vocabulary'), sentences: count('sentences') }); setError(false)
    }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [userId, syncState])
  const goal = counts ? Math.min(catalogue.vocabulary.length, (Math.floor(counts.words / 10) + 1) * 10) : 10
  return <section aria-label="Your learning progress" className="journey-panel">
    <div className="journey-heading"><h2>Progress</h2><span>Learned</span></div>
    <div className="journey-stats"><div className="journey-number"><strong>{counts?.words ?? '—'}</strong><span>Words</span></div><div className="journey-number"><strong>{counts?.sentences ?? '—'}</strong><span>Sentences</span></div><div className="journey-milestone"><div><span>{counts?.words === catalogue.vocabulary.length ? 'Words complete' : 'Next milestone'}</span><strong>{goal} words</strong></div><div role="progressbar" aria-label="Words learned toward next milestone" aria-valuenow={counts?.words ?? 0} aria-valuemin={0} aria-valuemax={goal} className="journey-track"><div style={{ width: `${counts ? counts.words / goal * 100 : 0}%` }} /></div></div></div>
    <p role="status" className={error || !counts ? 'journey-status' : 'sr-only'}>{error ? 'Progress unavailable · try again later' : !counts ? 'Loading saved progress…' : 'Learned across three successful rounds'}</p>
  </section>
}
