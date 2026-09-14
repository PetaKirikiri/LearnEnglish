import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { thaiTranslations } from '../content/thaiTranslations.generated'

type Hint = { index: number; meaning: string; left: number; top: number; below: boolean }
export default function WordHelp({ text }: { text: string }) {
  const [hint, setHint] = useState<Hint | null>(null)
  const wrapper = useRef<HTMLSpanElement>(null)
  const id = useId()
  const pinned = useRef<number | null>(null)
  function show(element: HTMLElement, index: number, meaning: string) {
    const box = element.getBoundingClientRect()
    setHint({ index, meaning, left: Math.max(12, Math.min(box.left, window.innerWidth - 204)), top: box.top < 90 ? box.bottom + 8 : box.top - 8, below: box.top < 90 })
  }
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!wrapper.current?.contains(event.target as Node)) { setHint(null); pinned.current = null } }
    const dismiss = () => { setHint(null); pinned.current = null }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss() }
    document.addEventListener('pointerdown', outside)
    window.addEventListener('keydown', escape)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', escape); window.removeEventListener('scroll', dismiss, true); window.removeEventListener('resize', dismiss) }
  }, [])
  return <span ref={wrapper}>{text.split(/([A-Za-z]+(?:[’'][A-Za-z]+)?)/g).map((token, index) => {
    const meaning = thaiTranslations[token.toLowerCase()]
    if (!meaning || !/^[A-Za-z]/.test(token)) return token
    const visible = hint?.index === index
    return <span key={index} role="button" tabIndex={0} aria-label={`Help with ${token}`} aria-expanded={visible} aria-describedby={visible ? id : undefined} className="word-token"
      onMouseEnter={event => { if (pinned.current === null) show(event.currentTarget, index, meaning) }} onMouseLeave={() => { if (pinned.current === null) setHint(null) }}
      onFocus={event => { if (event.currentTarget.matches(':focus-visible')) show(event.currentTarget, index, meaning) }} onBlur={() => { setHint(null); pinned.current = null }}
      onClick={event => { if (pinned.current === index) { pinned.current = null; setHint(null) } else { pinned.current = index; show(event.currentTarget, index, meaning) } }}
      onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setHint(null) } if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); if (visible) setHint(null); else show(event.currentTarget, index, meaning) } }}>{token}</span>
  })}{hint && createPortal(<span id={id} role="tooltip" lang="th" style={{ position: 'fixed', left: hint.left, top: hint.top, transform: hint.below ? undefined : 'translateY(-100%)', zIndex: 100 }} className="pointer-events-none w-48 rounded-xl bg-[#182b37] px-3 py-2 text-sm font-normal leading-6 text-white shadow-xl">{hint.meaning}</span>, document.body)}</span>
}
