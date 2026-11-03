import {describe,it,expect,vi} from 'vitest'
vi.mock('../lib/supabase',()=>({supabase:{rpc:vi.fn()}}))
import {classroomJoinUrl,classroomSessionId} from './session'
describe('classroom links',()=>{
 it('always joins the public site',()=>expect(classroomJoinUrl('room')).toBe('https://learn-english-coral.vercel.app/english/practice?class=room'))
 it('retains the class through LINE deep linking',()=>expect(classroomSessionId('?liff.state='+encodeURIComponent('?class=room'))).toBe('room'))
})
