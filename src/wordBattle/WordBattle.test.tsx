// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
vi.mock('../lib/supabase', () => ({ supabase: { auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) } } }))
import WordBattle from './WordBattle'
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
let teardown = () => {}
afterEach(() => { teardown(); localStorage.clear() })
it('plays, extends, deploys, penalises, and keeps failed plays for practice', async () => {
  const host = document.createElement('div'); document.body.append(host)
  const root = createRoot(host)
  teardown = () => { act(() => root.unmount()); host.remove() }
  await act(async () => root.render(<WordBattle />))
  function click(text: string) {
    const button = [...host.querySelectorAll('button')].find(button => button.textContent === text || button.textContent?.startsWith(text))
    expect(button, text).toBeTruthy()
    act(() => (button as HTMLButtonElement).click())
  }
  click('Start battle')
  click('the'); click('dog'); click('Commit')
  expect(host.querySelector('.wb-battlebar b')?.textContent).toBe('⚡ 4')
  click('the dog')
  click('runs'); click('Commit')
  expect(host.querySelector('.wb-battlebar b')?.textContent).toBe('⚡ 15')
  click('🛡️Guard')
  expect(host.querySelector('.wb-battlebar b')?.textContent).toBe('⚡ 9')
  expect(host.querySelectorAll('.wb-unit.you')).toHaveLength(1)
  click('big'); click('Commit')
  expect(host.querySelector('.wb-battlebar b')?.textContent).toBe('⚡ 7')
  expect(host.querySelector('.wb-practice')).toBeNull()
  expect(JSON.parse(localStorage.getItem('word-battle:attempts:guest')!)).toHaveLength(3)
  click('Practice')
  expect(host.querySelector('.wb-practice')?.textContent).toContain('big')
  click('big'); click('Commit')
  expect(host.querySelector('.wb-battlebar b')?.textContent).toBe('⚡ 0')
})
