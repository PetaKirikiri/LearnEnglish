import {expect,it} from 'vitest'
import {cityInvitation} from './invitation'
it('shares a room-specific LIFF controller link without room credentials',()=>{
 const result=cityInvitation('https://example.com','123456','123-abc')
 expect(result.joinUrl).toBe('https://liff.line.me/123-abc/english/city/controller?room=123456')
 const text=new URL(result.shareUrl).searchParams.get('text')
 expect(text).toContain(result.joinUrl)
 expect(text).not.toContain('token')
})
it('keeps a direct controller link when LIFF is not configured',()=>{
 expect(cityInvitation('http://localhost:5186/','123456').joinUrl).toBe('http://localhost:5186/english/city/controller?room=123456')
})
