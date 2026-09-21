import { useEffect, useMemo, useState } from 'react'
import { getQuizCatalogue } from './quizContent'
import { loadLearnerEvents, pending } from './progressSync'
import type { ProgressEvent } from './progressData'
import { buildWordCollection } from './wordCollection'

const cacheKey = (id: string) => `englishsuccess:collection-events:v1:${id}`
function cached(id: string): ProgressEvent[] | null {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(cacheKey(id)) ?? 'null')
    return Array.isArray(data) ? data.filter(e => e && e.learner_id === id && e.payload && typeof e.id === 'string') : null
  } catch { return null }
}
function merge(id: string, ...batches: readonly ProgressEvent[][]) {
  return [...new Map(batches.flat().filter(e => e.learner_id === id && (e.kind === 'answer' || e.kind === 'legacy_import')).map(e => [e.id, e])).values()]
}
// Mounted under QuizPage's userId key, so one account never inherits another's state.
export function useWordCollection(userId: string) {
  const [snapshot, setSnapshot] = useState(() => {
    const data = cached(userId)
    return { events: merge(userId, data ?? [], pending(userId)), ready: data !== null, now: Date.now() }
  })
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    let loading = false
    function recorded(event: Event) {
      const answer = (event as CustomEvent<ProgressEvent>).detail
      if (answer.learner_id !== userId || (answer.kind !== 'answer' && answer.kind !== 'legacy_import')) return
      setSnapshot(current => ({ ...current, events: merge(userId, current.events, [answer]), now: Date.now() }))
    }
    async function refresh() {
      if (loading) return
      loading = true
      try {
        const events = await loadLearnerEvents(userId)
        if (active) {
          setSnapshot(current => ({ events: merge(userId, current.events, events, pending(userId)), ready: true, now: Date.now() }))
          setError(false)
        }
      } catch { if (active) setError(true) }
      finally { loading = false }
    }
    window.addEventListener('fifa-progress-recorded', recorded)
    window.addEventListener('online', refresh)
    window.addEventListener('focus', refresh)
    void refresh()
    return () => {
      active = false
      window.removeEventListener('fifa-progress-recorded', recorded)
      window.removeEventListener('online', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [userId])
  useEffect(() => {
    if (snapshot.ready) {
      try { localStorage.setItem(cacheKey(userId), JSON.stringify(snapshot.events)) } catch { /* The server and upload queue remain authoritative. */ }
    }
  }, [snapshot, userId])
  const collection = useMemo(() => {
    const bank = getQuizCatalogue()
    return buildWordCollection(snapshot.events, [...bank.vocabulary, ...bank.sentences], snapshot.now)
  }, [snapshot])
  return { collection, ready: snapshot.ready, error }
}
