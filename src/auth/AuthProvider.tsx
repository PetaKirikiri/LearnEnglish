import type { Session } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { tryAutomaticLineSignIn } from '../lib/lineAuth'
import { AuthContext, type AuthContextValue } from './authContext'
import { trackProgress } from '../learning/progressSync'

function nameFromSession(session: Session | null): string | null {
  const metadata = session?.user.user_metadata
  const value = metadata?.display_name ?? metadata?.name ?? metadata?.browser_player_username
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [automaticLoginError, setAutomaticLoginError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      if (data.session) {
        setSession(data.session)
        setLoading(false)
        return
      }

      const lineResult = await tryAutomaticLineSignIn()
      if (!active || lineResult.redirected) return
      setSession(lineResult.session)
      if (lineResult.session) trackProgress(lineResult.session.user.id, 'login')
      setAutomaticLoginError(lineResult.error)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    loading,
    user: session?.user ?? null,
    displayName: nameFromSession(session),
    automaticLoginError,
    async signInWithPlayerName(name: string) {
      if (!isSupabaseConfigured) return 'Login is not configured yet.'

      const username = name.trim().replace(/\s+/g, ' ')
      if (!username) return 'Enter your name.'

      const { data, error } = await supabase.functions.invoke('browser-player-login', {
        body: { username },
      })
      if (error) return error.message

      const payload = data as {
        error?: string
        access_token?: string
        refresh_token?: string
      }
      if (payload.error) return payload.error
      if (!payload.access_token || !payload.refresh_token) {
        return 'Login did not return a session.'
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      })
      if (!sessionError && sessionData.session) trackProgress(sessionData.session.user.id, 'login')
      return sessionError?.message ?? null
    },
    async signOut() {
      await supabase.auth.signOut()
    },
  }), [automaticLoginError, loading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
