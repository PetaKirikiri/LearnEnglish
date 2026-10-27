import type { ReactNode } from 'react'

const symbols = [
  <path key="where" d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Zm0-15a3 3 0 1 0 0 6 3 3 0 0 0 0-6"/>,
  <g key="is"><circle cx="12" cy="9" r="4" fill="currentColor" stroke="none"/><path d="M4 18h16M12 14v4"/></g>,
  <g key="which"><path d="M7 3H3v4m14-4h4v4M3 17v4h4m14-4v4h-4"/><circle cx="12" cy="12" r="4"/></g>,
  <path key="noun" d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10"/>,
]
export default function SentenceSlot({ slot, children }: { slot: number; children: ReactNode }) {
  return <><span className="slot-heading" aria-hidden="true"><b>{slot + 1}</b></span><svg className="slot-role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{symbols[slot]}</svg>{children}</>
}
