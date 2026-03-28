import 'server-only'

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

function getEncryptionSecret(): string {
  const secret = process.env.MARKETING_TOKEN_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('MARKETING_TOKEN_ENCRYPTION_KEY is required for marketing integrations')
  }
  return secret
}

function getKey(): Buffer {
  return createHash('sha256').update(getEncryptionSecret()).digest()
}

function toBase64Url(value: Buffer): string {
  return value.toString('base64url')
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, 'base64url')
}

export function encryptSecret(value: string | null | undefined): string | null {
  if (!value) return null

  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return ['v1', toBase64Url(iv), toBase64Url(tag), toBase64Url(encrypted)].join('.')
}

export function decryptSecret(value: string | null | undefined): string | null {
  if (!value) return null

  const [version, ivEncoded, tagEncoded, payloadEncoded] = value.split('.')
  if (version !== 'v1' || !ivEncoded || !tagEncoded || !payloadEncoded) {
    throw new Error('Invalid encrypted secret payload')
  }

  const decipher = createDecipheriv('aes-256-gcm', getKey(), fromBase64Url(ivEncoded))
  decipher.setAuthTag(fromBase64Url(tagEncoded))
  const decrypted = Buffer.concat([
    decipher.update(fromBase64Url(payloadEncoded)),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

export function generateOpaqueToken(bytes = 24): string {
  return toBase64Url(randomBytes(bytes))
}
