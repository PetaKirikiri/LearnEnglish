import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

const publicRaceLessonUrl = 'https://learn-english-coral.vercel.app/english/race/lesson'
export default function RaceLessonQr() {
  const [qr, setQr] = useState('')
  useEffect(() => {
    let active = true
    void QRCode.toDataURL(publicRaceLessonUrl, { width: 256, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#183c2d', light: '#ffffff' } }).then(value => { if (active) setQr(value) }).catch(() => { /* The direct link remains available. */ })
    return () => { active = false }
  }, [])
  return <section className="rl-share" aria-label="เปิดบทเรียนบนมือถือ">
    <div><span className="rl-eyebrow">เรียนไปด้วยกัน</span><h2>สแกนเปิดบทเรียน</h2><a href={publicRaceLessonUrl}>เปิดบนมือถือ <span aria-hidden="true">↗</span></a></div>
    <a className="rl-share-code" href={publicRaceLessonUrl} aria-label="เปิดบทเรียน Where is the บนเว็บไซต์ English Success">{qr ? <img src={qr} width="192" height="192" alt="QR code เปิดบทเรียนบนมือถือ"/> : <span>เปิดบทเรียน ↗</span>}</a>
  </section>
}
