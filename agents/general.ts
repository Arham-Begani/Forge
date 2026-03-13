import {
    getFlashModel,
    streamPrompt,
    withTimeout,
} from '@/lib/gemini'

// ── General Chat Agent ──────────────────────────────────────────────────────
// A conversational agent for general venture questions — name suggestions,
// feature ideas, quick feedback, etc. Output is NOT written to venture context.

interface VentureInput {
    ventureId: string
    name: string
    globalIdea?: string
    context: Record<string, unknown>
}

const SYSTEM_PROMPT = `
# Forge AI — General Assistant

You are Forge's general-purpose assistant embedded inside a venture workspace. You help founders think through their venture by answering questions, brainstorming ideas, and providing quick feedback.

## Your Role
- Answer general business questions conversationally
- Suggest names, features, taglines, pricing strategies, and more
- Help brainstorm and refine ideas
- Provide quick opinions and recommendations
- Keep responses concise, actionable, and founder-friendly

## What You Know
You have access to the venture's context — any research, branding, marketing, or feasibility data that has already been generated. Use this to give informed, contextual answers.

## Tone
- Direct and helpful, like a sharp co-founder
- No fluff or corporate speak
- Use bullet points and clear structure when listing things
- Be opinionated — founders need clear direction, not wishy-washy hedging

## Important Rules
- You do NOT generate structured JSON output
- You do NOT run formal analyses — that's what the specialized modules are for
- If a question is better suited for a specialized module (Research, Branding, etc.), suggest the user switch to that module
- Keep responses focused and under 800 words unless the user asks for more detail
`

export async function runGeneralAgent(
    venture: VentureInput,
    onStream: (chunk: string) => Promise<void>,
    onComplete: (result: Record<string, unknown>) => Promise<void>,
): Promise<void> {
    const model = getFlashModel()

    // Build context summary from existing venture data
    const contextParts: string[] = []
    if (venture.globalIdea) {
        contextParts.push(`**Venture Idea:** ${venture.globalIdea}`)
    }
    const ctx = venture.context || {}
    if (ctx.research) {
        const r = ctx.research as Record<string, unknown>
        contextParts.push(`**Research:** Market summary: ${r.marketSummary || 'N/A'}. TAM: ${typeof r.tam === 'object' ? (r.tam as any)?.value : r.tam || 'N/A'}`)
    }
    if (ctx.branding) {
        const b = ctx.branding as Record<string, unknown>
        contextParts.push(`**Branding:** Brand name: ${b.brandName || 'N/A'}. Tagline: ${b.tagline || 'N/A'}`)
    }
    if (ctx.feasibility) {
        const f = ctx.feasibility as Record<string, unknown>
        contextParts.push(`**Feasibility:** Verdict: ${f.verdict || 'N/A'}`)
    }

    const contextBlock = contextParts.length > 0
        ? `\n\n## Venture Context\n${contextParts.join('\n')}`
        : ''

    const userMessage = `${venture.name}${contextBlock}`

    const fullText = await withTimeout(
        streamPrompt(model, SYSTEM_PROMPT, userMessage, onStream),
        60_000
    )

    // General chat stores the response as plain text — no structured JSON
    await onComplete({
        type: 'general-chat',
        response: fullText,
    })
}
