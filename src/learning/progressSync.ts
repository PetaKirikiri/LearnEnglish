import { supabase } from '../lib/supabase'
import { loadLearningMemory } from './learningMemory'
import { getQuizCatalogue } from './quizContent'
import { questionProgressKey, type ProgressEvent } from './progressData'

const queueKey = (id: string) => `fifa-english:pending-progress:v1:${id}`
const flushing = new Map<string, Promise<void>>()
export type SyncState = 'saved' | 'pending' | 'error'
const states = new Map<string, SyncState>()
export function getSyncState(id: string): SyncState { return states.get(id) ?? 'saved' }
function status(id: string, state: SyncState) {
  states.set(id, state)
  window.dispatchEvent(new Event('fifa-progress-sync'))
}
function pending(id: string): ProgressEvent[] {
  try { return JSON.parse(localStorage.getItem(queueKey(id)) ?? '[]') as ProgressEvent[] } catch { return [] }
}

export function queueProgress(event: ProgressEvent) {
  const queue = pending(event.learner_id)
  if (!queue.some(item => item.id === event.id)) queue.push(event)
  try {
    localStorage.setItem(queueKey(event.learner_id), JSON.stringify(queue))
    status(event.learner_id, 'pending')
    void flushProgress(event.learner_id)
  } catch {
    status(event.learner_id, 'error')
  }
}

export function trackProgress(learnerId: string, kind: ProgressEvent['kind'], payload: ProgressEvent['payload'] = {}, id: string = crypto.randomUUID()) {
  queueProgress({ id, learner_id: learnerId, kind, payload, occurred_at: new Date().toISOString() })
}

export function flushProgress(learnerId: string): Promise<void> {
  const current = flushing.get(learnerId)
  if (current) return current
  const task = (async () => {
    try {
      while (pending(learnerId).length) {
        const { data } = await supabase.auth.getSession()
        if (data.session?.user.id !== learnerId) return
        const batch = pending(learnerId).slice(0, 100)
        const { error } = await supabase.from('fifa_english_events').upsert(batch, { onConflict: 'id', ignoreDuplicates: true })
        if (error) throw error
        const sent = new Set(batch.map(event => event.id))
        localStorage.setItem(queueKey(learnerId), JSON.stringify(pending(learnerId).filter(event => !sent.has(event.id))))
      }
      status(learnerId, 'saved')
    } catch { status(learnerId, 'error') }
  })().finally(() => { flushing.delete(learnerId) })
  flushing.set(learnerId, task)
  return task
}

export async function importLocalProgress(learnerId: string, displayName: string) {
  const marker = `fifa-english:progress-imported:v1:${learnerId}`
  if (localStorage.getItem(marker)) return
  const catalogue = getQuizCatalogue()
  const questions = new Map([...catalogue.vocabulary, ...catalogue.sentences].map(question => [question.id, question]))
  for (const record of Object.values(loadLearningMemory(displayName))) {
    const question = questions.get(record.questionId)
    if (!question) continue
    const key = questionProgressKey(question)
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`legacy:${learnerId}:${key}`))), byte => byte.toString(16).padStart(2, '0')).join('')
    const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
    queueProgress({ id, learner_id: learnerId, kind: 'legacy_import', occurred_at: new Date(record.lastAnsweredAt).toISOString(), payload: { questionId: key, mode: question.mode, correctCount: record.correctCount, wrongCount: record.wrongCount } })
  }
  localStorage.setItem(marker, 'true')
}

export async function loadLearnerEvents(id: string) {
  const events: ProgressEvent[] = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from('fifa_english_events').select('*').eq('learner_id', id).order('occurred_at').order('id').range(offset, offset + 999)
    if (error) throw error
    events.push(...data as ProgressEvent[])
    if (data.length < 1000) return events
  }
}
