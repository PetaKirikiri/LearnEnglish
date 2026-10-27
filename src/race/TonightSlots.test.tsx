// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import TonightSlots from './TonightSlots'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

it('offers tonight’s 20 words and changes ownership and vocabulary independently', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  try {
    await act(async () => root.render(<TonightSlots/>))
    expect(host.querySelectorAll('.tonight-slot')).toHaveLength(4)
    expect(host.querySelector('.sentence-slot-group')?.getAttribute('aria-label')).toBe('Subject')
    expect(host.querySelectorAll('.sentence-slot-group .tonight-slot')).toHaveLength(2)
    const choose = async (label: string) => {
      const button = [...host.querySelectorAll<HTMLButtonElement>('.tonight-choices button')].find(button => button.querySelector('strong')?.textContent === label)!
      await act(async () => button.click())
    }
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.tonight-slot')[2].click())
    await choose('my')
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.tonight-slot')[3].click())
    expect(host.querySelectorAll('.tonight-choices button')).toHaveLength(20)
    await choose('phone')
    expect(host.querySelector('.tonight-sentence')?.textContent).toContain('โทรศัพท์ของฉันอยู่ที่ไหน')
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.tonight-slot')[2].click())
    await choose('your')
    expect(host.querySelector('.tonight-sentence')?.textContent).toContain('โทรศัพท์ของคุณอยู่ที่ไหน')
    expect(host.querySelectorAll('.tonight-slot')[3].textContent).toContain('phone')
  } finally {
    await act(async () => root.unmount())
    host.remove()
  }
})
