// app/api/ventures/[id]/questions/route.ts
import { requireAuth, isAuthError } from '@/lib/auth'
import { getVenture, getProject } from '@/lib/queries'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getFlashModel, extractJSON } from '@/lib/gemini'

const bodySchema = z.object({
    moduleId: z.enum(['research', 'branding', 'marketing', 'landing', 'feasibility', 'full-launch']),
    prompt: z.string().min(1).max(2000),
})

const QuestionSchema = z.object({
    questions: z.array(z.object({
        id: z.string(),
        category: z.string(),
        question: z.string(),
        options: z.array(z.object({
            label: z.string(),
            description: z.string(),
            recommended: z.boolean().optional(),
        })),
    })).min(1).max(4),
})

const MODULE_CONTEXT: Record<string, string> = {
    'research': 'market research, competitive analysis, TAM/SAM/SOM sizing, and pain point discovery',
    'branding': 'brand identity, naming, color palette, typography, tone of voice, and brand archetype',
    'marketing': '30-day go-to-market strategy, social media calendar, SEO outlines, and email sequences',
    'landing': 'landing page design, sitemap, copy, hero sections, pricing, and CTA strategy',
    'feasibility': 'financial modeling, risk assessment, GO/NO-GO verdict, and 3-year projections',
    'full-launch': 'complete venture package including research, branding, landing page, and feasibility',
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth()
        const { id } = await params

        const body = await request.json()
        const parsed = bodySchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        const { moduleId, prompt } = parsed.data
        const venture = await getVenture(id, session.userId)
        if (!venture) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        const project = venture.project_id ? await getProject(venture.project_id, session.userId) : null
        const context = venture.context as unknown as Record<string, unknown>
        const moduleDesc = MODULE_CONTEXT[moduleId] || 'venture building'

        // Build context summary for the AI
        const contextParts: string[] = []
        if (project?.global_idea) contextParts.push(`Global Idea: ${project.global_idea}`)
        if (venture.name) contextParts.push(`Venture Name: ${venture.name}`)
        if (context?.research) contextParts.push(`Research data exists: yes`)
        if (context?.branding) contextParts.push(`Branding data exists: yes`)
        if (context?.marketing) contextParts.push(`Marketing data exists: yes`)
        if (context?.landing) contextParts.push(`Landing page data exists: yes`)
        if (context?.feasibility) contextParts.push(`Feasibility data exists: yes`)

        const systemPrompt = `You are Forge, an AI venture orchestrator. Before running a ${moduleId} agent for the user, you need to ask 2-3 important strategic questions so the user has input on key decisions.

The ${moduleId} module handles: ${moduleDesc}

${contextParts.length > 0 ? `Current venture context:\n${contextParts.join('\n')}` : 'This is a fresh venture with no prior context.'}

Generate 2-3 focused questions that would help produce better, more personalized results. Each question should:
- Address a real strategic decision the user should weigh in on
- Have 2-3 clear options (one can be marked as recommended)
- Include a brief description for each option explaining the tradeoff
- Have a category label (1-2 words like "Target Market", "Brand Voice", "Risk Appetite")

Respond with ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "id": "q1",
      "category": "Category Name",
      "question": "The question text?",
      "options": [
        { "label": "Option A", "description": "What this means", "recommended": true },
        { "label": "Option B", "description": "What this means" }
      ]
    }
  ]
}`

        const model = getFlashModel()
        const chat = model.startChat({
            history: [],
            systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
        })

        const result = await chat.sendMessage(`The user wants to run the ${moduleId} module with this prompt: "${prompt}"

Generate 2-3 strategic questions for the user to answer before we proceed.`)

        const text = result.response.text()
        const json = extractJSON(text)
        const validated = QuestionSchema.safeParse(json)

        if (!validated.success) {
            // If validation fails, return a default set
            return NextResponse.json({ questions: [] })
        }

        return NextResponse.json({ questions: validated.data.questions })

    } catch (e) {
        if (isAuthError(e)) return (e as any).toResponse()
        console.error('Questions generation failed:', e)
        // Graceful degradation — if question gen fails, just return empty
        return NextResponse.json({ questions: [] })
    }
}
