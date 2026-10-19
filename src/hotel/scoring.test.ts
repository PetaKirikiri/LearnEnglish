// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from 'vitest'
const api = vi.hoisted(() => ({ request: vi.fn(), session: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: {
  auth: { getSession: api.session },
  rpc: (...args: unknown[]) => ({ abortSignal: () => api.request(...args) }),
} }))
import { queueHotelAnswer, syncHotelAnswers, createListeningScoring } from './scoring'
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); api.request.mockResolvedValue({ error: null }); api.session.mockResolvedValue({ data: { session: { user: { id: 'alice' } } } }) })
it('sends the selected option, not client-computed points or correctness', async () => {
  queueHotelAnswer('alice','hotel-1',1,true)
  await syncHotelAnswers('alice')
  expect(api.request).toHaveBeenCalledWith('hotel_record_answer',expect.objectContaining({ p_question_id: 'hotel-1', p_choice: 1, p_assisted: true }))
  expect(Object.keys(api.request.mock.calls[0][1])).toEqual(['p_event_id','p_question_id','p_choice','p_assisted'])
  expect(JSON.parse(localStorage.getItem('hotel:answers:v1:alice')!)).toEqual([])
})
it('retains failed answers and retries with the same event ID', async () => {
  queueHotelAnswer('alice','hotel-1',0,false)
  api.request.mockResolvedValueOnce({ error: new Error('Offline') })
  await expect(syncHotelAnswers('alice')).rejects.toThrow('Offline')
  const first = api.request.mock.calls[0][1].p_event_id
  await syncHotelAnswers('alice')
  expect(api.request.mock.calls[1][1].p_event_id).toBe(first)
})
it('never uploads another signed-in account’s queue', async () => {
  queueHotelAnswer('bob','hotel-1',0,false)
  await expect(syncHotelAnswers('bob')).rejects.toThrow('Sign in')
  expect(api.request).not.toHaveBeenCalled()
  expect(JSON.parse(localStorage.getItem('hotel:answers:v1:bob')!)).toHaveLength(1)
})
it('serializes sync and includes answers queued during a request', async () => {
  queueHotelAnswer('alice','hotel-1',0,false)
  api.request.mockImplementationOnce(async () => { queueHotelAnswer('alice','hotel-2',1,false); return { error: null } })
  await Promise.all([syncHotelAnswers('alice'),syncHotelAnswers('alice')])
  expect(api.request).toHaveBeenCalledTimes(2)
})
it('keeps English queues, joining and scoreboard requests separate from Hotel', async () => {
  const english = createListeningScoring('english')
  queueHotelAnswer('alice','hotel-g2-roles-1-1',0,false)
  english.queue('alice','hotel-g3-general-role-1',1,false)
  await english.join()
  await english.sync('alice')
  await english.load('week',new AbortController().signal)
  expect(api.request.mock.calls.map(c=>c[0])).toEqual(['english_join','english_record_answer','english_scoreboard'])
  expect(JSON.parse(localStorage.getItem('hotel:answers:v1:alice')!)).toHaveLength(1)
  expect(JSON.parse(localStorage.getItem('english:answers:v1:alice')!)).toEqual([])
})
