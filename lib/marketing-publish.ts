import 'server-only'

import { Buffer } from 'node:buffer'
import { decryptSecret, encryptSecret } from '@/lib/marketing-crypto'
import {
  markSocialConnectionStatus,
  updateSocialConnectionTokens,
} from '@/lib/marketing-queries'
import type {
  MarketingAsset,
  ProviderPublishResult,
  SocialConnectionSecretRecord,
} from '@/lib/marketing.shared'

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

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`Unexpected provider response: ${text}`)
  }
}

export class MarketingProviderError extends Error {
  retryable: boolean
  requiresReauth: boolean

  constructor(message: string, options?: { retryable?: boolean; requiresReauth?: boolean }) {
    super(message)
    this.name = 'MarketingProviderError'
    this.retryable = options?.retryable ?? false
    this.requiresReauth = options?.requiresReauth ?? false
  }
}

async function refreshYouTubeAccessToken(connection: SocialConnectionSecretRecord): Promise<string> {
  const refreshToken = decryptSecret(connection.refresh_token_encrypted)
  if (!refreshToken) {
    await markSocialConnectionStatus(connection.id, 'reauth_required')
    throw new MarketingProviderError('YouTube connection needs to be reauthorized', {
      retryable: false,
      requiresReauth: true,
    })
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  const data = await parseJson<{
    access_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }>(response)

  if (!response.ok || !data.access_token) {
    await markSocialConnectionStatus(connection.id, 'reauth_required')
    throw new MarketingProviderError(data.error_description || data.error || 'Failed to refresh YouTube access token', {
      retryable: false,
      requiresReauth: true,
    })
  }

  const accessTokenEncrypted = encryptSecret(data.access_token)
  const expiresAt = typeof data.expires_in === 'number'
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null

  await updateSocialConnectionTokens(connection.id, accessTokenEncrypted, undefined, expiresAt)
  return data.access_token
}

async function refreshLinkedInAccessToken(connection: SocialConnectionSecretRecord): Promise<string> {
  const refreshToken = decryptSecret(connection.refresh_token_encrypted)
  if (!refreshToken) {
    await markSocialConnectionStatus(connection.id, 'reauth_required')
    throw new MarketingProviderError('LinkedIn connection needs to be reauthorized', {
      retryable: false,
      requiresReauth: true,
    })
  }

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: getLinkedInClientId(),
      client_secret: getLinkedInClientSecret(),
    }),
  })

  const data = await parseJson<{
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }>(response)

  if (!response.ok || !data.access_token) {
    await markSocialConnectionStatus(connection.id, 'reauth_required')
    throw new MarketingProviderError(data.error_description || data.error || 'Failed to refresh LinkedIn access token', {
      retryable: false,
      requiresReauth: true,
    })
  }

  await updateSocialConnectionTokens(
    connection.id,
    encryptSecret(data.access_token),
    data.refresh_token ? encryptSecret(data.refresh_token) : undefined,
    typeof data.expires_in === 'number' ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null
  )

  return data.access_token
}

async function getAccessToken(connection: SocialConnectionSecretRecord): Promise<string> {
  const token = decryptSecret(connection.access_token_encrypted)
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : null
  const isExpired = expiresAt !== null && expiresAt <= Date.now() + 60_000

  if (token && !isExpired && connection.status === 'active') {
    return token
  }

  if (connection.provider === 'youtube') {
    return refreshYouTubeAccessToken(connection)
  }

  return refreshLinkedInAccessToken(connection)
}

async function publishLinkedInAsset(
  asset: MarketingAsset,
  connection: SocialConnectionSecretRecord
): Promise<ProviderPublishResult> {
  const accessToken = await getAccessToken(connection)
  const payload = asObject(asset.payload)
  const linkUrl = stringValue(payload.linkUrl)
  const author = `urn:li:person:${connection.provider_account_id}`
  const body = asset.body.trim()

  if (!body) {
    throw new MarketingProviderError('LinkedIn post body is required', { retryable: false })
  }

  const mediaEntries = linkUrl
    ? [{
      status: 'READY',
      originalUrl: linkUrl,
      title: { text: asset.title || 'Learn more' },
    }]
    : []

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: body },
          shareMediaCategory: linkUrl ? 'ARTICLE' : 'NONE',
          media: mediaEntries,
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }),
  })

  if (response.status === 401 || response.status === 403) {
    await markSocialConnectionStatus(connection.id, 'reauth_required')
    throw new MarketingProviderError('LinkedIn authorization expired or is missing required scopes', {
      retryable: false,
      requiresReauth: true,
    })
  }

  if (!response.ok) {
    const bodyText = await response.text()
    throw new MarketingProviderError(`LinkedIn publish failed: ${bodyText}`, {
      retryable: response.status >= 500 || response.status === 429,
    })
  }

  const restliId = response.headers.get('x-restli-id')
  return {
    providerAssetId: restliId,
    permalink: null,
    metadata: restliId ? { restliId } : {},
  }
}

async function publishYouTubeAsset(
  asset: MarketingAsset,
  connection: SocialConnectionSecretRecord
): Promise<ProviderPublishResult> {
  const accessToken = await getAccessToken(connection)
  const payload = asObject(asset.payload)
  const videoSourceUrl = stringValue(payload.videoSourceUrl)
  const privacyStatus = stringValue(payload.privacyStatus) || 'unlisted'
  const tags = stringArray(payload.tags)
  const categoryId = stringValue(payload.categoryId) || '28'

  if (!videoSourceUrl) {
    throw new MarketingProviderError('YouTube video source URL is required before publishing', { retryable: false })
  }

  const sourceResponse = await fetch(videoSourceUrl)
  if (!sourceResponse.ok) {
    throw new MarketingProviderError(`Unable to fetch video source: ${sourceResponse.status}`, {
      retryable: sourceResponse.status >= 500,
    })
  }

  const sourceContentType = sourceResponse.headers.get('content-type') || 'video/mp4'
  const videoBuffer = Buffer.from(await sourceResponse.arrayBuffer())

  const sessionResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Length': String(videoBuffer.byteLength),
      'X-Upload-Content-Type': sourceContentType,
    },
    body: JSON.stringify({
      snippet: {
        title: asset.title,
        description: asset.body,
        tags,
        categoryId,
      },
      status: {
        privacyStatus,
      },
    }),
  })

  if (sessionResponse.status === 401 || sessionResponse.status === 403) {
    await markSocialConnectionStatus(connection.id, 'reauth_required')
    throw new MarketingProviderError('YouTube authorization expired or is missing upload scope', {
      retryable: false,
      requiresReauth: true,
    })
  }

  if (!sessionResponse.ok) {
    const bodyText = await sessionResponse.text()
    throw new MarketingProviderError(`YouTube upload session failed: ${bodyText}`, {
      retryable: sessionResponse.status >= 500 || sessionResponse.status === 429,
    })
  }

  const uploadUrl = sessionResponse.headers.get('location')
  if (!uploadUrl) {
    throw new MarketingProviderError('YouTube upload session did not return an upload URL', { retryable: false })
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(videoBuffer.byteLength),
      'Content-Type': sourceContentType,
    },
    body: videoBuffer,
  })

  if (!uploadResponse.ok) {
    const bodyText = await uploadResponse.text()
    throw new MarketingProviderError(`YouTube video upload failed: ${bodyText}`, {
      retryable: uploadResponse.status >= 500 || uploadResponse.status === 429,
    })
  }

  const videoData = await parseJson<{ id?: string }>(uploadResponse)
  const videoId = typeof videoData.id === 'string' ? videoData.id : null

  return {
    providerAssetId: videoId,
    permalink: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
    metadata: videoId ? { videoId } : {},
  }
}

export async function publishMarketingAsset(
  asset: MarketingAsset,
  connection: SocialConnectionSecretRecord
): Promise<ProviderPublishResult> {
  if (asset.provider !== connection.provider) {
    throw new MarketingProviderError('Asset/provider mismatch', { retryable: false })
  }

  if (asset.provider === 'linkedin') {
    return publishLinkedInAsset(asset, connection)
  }

  return publishYouTubeAsset(asset, connection)
}
