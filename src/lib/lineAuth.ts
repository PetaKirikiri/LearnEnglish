import liff from '@line/liff'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'

const liffId = import.meta.env.VITE_LIFF_ID?.trim()

export type LineSignInResult = {
  session: Session | null
  error: string | null
  redirected: boolean
}

function isLineBrowser(): boolean {
  return /Line\//i.test(navigator.userAgent) || document.referrer.includes('liff.line.me')
}

function hasLiffContext(): boolean {
  const context = `${window.location.search}${window.location.hash}`
  return (
    context.includes('liff.state') ||
    context.includes('liffClientId') ||
    document.referrer.includes('liff.line.me')
  )
}

function liffEntryUrl(): string | null {
  if (!liffId) return null
  const path = `${window.location.pathname}${window.location.search}`
  return `https://liff.line.me/${liffId}${path === '/' ? '' : path}`
}

export async function tryAutomaticLineSignIn(): Promise<LineSignInResult> {
  if (!liffId || !isSupabaseConfigured || !isLineBrowser()) {
    return { session: null, error: null, redirected: false }
  }

  if (!hasLiffContext()) {
    const entry = liffEntryUrl()
    if (entry) {
      window.location.replace(entry)
      return { session: null, error: null, redirected: true }
    }
  }

  try {
    await liff.init({ liffId, withLoginOnExternalBrowser: false })
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.origin })
      return { session: null, error: null, redirected: true }
    }

    const idToken = liff.getIDToken()
    if (!idToken) {
      return { session: null, error: 'LINE could not confirm your identity.', redirected: false }
    }

    const profile = await liff.getProfile().catch(() => null)
    const accessToken = liff.getAccessToken()
    const { data, error } = await supabase.functions.invoke('line-liff-auth', {
      body: {
        id_token: idToken,
        access_token: accessToken ?? undefined,
        profile: profile
          ? {
              user_id: profile.userId,
              display_name: profile.displayName,
              picture_url: profile.pictureUrl,
            }
          : undefined,
      },
    })

    if (error) return { session: null, error: error.message, redirected: false }

    const payload = data as {
      error?: string
      access_token?: string
      refresh_token?: string
    }
    if (payload.error) return { session: null, error: payload.error, redirected: false }
    if (!payload.access_token || !payload.refresh_token) {
      return { session: null, error: 'LINE login did not return a session.', redirected: false }
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
    })
    return {
      session: sessionData.session,
      error: sessionError?.message ?? null,
      redirected: false,
    }
  } catch (error) {
    return {
      session: null,
      error: error instanceof Error ? error.message : 'LINE login failed.',
      redirected: false,
    }
  }
}
