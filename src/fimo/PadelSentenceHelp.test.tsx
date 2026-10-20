// @vitest-environment happy-dom
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import { PadelSentenceHelp } from '../padel/PadelWordHelp'
import { padelQuestions } from '../padel/course'

vi.mock('react-dom', () => ({ createPortal: () => null }))

it('preserves every word and punctuation across the complete Padel bank', () => {
  for (const question of padelQuestions) {
    const host = document.createElement('div')
    host.innerHTML = renderToStaticMarkup(<PadelSentenceHelp question={question}/>)
    expect(host.querySelectorAll('.meaning-tile').length, question.id).toBeGreaterThan(0)
    expect(host.querySelectorAll('.word-meaning-art').length, question.id).toBe(host.querySelectorAll('.meaning-tile').length)
    expect(host.querySelectorAll('.meaning-tile:not([data-meaning])').length, question.id).toBe(0)
    // Decorative numeric/question symbols are not sentence text or spoken labels.
    host.querySelectorAll('.word-meaning-art').forEach(icon => icon.remove())
    expect(host.textContent?.replace(/\s/g, ''), question.id).toBe(question.english.replace(/\s/g, ''))
  }
})

it('keeps numeric punctuation intact and gives long words more room', () => {
  const host = document.createElement('div')
  host.innerHTML = renderToStaticMarkup(<PadelSentenceHelp question={{ ...padelQuestions[0], english: 'At reception, 10 people are waiting.' }}/>)
  host.querySelectorAll('.word-meaning-art').forEach(icon => icon.remove())
  expect(host.textContent?.replace(/\s/g, '')).toBe('Atreception,10peoplearewaiting.')
  expect(host.querySelector('.meaning-tile-long')?.textContent).toBe('reception,')
})
