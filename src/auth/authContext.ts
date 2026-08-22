import type { User } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export type AuthContextValue = {
  loading: boolean
  user: User | null
  displayName: string | null
  automaticLoginError: string | null
  signInWithPlayerName: (name: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
