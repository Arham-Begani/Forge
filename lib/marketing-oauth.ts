import 'server-only'

import { decryptSecret, encryptSecret } from '@/lib/marketing-crypto'
import type { SocialProvider } from '@/lib/marketing.shared'

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/youtube.upload',
]

const LINKEDIN_SCOPES = [
  'openid',
  'profile',
  'email',
  'w_member_social',
]

export interface PendingOAuthState {
  state: string
  provider: SocialProvider
  userId: string
  returnTo: string
  createdAt: string
}

export interface OAuthExchangeResult {
  accessToken: string
  refreshToken?: string | null
  expiresIn: number | null
  scopes: string[]
  providerAccountId: string
  providerAccountLabel: string
  metadata: Record<string, unknown>
}

function getGoogleClientId(): string {
  const value = process.env.GOOGLE_CLIENT_ID
  if (!value) throw new Error('GOOGLE_CLIENT_ID is required for YouTube integration')
  return value
}

function getGoogleClientSecret(): string {
  const value = process.env.GOOGLE_CLIENT_SECRET
  if (!value) throw new Error('GOOGLE_CLIENT_SECRET is required for YouTube integration')
  return value
}

function getLinkedInClientId(): string {
  const value = process.env.LINKEDIN_CLIENT_ID
  if (!value) throw new Error('LINKEDIN_CLIENT_ID is required for LinkedIn integration')
  return value
}

function getLinkedInClientSecret(): string {
  const value = process.env.LINKEDIN_CLIENT_SECRET
  if (!value) throw new Error('LINKEDIN_CLIENT_SECRET is required for LinkedIn integration')
  return value
}

export function getOAuthCookieName(provider: SocialProvider): string {
  return `marketing_oauth_${provider}`
}

export function normalizeIntegrationReturnPath(returnTo: string | null | undefined): string {
  if (returnTo && returnTo.startsWith('/dashboard')) {
    return returnTo
  }
  return '/dashboard'
}

export function encodePendingOAuthState(state: PendingOAuthState): string {
  const encrypted = encryptSecret(JSON.stringify(state))
  if (!encrypted) {
    throw new Error('Failed to encode OAuth state')
  }
  return encrypted
}

export function decodePendingOAuthState(value: string | undefined): PendingOAuthState | null {
  if (!value) return null

  try {
    const decoded = decryptSecret(value)
    if (!decoded) return null
    const parsed = JSON.parse(decoded) as Partial<PendingOAuthState>
    if (
      typeof parsed.state !== 'string' ||
      typeof parsed.provider !== 'string' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.returnTo !== 'string' ||
      typeof parsed.createdAt !== 'string'
    ) {
      return null
    }

    return {
      state: parsed.state,
      provider: parsed.provider as SocialProvider,
      userId: parsed.userId,
      returnTo: normalizeIntegrationReturnPath(parsed.returnTo),
      createdAt: parsed.createdAt,
    }
  } catch {
    return null
  }
}

export function buildProviderAuthorizationUrl(provider: SocialProvider, input: {
  redirectUri: string
  state: string
}): string {
  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: input.redirectUri,
    state: input.state,
  })

  if (provider === 'youtube') {
    params.set('client_id', getGoogleClientId())
    params.set('access_type', 'offline')
    params.set('prompt', 'consent')
    params.set('scope', GOOGLE_SCOPES.join(' '))
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  params.set('client_id', getLinkedInClientId())
  params.set('scope', LINKEDIN_SCOPES.join(' '))
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`Unexpected provider response: ${text}`)
  }
}

export async function exchangeProviderCode(provider: SocialProvider, input: {
  code: string
  redirectUri: string
}): Promise<OAuthExchangeResult> {
  if (provider === 'youtube') {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: input.code,
        client_id: getGoogleClientId(),
        client_secret: getGoogleClientSecret(),
        redirect_uri: input.redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await parseJson<{
      access_token?: string
      refresh_token?: string
      expires_in?: number
      scope?: string
      error?: string
      error_description?: string
    }>(tokenResponse)

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'Google token exchange failed')
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profileData = await parseJson<Record<string, unknown>>(profileResponse)
    if (!profileResponse.ok) {
      throw new Error('Failed to fetch Google profile for YouTube integration')
    }

    const providerAccountId = typeof profileData.sub === 'string' ? profileData.sub : ''
    const providerAccountLabel =
      (typeof profileData.name === 'string' && profileData.name) ||
      (typeof profileData.email === 'string' && profileData.email) ||
      'YouTube account'

    if (!providerAccountId) {
      throw new Error('Google profile response is missing account identity')
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      expiresIn: typeof tokenData.expires_in === 'number' ? tokenData.expires_in : null,
      scopes: typeof tokenData.scope === 'string' ? tokenData.scope.split(/\s+/).filter(Boolean) : GOOGLE_SCOPES,
      providerAccountId,
      providerAccountLabel,
      metadata: {
        email: typeof profileData.email === 'string' ? profileData.email : null,
        picture: typeof profileData.picture === 'string' ? profileData.picture : null,
      },
    }
  }

  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.code,
      client_id: getLinkedInClientId(),
      client_secret: getLinkedInClientSecret(),
      redirect_uri: input.redirectUri,
    }),
  })

  const tokenData = await parseJson<{
    access_token?: string
    refresh_token?: string
    expires_in?: number
    scope?: string
    error?: string
    error_description?: string
  }>(tokenResponse)

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'LinkedIn token exchange failed')
  }

  const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const profileData = await parseJson<Record<string, unknown>>(profileResponse)
  if (!profileResponse.ok) {
    throw new Error('Failed to fetch LinkedIn profile')
  }

  const providerAccountId = typeof profileData.sub === 'string' ? profileData.sub : ''
  const providerAccountLabel =
    (typeof profileData.name === 'string' && profileData.name) ||
    (typeof profileData.email === 'string' && profileData.email) ||
    'LinkedIn member'

  if (!providerAccountId) {
    throw new Error('LinkedIn profile response is missing account identity')
  }

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token ?? null,
    expiresIn: typeof tokenData.expires_in === 'number' ? tokenData.expires_in : null,
    scopes: typeof tokenData.scope === 'string' ? tokenData.scope.split(/\s+/).filter(Boolean) : LINKEDIN_SCOPES,
    providerAccountId,
    providerAccountLabel,
    metadata: {
      email: typeof profileData.email === 'string' ? profileData.email : null,
      locale: typeof profileData.locale === 'string' ? profileData.locale : null,
    },
  }
}
