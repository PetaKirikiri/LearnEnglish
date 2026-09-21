import Brand from '../ui/Brand'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/authContext'

export default function LoginPage() {
  const { automaticLoginError, signInWithPlayerName } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setWorking(true)
    setError(null)
    const nextError = await signInWithPlayerName(name)
    setError(nextError)
    setWorking(false)
  }

  return (
    <main className="login-screen game-surface">
      <header className="login-header"><Brand /></header>
      <section className="login-card">
        <div className="login-emblem" aria-hidden="true"><span className="rank-emblem" /></div>
        <h1>Sign in</h1>

        {automaticLoginError ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            LINE unavailable. Sign in below.
          </p>
        ) : null}

        <form className="mt-7 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Success Padel name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              autoFocus
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
              placeholder="Name"
            />
          </label>

          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={working}
            className="primary-action w-full disabled:cursor-wait disabled:opacity-60"
          >
            {working ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </section>
    </main>
  )
}
