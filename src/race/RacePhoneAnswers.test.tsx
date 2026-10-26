import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import RacePhoneAnswers from './RacePhoneAnswers'
it('swipes by meaning, preserves taps, and ignores scrolling, cancellations and disabled answers', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const host = document.createElement('div'); document.body.append(host)
  const root = createRoot(host), choose = vi.fn()
  async function render(disabled = false) { await act(async () => root.render(<RacePhoneAnswers choices={['Wrong','Correct']} disabled={disabled} onChoose={choose}/>)) }
  await render()
  const area = host.firstElementChild as HTMLElement
  area.setPointerCapture = vi.fn()
  async function point(type: string, x: number, y = 0) { await act(async () => { area.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y })) }) }
  await point('pointerdown',100); await point('pointermove',180); await point('pointerup',180)
  expect(choose).toHaveBeenLastCalledWith(1)
  await act(async () => host.querySelector('button')!.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1})))
  expect(choose).toHaveBeenCalledTimes(1)
  await point('pointerdown',180); await point('pointerup',100)
  expect(choose).toHaveBeenLastCalledWith(0)
  await point('pointerdown',100); await point('pointermove',110,90); await point('pointerup',110,90)
  await point('pointerdown',100); await point('pointermove',170); await point('pointercancel',170); await point('pointerup',170)
  expect(choose).toHaveBeenCalledTimes(2)
  await point('pointerdown',100); await point('pointerup',100)
  await act(async () => host.querySelector('button')!.click())
  expect(choose).toHaveBeenCalledTimes(3)
  await render(true); await point('pointerdown',100); await point('pointerup',200)
  expect(choose).toHaveBeenCalledTimes(3)
  await act(async () => root.unmount());host.remove()
})
