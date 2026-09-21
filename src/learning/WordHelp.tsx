import { useContext, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { thaiTranslations } from '../content/languageData'
import { normalizeHelpWord } from './helpPoints'
import Icon from '../ui/Icon'
import { AuthContext } from '../auth/authContext'
import WordDetails from './wordInfo/WordDetails'
import WordConfidence from './wordInfo/WordConfidence'

export default function WordHelp({ text, onHelp, onOpenChange, pointsRemaining }: {
  text: string
  onHelp?: (word: string) => void
  onOpenChange?: (open: boolean) => void
  pointsRemaining?: number
}) {
  const auth = useContext(AuthContext)
  const [hint, setHint] = useState<{ word: string; meaning?: string } | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const trigger = useRef<HTMLElement | null>(null)
  function close() {
    dialog.current?.close()
    setHint(null)
    onOpenChange?.(false)
    trigger.current?.focus()
  }
  function open(word: string, element: HTMLElement) {
    const normalized = normalizeHelpWord(word)
    const meaning = thaiTranslations[normalized]
    trigger.current = element
    // Unknown words still have a token, but no charge for missing information.
    if (meaning) onHelp?.(normalized)
    setHint({ word, meaning })
    onOpenChange?.(true)
    dialog.current?.showModal()
  }
  return <span>{text.split(/([\p{L}]+(?:[’'][\p{L}]+)*)/gu).map((token, index) => {
    if (!/^\p{L}/u.test(token)) return token
    return <span key={index} role="button" tabIndex={0} aria-label={`Help with ${token}`} aria-haspopup="dialog" className="word-token"
      onClick={event => open(token, event.currentTarget)}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); open(token, event.currentTarget) } }}>{token}</span>
  })}{createPortal(<dialog ref={dialog} className="word-help-dialog" aria-labelledby={titleId}
    onKeyDown={event => event.stopPropagation()}
    onCancel={event => { event.preventDefault(); close() }}
    onClick={event => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close() } }}>
    <header className="word-help-header"><h2 id={titleId} lang="en">{hint?.word}</h2><button type="button" aria-label="Close word help" onClick={close} className="icon-button"><Icon name="close" /></button></header>
    {hint && auth?.user?.id && <WordConfidence key={`${auth.user.id}:${hint.word}`} userId={auth.user.id} word={hint.word} />}
    <div className="word-help-scroll">
      <p className="word-help-translation" lang={hint?.meaning ? 'th' : 'en'}>{hint?.meaning ?? 'Translation not available yet.'}</p>
      {hint && <WordDetails word={hint.word} context={text} />}
    </div>
    {pointsRemaining !== undefined && <p className="sr-only">{pointsRemaining} pts available</p>}
  </dialog>, document.body)}</span>
}
