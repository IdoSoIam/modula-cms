import { getSetting, setSetting, SETTING_KEYS } from './settings'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid'
]

function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://localhost:3000/api/auth/gmail/callback'
  if (!clientId || !clientSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Google OAuth non configuré (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manquants)' })
  }
  return { clientId, clientSecret, redirectUri }
}

export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = getOAuthConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: GMAIL_SCOPES.join(' '),
    state
  })
  return `${AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig()
  const res = await $fetch<{
    access_token: string
    refresh_token?: string
    expires_in: number
    token_type: string
    scope: string
  }>(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }).toString()
  })

  // Fetch connected user email
  const userinfo = await $fetch<{ email: string }>(USERINFO_URL, {
    headers: { Authorization: `Bearer ${res.access_token}` }
  })

  if (res.refresh_token) {
    await setSetting(SETTING_KEYS.GMAIL_REFRESH_TOKEN, res.refresh_token)
  }
  await setSetting(SETTING_KEYS.GMAIL_ACCESS_TOKEN, res.access_token)
  await setSetting(SETTING_KEYS.GMAIL_TOKEN_EXPIRY, String(Date.now() + res.expires_in * 1000))
  await setSetting(SETTING_KEYS.GMAIL_CONNECTED_EMAIL, userinfo.email)

  return userinfo.email
}

async function getValidAccessToken(): Promise<string> {
  const accessToken = await getSetting(SETTING_KEYS.GMAIL_ACCESS_TOKEN)
  const expiry = Number(await getSetting(SETTING_KEYS.GMAIL_TOKEN_EXPIRY) ?? 0)
  if (accessToken && expiry > Date.now() + 60_000) {
    return accessToken
  }

  const refreshToken = await getSetting(SETTING_KEYS.GMAIL_REFRESH_TOKEN)
  if (!refreshToken) {
    throw createError({ statusCode: 503, statusMessage: 'Gmail non connecté' })
  }

  const { clientId, clientSecret } = getOAuthConfig()
  const res = await $fetch<{ access_token: string; expires_in: number }>(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }).toString()
  })

  await setSetting(SETTING_KEYS.GMAIL_ACCESS_TOKEN, res.access_token)
  await setSetting(SETTING_KEYS.GMAIL_TOKEN_EXPIRY, String(Date.now() + res.expires_in * 1000))
  return res.access_token
}

function buildRfc822(from: string, to: string, subject: string, body: string): string {
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    body
  ].join('\r\n')
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sendGmail(opts: { to: string; subject: string; body: string }) {
  const accessToken = await getValidAccessToken()
  const from = await getSetting(SETTING_KEYS.GMAIL_CONNECTED_EMAIL)
  if (!from) throw createError({ statusCode: 503, statusMessage: 'Gmail non connecté' })

  const raw = base64UrlEncode(buildRfc822(from, opts.to, opts.subject, opts.body))
  await $fetch(SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: { raw }
  })
}

export async function disconnectGmail() {
  await Promise.all([
    setSetting(SETTING_KEYS.GMAIL_REFRESH_TOKEN, ''),
    setSetting(SETTING_KEYS.GMAIL_ACCESS_TOKEN, ''),
    setSetting(SETTING_KEYS.GMAIL_TOKEN_EXPIRY, ''),
    setSetting(SETTING_KEYS.GMAIL_CONNECTED_EMAIL, '')
  ])
}
