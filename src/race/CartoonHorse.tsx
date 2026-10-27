import type { CSSProperties } from 'react'
import './cartoonHorse.css'

/** Discrete illustrated poses: playback changes the legs, not just the whole image position. */
export default function CartoonHorse({ speed = 8, paused = false, powered = false }: { speed?: number; paused?: boolean; powered?: boolean }) {
  return <span className={`cartoon-horse${powered ? ' is-powered' : ''}${paused ? ' is-paused' : ''}`} role="img" aria-label={powered ? 'Golden powered-up running horse' : 'Cartoon running horse'} style={{ '--gallop-duration': `${Math.max(.48, 1.1 - Math.max(0, speed) * .026)}s` } as CSSProperties}>
    <span className="cartoon-horse-frames" />
  </span>
}
