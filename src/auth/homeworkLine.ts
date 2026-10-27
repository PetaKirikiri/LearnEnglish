import { supabase } from '../lib/supabase'

export const homeworkLiffId = import.meta.env.VITE_ENGLISH_LIFF_ID?.trim() || '2010311582-ziuNvGjb'
export function homeworkLineUrl(lesson: number) {
  if (!homeworkLiffId) return null
  return `https://liff.line.me/${homeworkLiffId}?lesson=${lesson === 2 ? 2 : 1}`
}
let pending: Promise<string | null> | null = null
export function recogniseHomeworkAccount(register = false): Promise<string | null> {
  if (pending) return pending
  pending = connect(register).finally(() => { pending = null })
  return pending
}
async function connect(register: boolean) {
  // LINE restores deep-link parameters during init, even for signed-in learners.
  let line: (typeof import('@line/liff'))['default'] | undefined
  if (new URLSearchParams(window.location.search).has('liff.state')) {
    line = (await import('@line/liff')).default
    await line.init({ liffId: homeworkLiffId, withLoginOnExternalBrowser: false })
  }
  const { data: current } = await supabase.auth.getSession()
  if (current.session) {
    const { data, error } = await supabase.auth.getUser()
    if (!error && data.user) return data.user.id
    throw new Error('กรุณาเปิดลิงก์จาก LINE อีกครั้ง')
  }
  if (!homeworkLiffId) throw new Error('ยังเชื่อมต่อ LINE ไม่ได้ กรุณาลองอีกครั้งภายหลัง')
  const liff = line ?? (await import('@line/liff')).default
  if (!line) await liff.init({ liffId: homeworkLiffId, withLoginOnExternalBrowser: false })
  const token = liff.getIDToken()
  // Never invoke browser/password login or send learners through another site.
  if (!token) throw new Error('กรุณาเปิดลิงก์บทเรียนจาก LINE')
  const { data, error } = await supabase.functions.invoke(register ? 'line-liff-auth' : 'line-liff-recognize', {
    body: register ? { id_token: token, access_token: liff.getAccessToken() } : { id_token: token },
    signal: AbortSignal.timeout(15000),
  })
  if (error || data?.error) throw new Error('เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง')
  if (!register && data?.recognised === false) return connect(true)
  if (!data?.access_token || !data?.refresh_token) throw new Error('เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง')
  const result = await supabase.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token})
  if (result.error || !result.data.user) throw new Error('เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง')
  return result.data.user.id
}

export function homeworkDestination(search = window.location.search) {
  const query = new URLSearchParams(search)
  const state = query.get('liff.state')
  const nested = new URLSearchParams(state?.includes('?') ? state.slice(state.indexOf('?') + 1) : state ?? '')
  return query.get('view') === 'scoreboard' || nested.get('view') === 'scoreboard' ? 'scoreboard' : 'practice'
}
