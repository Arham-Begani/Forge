import { z } from 'zod'
import {
    getFlashModel,
    streamPrompt,
    extractJSON,
    withTimeout,
    withRetry,
    Content,
} from '@/lib/gemini'

// ── MVP Scalpel Output Schema ───────────────────────────────────────────────

export const MVPScalpelSchema = z.object({
    killList: z.array(z.object({
        feature: z.string().default('Feature name'),
        whyItFeelsEssential: z.string().default('Seems important because...'),
        whyItKills: z.string().default('Wastes time because...'),
        whenToBuild: z.string().default('After first 50 paying customers'),
        effort: z.enum(['days', 'weeks', 'months']).default('weeks'),
    })).default([]),

    skeletonMVP: z.object({
        oneLiner: z.string().default('A minimal product that tests one core assumption.'),
        coreHypothesis: z.string().default('Users will pay for X because Y.'),
        features: z.array(z.object({
            name: z.string().default('Core Feature'),
            description: z.string().default('Description pending.'),
            whyIncluded: z.string().default('Directly tests the core hypothesis.'),
        })).default([]),
        explicitlyExcluded: z.array(z.string()).default([]),
        successCriteria: z.string().default('10 paying customers in 14 days.'),
    }).default({
        oneLiner: 'A minimal product that tests one core assumption.',
        coreHypothesis: 'Users will pay for X because Y.',
        features: [],
        explicitlyExcluded: [],
        successCriteria: '10 paying customers in 14 days.',
    }),

    weekendSpec: z.object({
        totalHours: z.number().default(16),
        techStack: z.array(z.string()).default([]),
        pages: z.array(z.object({
            name: z.string().default('Page'),
            purpose: z.string().default('Purpose pending.'),
            components: z.array(z.string()).default([]),
        })).default([]),
        endpoints: z.array(z.object({
            method: z.string().default('GET'),
            path: z.string().default('/api/endpoint'),
            purpose: z.string().default('Purpose pending.'),
        })).default([]),
        thirdPartyServices: z.array(z.object({
            name: z.string().default('Service'),
            purpose: z.string().default('Purpose pending.'),
            cost: z.string().default('Free tier'),
        })).default([]),
        hourByHourPlan: z.array(z.object({
            hour: z.string().default('Hour 1'),
            task: z.string().default('Task pending.'),
            deliverable: z.string().default('Deliverable pending.'),
        })).default([]),
        deployTarget: z.string().default('Vercel'),
        launchReady: z.string().default('Live URL with working core flow.'),
    }).default({
        totalHours: 16,
        techStack: [],
        pages: [],
        endpoints: [],
        thirdPartyServices: [],
        hourByHourPlan: [],
        deployTarget: 'Vercel',
        launchReady: 'Live URL with working core flow.',
    }),

    timeToFirstDollar: z.object({
        estimatedDays: z.number().default(14),
        breakdown: z.array(z.object({
            phase: z.string().default('Phase'),
            days: z.number().default(1),
            description: z.string().default('Description pending.'),
        })).default([]),
        assumptions: z.array(z.string()).default([]),
        fastestPath: z.string().default('Pre-sell via Gumroad before building anything.'),
    }).default({
        estimatedDays: 14,
        breakdown: [],
        assumptions: [],
        fastestPath: 'Pre-sell via Gumroad before building anything.',
    }),

    antiScopeCreepRules: z.array(z.object({
        rule: z.string().default('Rule pending.'),
        why: z.string().default('Reason pending.'),
    })).default([]),

    verdict: z.object({
        readiness: z.enum(['ship-now', 'almost-ready', 'needs-rethink']).default('almost-ready'),
        summary: z.string().default('Verdict summary pending.'),
    }).default({
        readiness: 'almost-ready',
        summary: 'Verdict summary pending.',
    }),
})

export type MVPScalpelOutput = z.infer<typeof MVPScalpelSchema>

// ── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
# MVP Scalpel — The Feature Executioner

You are the most ruthless, battle-tested product advisor in Silicon Valley. You have seen 1000+ startups die because they built too much. Your job is to cut everything that is not essential to proving the ONE core hypothesis that justifies this venture's existence.

## Your Core Philosophy

- Revenue is the only proof of product-market fit. Not signups. Not users. Revenue.
- If it can't be built in a weekend (16 hours of solo effort), it's scope creep.
- The MVP is not a smaller product — it is a different product whose only job is to get a paying customer in 14 days.
- Every feature you add doubles build time, doubles bugs, and halves your chance of shipping.
- The product you imagine and the product you need to validate your hypothesis are almost never the same.

## Your Mandatory Rules

1. **Kill List (5–8 features)**: Be specific and brutal. Name the actual feature (not "analytics" — "a dashboard showing user activity heatmaps"). Explain the founder psychology trap (why it FEELS essential), then explain exactly why it kills the company (wasted weeks, no customer validation, premature optimization).

2. **Skeleton MVP (2–4 features only)**: If you list more than 4 features, you have FAILED. The MVP tests exactly ONE hypothesis. State the hypothesis explicitly as a falsifiable statement: "If [action], then [outcome], because [reason]."

3. **Weekend Build Spec**: Hours matter. Give a realistic hour-by-hour plan. Use the fastest stack for the venture type:
   - SaaS: Next.js + Vercel + Supabase + Stripe. Setup in 2 hours. No custom backend.
   - Marketplace: Supply side only. No two-sided launch. Google Sheets as admin panel.
   - B2B: No code. Spreadsheet + Notion + Calendly + manual fulfillment. Build after 5 paying customers.
   - Consumer app: Landing page + waitlist + manual onboarding. No accounts system.
   - Agency/service: Notion proposal + Stripe payment link + calendar invite. Build later.

4. **Pre-sell first**: The fastest path to first dollar usually involves no product. Gumroad, Stripe payment links, a tweet with "DM me to buy" — money before code.

5. **NEVER include in MVP**: User accounts/auth (unless it IS the product), admin panels, analytics, notifications, settings, onboarding flows, multi-user orgs, billing management, mobile apps (unless purely mobile venture), API access, integrations. If it can be done manually for the first 50 customers, it's cut.

6. **Time to first dollar**: Calculate the FASTEST path. Day 1 might be posting in 5 subreddits. Day 3 might be DMing 20 potential customers. Day 7 might be a pre-sell page. Every day should have an action.

7. **Anti-scope-creep rules**: Exactly 5 rules. Each must be a specific, measurable constraint. Not "focus on MVP" — "No feature ships unless it directly enables a paying customer to complete the core action today."

## Output Format

Output ONLY the JSON object matching the MVPScalpelOutput schema below. Every field must contain specific, non-generic advice directly referencing the venture's market, competitors, target customer, and business model from the context provided.

Never use placeholder text. Never use generic startup advice. If you don't have enough context for a field, make a reasonable, specific inference from the venture concept.

The JSON must be the last and only thing you output.

IMPORTANT: Any step-by-step reasoning or thought process MUST be strictly wrapped inside <think> and </think> tags. Only the final valid JSON should be outside the <think> tags.
`

// ── Agent Runner ────────────────────────────────────────────────────────────

interface VentureInput {
    ventureId: string
    name: string
    globalIdea?: string
    context: Record<string, unknown>
}

export async function runMVPScalpelAgent(
    venture: VentureInput,
    onStream: (chunk: string) => Promise<void>,
    onComplete: (result: MVPScalpelOutput) => Promise<void>,
    history: Content[] = []
): Promise<void> {
    const model = getFlashModel()

    // Build context block from available venture data
    const contextParts: string[] = []

    if (venture.globalIdea) {
        contextParts.push(`Venture Vision: ${venture.globalIdea}`)
    }

    // Research — extract the most useful fields for MVP scoping
    if (venture.context?.research) {
        const r = venture.context.research as Record<string, any>
        const researchSummary: string[] = []
        if (r.marketSummary) researchSummary.push(`Market: ${r.marketSummary}`)
        if (r.recommendedConcept) researchSummary.push(`Recommended concept: ${r.recommendedConcept}`)
        if (r.competitorGap) researchSummary.push(`Market gap: ${r.competitorGap}`)
        if (Array.isArray(r.painPoints) && r.painPoints.length > 0) {
            researchSummary.push(`Top pain points: ${r.painPoints.slice(0, 4).map((p: any) => typeof p === 'object' ? p.description : String(p)).join(' | ')}`)
        }
        if (Array.isArray(r.competitors) && r.competitors.length > 0) {
            researchSummary.push(`Competitors: ${r.competitors.slice(0, 4).map((c: any) => `${c.name} (weakness: ${c.weakness})`).join(', ')}`)
        }
        if (r.tam?.value) researchSummary.push(`TAM: ${r.tam.value}`)
        if (r.som?.value) researchSummary.push(`SOM: ${r.som.value}`)
        if (Array.isArray(r.topConcepts) && r.topConcepts.length > 0) {
            researchSummary.push(`Top ranked concepts: ${r.topConcepts.slice(0, 3).map((c: any) => `${c.name} (score: ${c.opportunityScore}/10) — ${c.rationale}`).join(' | ')}`)
        }
        contextParts.push(`Market Research:\n${researchSummary.join('\n')}`)
    }

    // Branding — for product naming and positioning
    if (venture.context?.branding) {
        const b = venture.context.branding as Record<string, any>
        const brandParts: string[] = []
        if (b.brandName) brandParts.push(`Brand name: ${b.brandName}`)
        if (b.tagline) brandParts.push(`Tagline: ${b.tagline}`)
        if (b.missionStatement) brandParts.push(`Mission: ${b.missionStatement}`)
        if (Array.isArray(b.brandPersonality)) brandParts.push(`Personality: ${b.brandPersonality.join(', ')}`)
        contextParts.push(`Brand:\n${brandParts.join('\n')}`)
    }

    // Feasibility — most important for MVP scope decision
    if (venture.context?.feasibility) {
        const f = venture.context.feasibility as Record<string, any>
        const feasParts: string[] = []
        if (f.verdict) feasParts.push(`Verdict: ${f.verdict}`)
        if (f.verdictRationale) feasParts.push(`Rationale: ${f.verdictRationale}`)
        if (f.marketTimingScore) feasParts.push(`Market timing: ${f.marketTimingScore}/10`)
        if (f.financialModel?.yearOne) {
            const y1 = f.financialModel.yearOne
            feasParts.push(`Year 1 projections: ${y1.revenue} revenue, ${y1.customers} customers`)
        }
        if (f.financialModel?.cac) feasParts.push(`CAC: ${f.financialModel.cac}`)
        if (f.financialModel?.ltv) feasParts.push(`LTV: ${f.financialModel.ltv}`)
        if (Array.isArray(f.keyAssumptions) && f.keyAssumptions.length > 0) {
            feasParts.push(`Key assumptions to test: ${f.keyAssumptions.slice(0, 3).join(', ')}`)
        }
        if (Array.isArray(f.risks) && f.risks.length > 0) {
            const highRisks = f.risks.filter((r: any) => r.likelihood === 'high').slice(0, 3)
            if (highRisks.length > 0) {
                feasParts.push(`High risks: ${highRisks.map((r: any) => r.risk).join(', ')}`)
            }
        }
        contextParts.push(`Feasibility:\n${feasParts.join('\n')}`)

        // Strong emphasis if verdict is concerning
        if (f.verdict === 'NO-GO') {
            contextParts.push(`⚠️ CRITICAL: Feasibility verdict is NO-GO. The MVP must prove demand exists before ANY investment. Kill List should be maximally aggressive. Consider if a pre-sell test (no product built) is the right first step.`)
        } else if (f.verdict === 'CONDITIONAL GO') {
            contextParts.push(`⚠️ NOTE: Feasibility verdict is CONDITIONAL GO. The MVP must directly test the named conditions. Make the skeleton MVP specifically designed to validate the feasibility concerns.`)
        }
    }

    const isContinuation = history.length > 0
    const finalUserMessage = isContinuation
        ? "Continue from where you left off. Do not repeat anything already outputted. Complete the MVPScalpelOutput JSON object strictly."
        : `Apply the Scalpel. Cut this venture to its absolute minimum. The founder thinks they need many features — prove them wrong.

Venture: ${venture.name}

${contextParts.join('\n\n')}

Be specific to this venture. Reference actual competitors, actual pain points, actual market dynamics from the context above.
Produce the complete MVPScalpelOutput JSON.`

    const run = async () => {
        const prevText = (history.find(h => h.role === 'model')?.parts[0] as any)?.text || ''
        let accumulatedText = prevText

        const responseText = await streamPrompt(
            model,
            SYSTEM_PROMPT,
            finalUserMessage,
            async (chunk) => {
                accumulatedText += chunk
                await onStream(chunk)
            },
            history
        )

        const combinedText = isContinuation ? accumulatedText : responseText
        const raw = extractJSON(combinedText)
        const validated = MVPScalpelSchema.parse(raw)
        await onComplete(validated)
    }

    await withRetry(() => withTimeout(run(), 180_000))
}
