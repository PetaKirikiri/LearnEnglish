import { useContext, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { thaiTranslations } from '../content/languageData'
import { normalizeHelpWord } from './helpPoints'
import Icon from '../ui/Icon'
import { AuthContext } from '../auth/authContext'
import WordDetails from './wordInfo/WordDetails'
import WordConfidence from './wordInfo/WordConfidence'
import type { WordProfile } from './wordInfo/types'

export default function WordHelp({ text, onHelp, onOpenChange, pointsRemaining, translations = {}, theme, onListen, tokenOpacity, profiles, examplesForWord, renderToken, singleUnit = false, tokenPattern }: {
  text: string
  singleUnit?: boolean
  tokenPattern?: RegExp
  onHelp?: (word: string) => void
  onOpenChange?: (open: boolean) => void
  pointsRemaining?: number
  translations?: Record<string, string>
  theme?: 'hotel' | 'padel'
  onListen?: () => void
  tokenOpacity?: (word: string) => number
  profiles?: Record<string, WordProfile>
  examplesForWord?: (word: string, context: string) => string[]
  renderToken?: (word: string, punctuation: string, followingText: string, precedingText: string) => ReactNode
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
    const meaning = translations[normalized] ?? thaiTranslations[normalized]
    trigger.current = element
    // Unknown words still have a token, but no charge for missing information.
    if (meaning) onHelp?.(normalized)
    setHint({ word, meaning })
    onOpenChange?.(true)
    dialog.current?.showModal()
  }
  const parts = singleUnit ? ['', text, ''] : text.split(tokenPattern ?? /([\p{L}]+(?:[’'][\p{L}]+)*)/gu)
  return <span className={renderToken ? 'word-help-tiles' : undefined}>{parts.map((token, index) => {
    if (!/^\p{L}/u.test(token)) {
      // Tile punctuation stays with its word; do not create stray flex items.
      if (renderToken) {
        const remainder = index > 0 ? token.replace(/^[.,!?;:]+/, '') : token
        return remainder.trim() ? remainder : null
      }
      return token
    }
    const punctuation = renderToken ? parts[index + 1]?.match(/^[.,!?;:]+/)?.[0] ?? '' : ''
    return <span key={index} role="button" tabIndex={0} aria-label={`Help with ${token}`} aria-haspopup="dialog" className="word-token"
      style={tokenOpacity ? { opacity: tokenOpacity(token) } : undefined}
      onClick={event => open(token, event.currentTarget)}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); open(token, event.currentTarget) } }}>{renderToken ? renderToken(token, punctuation, parts.slice(index + 1).join(''), parts.slice(0, index).join('')) : token}</span>
  })}{createPortal(<dialog ref={dialog} className={`word-help-dialog${theme ? ` word-help-hotel${theme === 'padel' ? ' word-help-padel' : ''}` : ''}`} aria-labelledby={titleId}
    onKeyDown={event => event.stopPropagation()}
    onCancel={event => { event.preventDefault(); close() }}
    onClick={event => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close() } }}>
    <header className="word-help-header"><h2 id={titleId} lang="en">{hint?.word}</h2>{onListen ? <button type="button" aria-label="Hear sentence" onClick={onListen} className="icon-button"><Icon name="sound" /></button> : null}<button type="button" aria-label="Close word help" onClick={close} className="icon-button"><Icon name="close" /></button></header>
    {hint && auth?.user?.id && <WordConfidence key={`${auth.user.id}:${hint.word}`} userId={auth.user.id} word={hint.word} />}
    <div className="word-help-scroll">
      <p className="word-help-translation" lang={hint && (translations[normalizeHelpWord(hint.word)] ?? thaiTranslations[normalizeHelpWord(hint.word)]) ? 'th' : 'en'}>{hint ? translations[normalizeHelpWord(hint.word)] ?? thaiTranslations[normalizeHelpWord(hint.word)] ?? 'Translation not available yet.' : ''}</p>
      {hint && <WordDetails word={hint.word} context={text} profile={profiles?.[normalizeHelpWord(hint.word)]} examples={examplesForWord?.(hint.word,text)} />}
    </div>
    {pointsRemaining !== undefined && <p className="sr-only">{pointsRemaining} pts available</p>}
  </dialog>, document.body)}</span>
}
