const AUTH_SESSION_COOKIE_NAMES = ['__Host-session', 'session']

function hasNamedCookie(cookieHeader: string | undefined) {
  if (!cookieHeader) return false
  return AUTH_SESSION_COOKIE_NAMES.some(name => cookieHeader.includes(`${name}=`))
}

export function hasAuthSessionCookie() {
  if (import.meta.client) {
    return hasNamedCookie(document.cookie)
  }

  return hasNamedCookie(useRequestHeaders(['cookie']).cookie)
}
