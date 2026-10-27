// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import QRCode from 'qrcode'
import RaceLessonQr from './RaceLessonQr'
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,cXI=') } }))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
it('shares the public practice address from a local teacher page, in both QR and links', async () => {
  const host = document.createElement('div'), root = createRoot(host)
  try {
    await act(async () => root.render(<RaceLessonQr destination="practice"/>))
    const url = 'https://learn-english-coral.vercel.app/english/practice'
    expect(QRCode.toDataURL).toHaveBeenCalledWith(url, expect.any(Object))
    expect([...host.querySelectorAll('a')].map(a => a.href)).toEqual([url, url])
    expect(host.querySelector('img')?.alt).toContain('แบบฝึก')
    await act(async () => root.render(<RaceLessonQr lesson="where-are-my"/>))
    expect(host.querySelector('a')?.href).toBe('https://learn-english-coral.vercel.app/english/race/lesson?lesson=where-are-my')
  } finally { await act(async () => root.unmount()) }
})
