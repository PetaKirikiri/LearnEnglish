import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { publicPracticeUrl } from './publicLinks'

const publicRaceLessonBase = 'https://learn-english-coral.vercel.app/english/race/lesson'
export default function RaceLessonQr({ lesson = 'where-is-the', destination = 'lesson' }: { lesson?: 'where-is-the' | 'where-are-my'; destination?: 'lesson' | 'practice' }) {
  const publicRaceLessonUrl = destination === 'practice' ? publicPracticeUrl : `${publicRaceLessonBase}${lesson === 'where-are-my' ? '?lesson=where-are-my' : ''}`
  const title = destination === 'practice' ? 'สแกนเพื่อฝึก' : 'สแกนเปิดบทเรียน'
  const description = destination === 'practice' ? 'เปิดแบบฝึกบนมือถือ' : 'เปิดบทเรียนบนมือถือ'
  const [qr, setQr] = useState('')
  useEffect(() => {
    let active = true
    void QRCode.toDataURL(publicRaceLessonUrl, { width: 256, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#183c2d', light: '#ffffff' } }).then(value => { if (active) setQr(value) }).catch(() => { /* The direct link remains available. */ })
    return () => { active = false }
  }, [publicRaceLessonUrl])
  return <section className="rl-share" aria-label={description}>
    <div><span className="rl-eyebrow">เรียนไปด้วยกัน</span><h2>{title}</h2><a href={publicRaceLessonUrl}>เปิดบนมือถือ <span aria-hidden="true">↗</span></a></div>
    <a className="rl-share-code" href={publicRaceLessonUrl} aria-label={description}>{qr ? <img src={qr} width="192" height="192" alt={`QR code ${description}`}/> : <span>เปิดบทเรียน ↗</span>}</a>
  </section>
}
