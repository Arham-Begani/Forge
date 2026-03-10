import { runGenesisAgent, GenesisOutput } from './genesis'
import { runIdentityAgent, IdentityOutput } from './identity'
import { runPipelineAgent, PipelineOutput } from './pipeline'
import { runFeasibilityAgent, FeasibilityOutput } from './feasibility'
// NEVER import runContentAgent — Marketing is not part of Full Launch
import { getProModelWithThinking, streamPrompt } from '../lib/gemini'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FullLaunchResult {
  research: GenesisOutput
  branding: IdentityOutput
  landing: PipelineOutput
  feasibility: FeasibilityOutput
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function runFullLaunch(
  venture: { ventureId: string; name: string; globalIdea?: string; context: Record<string, unknown> },
  onStream: (line: string) => Promise<void>,
  onAgentStatus: (agentId: string, status: 'waiting' | 'running' | 'complete' | 'failed') => Promise<void>,
  onComplete: (result: FullLaunchResult) => Promise<void>
): Promise<void> {

  // ── STEP 0 — Architect thinks ──────────────────────────────────────────────

  await onStream('=== Architect Agent: Planning your venture ===\n\n')

  const architectModel = getProModelWithThinking(5000, 'gemini-2.5-pro')

  await streamPrompt(
    architectModel,
    `You are the Architect Agent — team lead for the Forge venture platform.
     Your job is to analyse a venture concept and produce a brief task plan
     for your four specialist agents: Genesis, Identity, Pipeline, Feasibility.
     Be specific. Reference the venture concept in each agent brief.
     Output a short task plan (under 300 words) then stop.`,
    `Venture concept: ${venture.name}
${venture.globalIdea ? `Global Startup Vision: ${venture.globalIdea}\n` : ''}
     Briefly plan what each agent should focus on for this specific venture.
     Be concrete and specific to this idea — not generic instructions.`,
    onStream
  )

  await onStream('\n\n')

  // ── STEP 1 — Genesis Engine ────────────────────────────────────────────────

  await onAgentStatus('genesis', 'running')
  await onStream('=== Genesis Engine: Market Research ===\n\n')

  let genesisResult: GenesisOutput | null = null

  await runGenesisAgent(venture, onStream, async (result) => {
    genesisResult = result
    venture = { ...venture, context: { ...venture.context, research: result } }
  })

  if (!genesisResult) throw new Error('Genesis agent failed to produce output')
  await onAgentStatus('genesis', 'complete')
  await onStream('\n\n')

  // ── STEP 2 — Identity Architect (requires Genesis) ─────────────────────────

  await onAgentStatus('identity', 'running')
  await onStream('=== Identity Architect: Brand Bible ===\n\n')

  let identityResult: IdentityOutput | null = null

  await runIdentityAgent(venture, onStream, async (result) => {
    identityResult = result
    venture = { ...venture, context: { ...venture.context, branding: result } }
  })

  if (!identityResult) throw new Error('Identity agent failed to produce output')
  await onAgentStatus('identity', 'complete')
  await onStream('\n\n')

  // ── STEP 3 — Pipeline + Feasibility in PARALLEL ───────────────────────────

  await onAgentStatus('pipeline', 'running')
  await onAgentStatus('feasibility', 'running')
  await onStream('=== Running Landing Page + Feasibility in parallel ===\n\n')

  const [landingSettled, feasibilitySettled] = await Promise.allSettled([
    new Promise<PipelineOutput>((resolve, reject) => {
      runPipelineAgent(
        venture,
        async (chunk) => onStream('[Landing] ' + chunk),
        async (result) => resolve(result)
      ).catch(reject)
    }),
    new Promise<FeasibilityOutput>((resolve, reject) => {
      runFeasibilityAgent(
        venture,
        async (chunk) => onStream('[Feasibility] ' + chunk),
        async (result) => resolve(result)
      ).catch(reject)
    }),
  ])

  let landingResult: PipelineOutput | null = null
  let feasibilityResult: FeasibilityOutput | null = null

  if (landingSettled.status === 'fulfilled') {
    landingResult = landingSettled.value
    await onAgentStatus('pipeline', 'complete')
  } else {
    await onAgentStatus('pipeline', 'failed')
    await onStream('\n[Landing Page failed: ' + (landingSettled.reason as Error)?.message + ']\n')
  }

  if (feasibilitySettled.status === 'fulfilled') {
    feasibilityResult = feasibilitySettled.value
    await onAgentStatus('feasibility', 'complete')
  } else {
    await onAgentStatus('feasibility', 'failed')
    await onStream('\n[Feasibility failed: ' + (feasibilitySettled.reason as Error)?.message + ']\n')
  }

  // Require at minimum Research + Branding to succeed
  if (!genesisResult || !identityResult) {
    throw new Error('Full Launch failed: Research or Branding did not complete.')
  }

  await onComplete({
    research: genesisResult,
    branding: identityResult,
    landing: (landingResult ?? {}) as PipelineOutput,
    feasibility: (feasibilityResult ?? {}) as FeasibilityOutput,
  })
}
