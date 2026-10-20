// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { existsSync } from 'node:fs'
import FimoPreviewPage from './FimoPreviewPage'
import { artwork, meaningArtwork, pieceArtwork, specimens, translations } from './examples'
const speech = vi.hoisted(() => ({ speak: vi.fn(), stop: vi.fn() }))
vi.mock('../learning/speech', () => ({ speakEnglish: speech.speak, stopEnglishSpeech: speech.stop }))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const host = document.createElement('div'); document.body.append(host)
let root = createRoot(host)
afterEach(async () => { await act(() => root.unmount()); root = createRoot(host); vi.clearAllMocks() })
const answers = () => [...host.querySelectorAll<HTMLButtonElement>('.fimo-answer')]
const next = () => host.querySelector<HTMLButtonElement>('.fimo-next')!
it('puts one sentence and two translations first, without competing labels or answer cues', async () => {
  await act(() => root.render(<FimoPreviewPage/>))
  expect(host.querySelectorAll('.fimo-sentence')).toHaveLength(1)
  expect(host.querySelectorAll('.fimo-piece')).toHaveLength(5)
  expect(answers().map(b => b.textContent)).toEqual(['อะไรอยู่ในสนาม', 'ใครอยู่ในสนาม'])
  expect(host.querySelector('header, nav, h1, h2, .fimo-note, .is-correct, .is-wrong')).toBeNull()
  expect(host.textContent).not.toContain('A person')
  expect(host.textContent).not.toContain('Same sentence')
  expect(next()).toBeNull()
  expect(localStorage.length).toBe(0)
})
it('shows feedback only after answering and waits for manual Next', async () => {
  await act(() => root.render(<FimoPreviewPage/>))
  await act(() => answers()[0].click())
  expect(host.querySelector('[role=status]')?.textContent).toBe('Not quite')
  expect(host.querySelector('.is-correct')?.textContent).toContain('ใครอยู่ในสนาม')
  expect(answers().every(b => b.disabled)).toBe(true)
  expect(host.querySelector('.fimo-sentence')?.getAttribute('aria-label')).toBe('Who is on the court?')
  await act(() => next().click())
  expect(host.querySelector('.fimo-sentence')?.getAttribute('aria-label')).toBe('What is on the court?')
  expect(host.querySelector('.is-correct, .is-wrong')).toBeNull()
  expect(answers().every(b => !b.disabled)).toBe(true)
  expect(localStorage.length).toBe(0)
})
it('presents all 16 specimens with matching answers, counterbalances positions and loops', async () => {
  await act(() => root.render(<FimoPreviewPage/>))
  const positions = new Set<number>()
  for (const example of Object.values(specimens).flat()) {
    for (const [i, row] of example.rows.entries()) {
      expect(host.querySelector('.fimo-sentence')?.getAttribute('aria-label')).toBe(row.pieces.map(p => p.word).join(' '))
      const correct = answers().findIndex(b => b.textContent === translations[example.title][i])
      expect(correct).toBeGreaterThanOrEqual(0)
      positions.add(correct)
      await act(() => answers()[correct].click())
      expect(host.querySelector('[role=status]')?.textContent).toBe('Correct')
      await act(() => next().click())
    }
  }
  expect(positions.size).toBe(2)
  expect(host.querySelector('.fimo-sentence')?.getAttribute('aria-label')).toBe('Who is on the court?')
})
it('reveals word information only on request and plays the existing recording', async () => {
  await act(() => root.render(<FimoPreviewPage/>))
  await act(() => host.querySelector<HTMLButtonElement>('.fimo-piece')!.click())
  expect(host.querySelector('.fimo-note-role')?.textContent).toBe('Question word')
  await act(() => host.querySelector<HTMLButtonElement>('[aria-label="Close word detail"]')!.click())
  expect(host.querySelector('.fimo-note')).toBeNull()
  await act(() => host.querySelector<HTMLButtonElement>('.fimo-audio')!.click())
  expect(speech.speak).toHaveBeenCalledWith('Who is on the court?', '/audio/padel/padel-questions-1-1-1.wav', expect.any(Function))
  await act(() => answers()[1].click())
  await act(() => next().click())
  expect(speech.stop).toHaveBeenCalled()
})
it('keeps original rounded pieces without the rejected sidewall or icon filter', async () => {
  await act(() => root.render(<FimoPreviewPage/>))
  expect(host.querySelector('filter, .fimo-tile-side, .fimo-connected-body')).toBeNull()
  for (const shape of host.querySelectorAll('.fimo-piece-pigment')) expect(shape.getAttribute('d')).toContain('V47C148 44 148 82 130 79')
})
it('uses meaning-specific images for every word in the first contrast', async () => {
  await act(() => root.render(<FimoPreviewPage/>))
  expect([...host.querySelectorAll('.fimo-piece img')].map(img => img.getAttribute('src'))).toEqual(
    ['word-who.png','word-is-location.png','word-on.png','word-the-shared.png','word-court.png'].map(name => `/images/fimo/${name}`),
  )
  expect(host.querySelector('img[src*="wolf"], img[src*="mahi"]')).toBeNull()
  await act(() => answers()[0].click())
  await act(() => next().click())
  expect(host.querySelector('.fimo-piece img')?.getAttribute('src')).toBe('/images/fimo/word-what.png')
})
it('does not assign the location cue to progressive is or replace the brand asset', () => {
  const linkingIs = specimens.Questions[0].rows[0].pieces[1]
  const progressiveIs = specimens['Verb forms'][0].rows[1].pieces[1]
  expect(pieceArtwork(linkingIs)).toBe(meaningArtwork.isLocation)
  expect(pieceArtwork(progressiveIs)).not.toBe(meaningArtwork.isLocation)
  expect(artwork.action).toBe('success-wolf-grey-clay.png')
})
it('ships all referenced artwork and recordings and two distinct translations per pair', () => {
  for (const filename of [...Object.values(artwork), ...Object.values(meaningArtwork), 'pronoun-plural-80e20e7fdf5e9379.webp']) expect(existsSync(`public/images/fimo/${filename}`)).toBe(true)
  for (const example of Object.values(specimens).flat()) {
    expect(new Set(translations[example.title]).size).toBe(2)
    for (const row of example.rows) {
      if (row.audio) expect(existsSync(`public/audio/padel/${row.audio}.wav`)).toBe(true)
    }
  }
})
