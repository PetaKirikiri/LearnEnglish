import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import MemberProfilePage from './MemberProfilePage'
const { load } = vi.hoisted(() => ({ load: vi.fn() }))
vi.mock('../learning/progressSync', () => ({ loadLearnerEvents: load }))
it('loads the selected learner and offers a retry when loading fails', async () => {
 Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
 const container = document.createElement('div'); const root = createRoot(container)
 load.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([])
 await act(async () => root.render(<MemberProfilePage member={{ id: 'fifa', name: 'Fifa' }} onBack={() => {}} />))
 expect(load).toHaveBeenCalledWith('fifa')
 expect(container.querySelector('[role="alert"]')).toBeTruthy()
 await act(async () => { [...container.querySelectorAll('button')].find(b => b.textContent === 'Refresh')!.click() })
 expect(container.querySelector('[role="alert"]')).toBeNull()
 expect(container.textContent).toContain('No practice has synced')
 expect(container.textContent).toContain('Word confidence')
 act(() => root.unmount())
})
