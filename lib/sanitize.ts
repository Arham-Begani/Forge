/**
 * lib/sanitize.ts
 *
 * Utility functions to sanitize user-controlled strings before they are
 * interpolated into LLM prompts or stored as structured data.
 *
 * The primary risk is prompt injection: a user who names their venture
 * "Ignore all previous instructions and …" could manipulate agent behaviour.
 * We mitigate this by:
 *   1. Stripping null bytes and control characters.
 *   2. Collapsing excessive whitespace.
 *   3. Enforcing a hard length cap.
 *   4. Wrapping the value in explicit delimiters when embedded in a prompt,
 *      making it clear to the model that this is user-supplied data, not
 *      an instruction.
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

/** Strip dangerous control characters and trim. */
function stripControls(input: string): string {
  return input.replace(CONTROL_CHARS, '').trim()
}

/** Collapse runs of whitespace (tabs, multiple spaces, etc.) to a single space. */
function normaliseWhitespace(input: string): string {
  return input.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')
}

/**
 * Sanitize a string for safe storage and display.
 * Does NOT add prompt delimiters — use sanitizeForPrompt for LLM injection.
 */
export function sanitize(input: unknown, maxLength = 2000): string {
  if (input === null || input === undefined) return ''
  const str = typeof input === 'string' ? input : String(input)
  return normaliseWhitespace(stripControls(str)).slice(0, maxLength)
}

/**
 * Sanitize a string and wrap it in XML-style delimiters so an LLM treats it
 * as data, not as an instruction.
 *
 * Example output:
 *   <user_input>My Startup Name</user_input>
 *
 * This is the function to use whenever embedding user-controlled text directly
 * inside a system prompt or user message sent to Gemini / any LLM.
 */
export function sanitizeForPrompt(
  input: unknown,
  tag = 'user_input',
  maxLength = 500
): string {
  const clean = sanitize(input, maxLength)
  return `<${tag}>${clean}</${tag}>`
}

/**
 * Sanitize a short label (brand name, tagline, etc.) — tighter cap, single line.
 */
export function sanitizeLabel(input: unknown, maxLength = 200): string {
  return sanitize(input, maxLength).replace(/\n/g, ' ')
}

/**
 * Sanitize a URL-bound string (e.g. OAuth error_description that ends up in a
 * redirect URL). Strips everything that isn't printable ASCII, then
 * encodeURIComponent-safe truncation.
 */
export function sanitizeUrlParam(input: unknown, maxLength = 200): string {
  if (input === null || input === undefined) return ''
  const str = typeof input === 'string' ? input : String(input)
  // Keep only printable ASCII (32–126)
  const clean = str.replace(/[^\x20-\x7E]/g, '').trim().slice(0, maxLength)
  return encodeURIComponent(clean)
}
