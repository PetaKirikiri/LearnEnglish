import { supabase } from '../lib/supabase'

export type HotelScore = { id: string; name: string; avatarUrl: string | null; rank: number; points: number; answers: number; correct: number; lastActiveAt: string }
export type HotelPeriod = 'today' | 'week' | 'month' | 'all'
type PendingAnswer = { eventId: string; questionId: string; choice: number; assisted: boolean }
const key = (userId: string) => `hotel:answers:v1:${userId}`
function pending(userId: string): PendingAnswer[] {
  const value: unknown = JSON.parse(localStorage.getItem(key(userId)) ?? '[]')
  if (!Array.isArray(value)) throw new Error('Invalid pending scores')
  return value
}
export function queueHotelAnswer(userId: string, questionId: string, choice: number, assisted: boolean) {
  const answers = pending(userId)
  answers.push({ eventId: crypto.randomUUID(), questionId, choice, assisted })
  localStorage.setItem(key(userId), JSON.stringify(answers))
}
const flushing = new Map<string, Promise<void>>()
export function syncHotelAnswers(userId: string): Promise<void> {
  const running = flushing.get(userId)
  if (running) return running
  const task = (async () => {
    // Never replay one account's pending answers using another account's session.
    const { data, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || data.session?.user.id !== userId) throw new Error('Sign in to save scores')
    while (true) {
      const answer = pending(userId)[0]
      if (!answer) return
      const { error } = await supabase.rpc('hotel_record_answer', {
        p_event_id: answer.eventId, p_question_id: answer.questionId, p_choice: answer.choice, p_assisted: answer.assisted,
      }).abortSignal(AbortSignal.timeout(12000))
      if (error) throw error
      // Read again so answers queued during the request are not lost.
      localStorage.setItem(key(userId), JSON.stringify(pending(userId).filter(item => item.eventId !== answer.eventId)))
    }
  })().finally(() => flushing.delete(userId))
  flushing.set(userId, task)
  return task
}
export async function joinHotel() {
  const { error } = await supabase.rpc('hotel_join').abortSignal(AbortSignal.timeout(12000))
  if (error) throw error
}
export async function loadHotelScoreboard(period: HotelPeriod, signal: AbortSignal): Promise<HotelScore[]> {
  const { data, error } = await supabase.rpc('hotel_scoreboard', { p_period: period }).abortSignal(signal)
  if (error) throw error
  return data ?? []
}
