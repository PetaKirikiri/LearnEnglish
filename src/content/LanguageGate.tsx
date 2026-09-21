import { useEffect, useState, type ReactNode } from 'react'
import { initializeLanguageDatabase } from '../lib/languageDatabase'

export default function LanguageGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'database' | 'cache' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    void initializeLanguageDatabase().then(source => { if (active) setState(source) }, () => { if (active) setState('error') })
    return () => { active = false }
  }, [attempt])
  if (state === 'loading' || state === 'error') return <main className="game-surface loading-screen grid min-h-[100dvh] place-content-center gap-4 p-6 text-center text-sm">
    <p role="status">{state === 'loading' ? 'Opening EnglishSuccess…' : 'Couldn’t load language data.'}</p>
    {state === 'error' && <button className="primary-action" onClick={() => { setState('loading'); setAttempt(n => n + 1) }}>Try again</button>}
  </main>
  return <div data-language-source={state}>{state === 'cache' && <p role="status" className="connection-banner px-4 py-1 text-center text-xs">Using saved language data</p>}{children}</div>
}
