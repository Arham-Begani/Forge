import 'server-only'

import type { CreateMarketingAssetSeed } from '@/lib/marketing.shared'

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function truncate(value: string, length: number): string {
  if (value.length <= length) return value
  return `${value.slice(0, Math.max(0, length - 1)).trimEnd()}…`
}

function normalizeHashtags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag.replace(/^#+/, '')}`))
  }

  if (typeof value === 'string') {
    return value
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => item.startsWith('#'))
  }

  return []
}

function extractSocialPostText(entry: unknown): string {
  const record = asObject(entry)
  if (!record) {
    return typeof entry === 'string' ? cleanText(entry) : ''
  }

  return cleanText(
    firstString(
      record.content,
      record.caption,
      record.text,
      record.copy,
      record.post,
      record.body,
      record.description
    )
  )
}

function extractSocialLink(entry: unknown): string | null {
  const record = asObject(entry)
  if (!record) return null
  const link = firstString(record.linkUrl, record.url, record.link, record.ctaUrl)
  return link || null
}

function extractMarketingOverview(marketing: Record<string, unknown> | null | undefined): string {
  if (!marketing) return ''
  const gtm = asObject(marketing.gtmStrategy)
  return cleanText(
    firstString(
      gtm?.overview,
      marketing.theme,
      marketing.marketingPlan,
      marketing.summary
    )
  )
}

function extractMarketingPlan(marketing: Record<string, unknown> | null | undefined): string {
  if (!marketing) return ''
  const gtm = asObject(marketing.gtmStrategy)
  return cleanText(firstString(marketing.marketingPlan, gtm?.marketingPlan))
}

function extractKeywords(marketing: Record<string, unknown> | null | undefined, ventureName: string): string[] {
  const gtm = asObject(marketing?.gtmStrategy)
  const channels = asArray(gtm?.channels ?? marketing?.channels)
    .map((channel) => firstString(channel, asObject(channel)?.name, asObject(channel)?.title))
    .filter(Boolean)
  const base = [
    ventureName,
    ...ventureName.split(/\s+/),
    ...channels,
  ]

  return [...new Set(base.map((item) => item.trim()).filter(Boolean))].slice(0, 8)
}

export function buildLinkedInDraftSeeds(
  ventureName: string,
  marketing: Record<string, unknown> | null | undefined,
  limit = 5
): CreateMarketingAssetSeed[] {
  const socialCalendar = asArray(marketing?.socialCalendar)
  const seeds = socialCalendar
    .map((entry, index) => {
      const text = extractSocialPostText(entry)
      if (!text) return null

      const hashtags = normalizeHashtags(asObject(entry)?.hashtags)
      const composedBody = cleanText([text, hashtags.join(' ')].filter(Boolean).join('\n\n'))
      const title = truncate(firstString(asObject(entry)?.title, composedBody, `${ventureName} LinkedIn post ${index + 1}`), 90)

      return {
        provider: 'linkedin' as const,
        assetType: 'linkedin_post' as const,
        title,
        body: composedBody,
        payload: {
          linkUrl: extractSocialLink(entry),
          visibility: 'PUBLIC',
        },
      }
    })
    .filter(Boolean)
    .slice(0, limit)

  if (seeds.length > 0) return seeds as CreateMarketingAssetSeed[]

  const overview = extractMarketingOverview(marketing)
  if (!overview) return []

  return [{
    provider: 'linkedin',
    assetType: 'linkedin_post',
    title: truncate(`${ventureName} launch update`, 90),
    body: overview,
    payload: {
      linkUrl: null,
      visibility: 'PUBLIC',
    },
  }]
}

export function buildYouTubeDraftSeed(
  ventureName: string,
  marketing: Record<string, unknown> | null | undefined
): CreateMarketingAssetSeed | null {
  const overview = extractMarketingOverview(marketing)
  const marketingPlan = extractMarketingPlan(marketing)
  const description = cleanText(
    [
      overview,
      marketingPlan,
      `Learn more about ${ventureName} and follow the launch journey.`,
    ].filter(Boolean).join('\n\n')
  )

  if (!description) return null

  return {
    provider: 'youtube',
    assetType: 'youtube_video',
    title: truncate(`${ventureName}: launch story and what comes next`, 100),
    body: description,
    payload: {
      videoSourceUrl: '',
      privacyStatus: 'unlisted',
      tags: extractKeywords(marketing, ventureName),
      categoryId: '28',
    },
  }
}
