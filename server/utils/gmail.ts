import { SUBSCRIPTIONS_ENABLED } from '~/shared/constants/reservationFeatures'
import { deleteSettings, getSetting, setSetting, SETTING_KEYS } from './settings'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid'
]

const CALENDAR_LIST_URL = 'https://www.googleapis.com/calendar/v3/users/me/calendarList'
const CALENDAR_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars'

function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://localhost:3000/api/auth/gmail/callback'
  if (!clientId || !clientSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Google OAuth non configure (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manquants)' })
  }
  return { clientId, clientSecret, redirectUri }
}

export function getSiteOrigin() {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/+$/, '')
  }
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://localhost:3000/api/auth/gmail/callback'
  return new URL(redirectUri).origin
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

export async function getValidAccessToken(): Promise<string> {
  const accessToken = await getSetting(SETTING_KEYS.GMAIL_ACCESS_TOKEN)
  const expiry = Number(await getSetting(SETTING_KEYS.GMAIL_TOKEN_EXPIRY) ?? 0)
  if (accessToken && expiry > Date.now() + 60_000) {
    return accessToken
  }

  const refreshToken = await getSetting(SETTING_KEYS.GMAIL_REFRESH_TOKEN)
  if (!refreshToken) {
    throw createError({ statusCode: 503, statusMessage: 'Gmail non connecte' })
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

function base64UrlEncode(str: string) {
  return Buffer.from(str, 'utf-8').toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64EncodeUtf8(str: string) {
  return Buffer.from(str, 'utf-8').toString('base64')
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, 'utf-8').toString('base64')}?=`
}

function buildMessageId(from: string) {
  const domain = from.includes('@') ? from.split('@')[1] : 'ferme-campeyrigoux.local'
  return `<${Date.now()}.${Math.random().toString(36).slice(2)}@${domain}>`
}

interface GmailAttachment {
  filename: string
  mimeType: string
  content: string
}

export interface GmailCalendarInvite {
  filename: string
  mimeType: string
  content: string
}

interface GoogleCalendarEventDateTime {
  date?: string
  dateTime?: string
  timeZone?: string
}

export interface GoogleCalendarEventResource {
  id: string
  recurringEventId?: string
  originalStartTime?: GoogleCalendarEventDateTime
  start?: GoogleCalendarEventDateTime
  end?: GoogleCalendarEventDateTime
  summary?: string
  description?: string
  location?: string
  status?: string
}

function buildMimeMessage(options: {
  from: string
  to: string
  subject: string
  textBody: string
  htmlBody?: string
  calendarInvite?: GmailCalendarInvite
  attachments?: GmailAttachment[]
}) {
  const mixedBoundary = `mixed_${Math.random().toString(36).slice(2)}`
  const altBoundary = `alt_${Math.random().toString(36).slice(2)}`
  const hasCalendar = Boolean(options.calendarInvite)
  const hasAttachments = hasCalendar || (options.attachments ?? []).length > 0
  const lines: string[] = [
    `From: ${options.from}`,
    `To: ${options.to}`,
    `Subject: ${encodeHeader(options.subject)}`,
    'MIME-Version: 1.0',
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${buildMessageId(options.from)}`
  ]

  if (hasAttachments) {
    lines.push(
      `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
      '',
      `--${mixedBoundary}`
    )
  }

  if (hasCalendar || options.htmlBody || hasAttachments) {
    // RFC 6047 section 4.2 shows the calendar part as a direct child of
    // multipart/alternative alongside the human-readable body.
    lines.push(
      `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
      '',
      `--${altBoundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      base64EncodeUtf8(options.textBody)
    )

    if (options.htmlBody) {
      lines.push(
        `--${altBoundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        base64EncodeUtf8(options.htmlBody)
      )
    }

    if (options.calendarInvite) {
      // Keep a single text/calendar alternative for the invite itself.
      // This matches the iMIP multipart/alternative pattern from RFC 6047.
      lines.push(
        `--${altBoundary}`,
        `Content-Type: ${options.calendarInvite.mimeType}`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: inline; filename="${options.calendarInvite.filename}"`,
        '',
        base64EncodeUtf8(options.calendarInvite.content)
      )
    }

    lines.push(`--${altBoundary}--`)
  } else {
    lines.push(
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      base64EncodeUtf8(options.textBody)
    )
  }

  for (const attachment of options.attachments ?? []) {
    lines.push(
      `--${mixedBoundary}`,
      `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      '',
      base64EncodeUtf8(attachment.content)
    )
  }

  if (options.calendarInvite) {
    lines.push(
      `--${mixedBoundary}`,
      `Content-Type: application/ics; name="${options.calendarInvite.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${options.calendarInvite.filename}"`,
      '',
      base64EncodeUtf8(options.calendarInvite.content)
    )
  }

  if (hasAttachments) {
    lines.push(`--${mixedBoundary}--`, '')
  }

  lines.push('')
  return lines.join('\r\n')
}

export async function sendGmail(opts: {
  to: string
  subject: string
  body: string
  htmlBody?: string
  calendarInvite?: GmailCalendarInvite
  attachments?: GmailAttachment[]
}) {
  const accessToken = await getValidAccessToken()
  const from = await getSetting(SETTING_KEYS.GMAIL_CONNECTED_EMAIL)
  if (!from) throw createError({ statusCode: 503, statusMessage: 'Gmail non connecte' })

  const raw = base64UrlEncode(buildMimeMessage({
    from,
    to: opts.to,
    subject: opts.subject,
    textBody: opts.body,
    htmlBody: opts.htmlBody,
    calendarInvite: opts.calendarInvite || undefined,
    attachments: opts.attachments
  }))

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
  const [refreshToken, accessToken] = await Promise.all([
    getSetting(SETTING_KEYS.GMAIL_REFRESH_TOKEN),
    getSetting(SETTING_KEYS.GMAIL_ACCESS_TOKEN)
  ])

  const tokenToRevoke = refreshToken || accessToken

  if (tokenToRevoke) {
    try {
      await $fetch(REVOKE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: tokenToRevoke }).toString()
      })
    } catch (error) {
      console.error('Unable to revoke Google token during disconnect:', error)
    }
  }

  await deleteSettings([
    SETTING_KEYS.GMAIL_REFRESH_TOKEN,
    SETTING_KEYS.GMAIL_ACCESS_TOKEN,
    SETTING_KEYS.GMAIL_TOKEN_EXPIRY,
    SETTING_KEYS.GMAIL_CONNECTED_EMAIL,
    SETTING_KEYS.GOOGLE_CALENDAR_ID,
    SETTING_KEYS.GOOGLE_CALENDAR_NAME
  ])
}

export interface GoogleCalendarListItem {
  id: string
  summary: string
  primary: boolean
  accessRole: string
}

export async function listGoogleCalendars(): Promise<GoogleCalendarListItem[]> {
  const accessToken = await getValidAccessToken()
  const response = await $fetch<{
    items?: Array<{ id: string; summary: string; primary?: boolean; accessRole?: string }>
  }>(CALENDAR_LIST_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  return (response.items ?? [])
    .filter((item) => item.id && item.summary)
    .map((item) => ({
      id: item.id,
      summary: item.summary,
      primary: Boolean(item.primary),
      accessRole: item.accessRole ?? 'reader'
    }))
}

function encodeCalendarId(calendarId: string) {
  return encodeURIComponent(calendarId)
}

function normalizeEventTime(value: string | null | undefined): { hour: number; minute: number } | null {
  if (!value) return null
  const match = value.trim().match(/^(\d{1,2})(?:[:hH](\d{1,2}))?$/)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2] ?? 0)
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null
  }
  return { hour, minute }
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

interface GoogleCalendarReservationInput {
  reservationId: number
  customerName: string
  email: string
  phone: string | null
  message: string | null
  basketName: string
  basketPrice: number
  deliveryType: string | null
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryPostalCode: string | null
  fulfillmentDate: Date | null
  fulfillmentTime: string | null
  fulfillmentLocation: string | null
  pickupPoint: { name: string; address: string | null } | null
  deliveryTour: { name: string; startTime: string; endTime: string } | null
  monthlySubscription: boolean
}

export function buildGoogleCalendarEventPayload(input: GoogleCalendarReservationInput) {
  if (!input.fulfillmentDate) return null

  const calendarTime = normalizeEventTime(input.fulfillmentTime) ?? normalizeEventTime(input.deliveryTour?.startTime)
  const endTime = normalizeEventTime(input.deliveryTour?.endTime)
  const baseDate = new Date(input.fulfillmentDate)

  const lines = [
    `Reservation #${input.reservationId}`,
    `Client : ${input.customerName}`,
    `Email : ${input.email}`,
    `Telephone : ${input.phone ?? '-'}`,
    `Panier : ${input.basketName} (${input.basketPrice.toFixed(2)} EUR)`,
    `Mode : ${input.deliveryType === 'TOUR' ? 'Livraison' : input.deliveryType === 'PICKUP' ? 'Retrait' : input.deliveryType === 'FARM' ? 'Retrait à la ferme' : '-'}`,
    `Abonnement mensuel : ${SUBSCRIPTIONS_ENABLED && input.monthlySubscription ? 'Oui' : 'Non'}`,
    `Lieu : ${input.fulfillmentLocation ?? input.pickupPoint?.address ?? input.deliveryAddress ?? '-'}`,
    `Message client : ${input.message ?? '-'}`
  ]

  const location = input.fulfillmentLocation
    ?? input.pickupPoint?.address
    ?? [input.deliveryAddress, [input.deliveryPostalCode, input.deliveryCity].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    ?? undefined

  if (!calendarTime) {
    const date = baseDate.toISOString().slice(0, 10)
    const end = new Date(baseDate)
    end.setDate(end.getDate() + 1)
    return {
      summary: `${input.basketName} - ${input.customerName}`,
      description: lines.join('\n'),
      location,
      start: { date },
      end: { date: end.toISOString().slice(0, 10) }
    }
  }

  const start = new Date(baseDate)
  start.setHours(calendarTime.hour, calendarTime.minute, 0, 0)
  const end = endTime
    ? new Date(new Date(baseDate).setHours(endTime.hour, endTime.minute, 0, 0))
    : addMinutes(start, 60)

  return {
    summary: `${input.basketName} - ${input.customerName}`,
    description: lines.join('\n'),
    location,
    ...(SUBSCRIPTIONS_ENABLED && input.monthlySubscription ? { recurrence: ['RRULE:FREQ=WEEKLY'] } : {}),
    start: {
      dateTime: start.toISOString(),
      timeZone: 'Europe/Paris'
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: 'Europe/Paris'
    }
  }
}

export async function listGoogleCalendarEventInstances(calendarId: string, eventId: string) {
  const accessToken = await getValidAccessToken()
  const url = `${CALENDAR_EVENTS_URL}/${encodeCalendarId(calendarId)}/events/${encodeURIComponent(eventId)}/instances`
  const response = await $fetch<{ items?: GoogleCalendarEventResource[] }>(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  return response.items ?? []
}

export async function patchGoogleCalendarEvent(
  calendarId: string,
  eventId: string,
  body: Record<string, any>,
  sendUpdates: 'all' | 'externalOnly' | 'none' = 'none'
) {
  const accessToken = await getValidAccessToken()
  const params = new URLSearchParams({ sendUpdates })
  const url = `${CALENDAR_EVENTS_URL}/${encodeCalendarId(calendarId)}/events/${encodeURIComponent(eventId)}?${params.toString()}`

  return await $fetch<GoogleCalendarEventResource>(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body
  })
}

export async function upsertGoogleCalendarEvent(
  calendarId: string,
  input: GoogleCalendarReservationInput,
  eventId?: string | null
) {
  const accessToken = await getValidAccessToken()
  const payload = buildGoogleCalendarEventPayload(input)
  if (!payload) {
    return null
  }

  const baseUrl = `${CALENDAR_EVENTS_URL}/${encodeCalendarId(calendarId)}/events`
  const url = eventId ? `${baseUrl}/${encodeURIComponent(eventId)}` : baseUrl
  const method = eventId ? 'PUT' : 'POST'

  const response = await $fetch<{ id: string }>(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: payload
  })

  return response
}

export async function deleteGoogleCalendarEvent(calendarId: string, eventId: string) {
  const accessToken = await getValidAccessToken()
  const url = `${CALENDAR_EVENTS_URL}/${encodeCalendarId(calendarId)}/events/${encodeURIComponent(eventId)}`

  try {
    await $fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    })
  } catch (error: any) {
    const statusCode = Number(error?.statusCode ?? error?.status ?? 0)
    if (statusCode === 404 || statusCode === 410) {
      return { alreadyDeleted: true as const }
    }
    throw error
  }

  return { alreadyDeleted: false as const }
}
