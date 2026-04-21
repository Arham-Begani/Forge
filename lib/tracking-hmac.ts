import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'

function getSecret(): string {
  const s = process.env.TRACKING_SECRET
  if (!s) throw new Error('TRACKING_SECRET env var is not set')
  return s
}

/**
 * Returns a 64-char hex HMAC-SHA256 signature for the given campaign+lead pair.
 * Used to authenticate tracking pixel and click URLs embedded in emails.
 */
export function signTrackingToken(campaignId: string, leadId: string): string {
  return createHmac('sha256', getSecret())
    .update(`${campaignId}:${leadId}`)
    .digest('hex')
}

/**
 * Returns true only if `sig` is the correct HMAC for this campaign+lead pair.
 * Uses a constant-time comparison to prevent timing attacks.
 */
export function verifyTrackingToken(
  campaignId: string,
  leadId: string,
  sig: string | null
): boolean {
  if (!sig || sig.length !== 64) return false
  try {
    const expected = signTrackingToken(campaignId, leadId)
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(sig, 'hex')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
