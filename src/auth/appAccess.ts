// Peta's existing account, also used by the progress policy verification.
export const PETA_ACCOUNT_ID = '7bdc33ac-7f21-4ebf-bfbf-343080724890'

export function appDestination(userId: string, pathname: string) {
  if (userId !== PETA_ACCOUNT_ID) return 'student'
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin'
  if (pathname === '/app' || pathname.startsWith('/app/')) return 'student'
  return 'student'
}
