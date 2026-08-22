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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">FIFA English</p>
        <h1 className="mt-3 text-3xl font-black">Welcome</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter the same name you use in Success Padel.
        </p>

        {automaticLoginError ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            LINE login was unavailable, so you can continue with your name instead.
          </p>
        ) : null}

        <form className="mt-7 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Your name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              autoFocus
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
              placeholder="For example, Peta"
            />
          </label>

          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={working}
            className="w-full rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
          >
            {working ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </section>
    </main>
  )
}
