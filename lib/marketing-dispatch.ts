import 'server-only'

import {
  applyPublishResultToAsset,
  claimPublishJob,
  createPublishAttempt,
  getMarketingAssetByIdAdmin,
  getSocialConnectionSecretByProviderAdmin,
  listDuePublishJobs,
  markPublishJobCompleted,
  markPublishJobFailed,
  markSocialConnectionStatus,
  requeuePublishJob,
  updateMarketingAssetStatusAdmin,
} from '@/lib/marketing-queries'
import { MarketingProviderError, publishMarketingAsset } from '@/lib/marketing-publish'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown publish error'
}

export interface DispatchSummary {
  processed: number
  completed: number
  failed: number
  requeued: number
  reauth: number
}

export async function dispatchDuePublishJobs(options?: {
  jobIds?: string[]
  limit?: number
}): Promise<DispatchSummary> {
  const summary: DispatchSummary = {
    processed: 0,
    completed: 0,
    failed: 0,
    requeued: 0,
    reauth: 0,
  }

  const claimedJobs = options?.jobIds
    ? (await Promise.all(options.jobIds.map((jobId) => claimPublishJob(jobId)))).filter(Boolean)
    : (await Promise.all((await listDuePublishJobs(options?.limit ?? 10)).map((job) => claimPublishJob(job.id)))).filter(Boolean)

  for (const job of claimedJobs) {
    summary.processed += 1

    const asset = await getMarketingAssetByIdAdmin(job!.asset_id)
    if (!asset) {
      await markPublishJobFailed(job!.id, 'Marketing asset no longer exists')
      summary.failed += 1
      continue
    }

    await updateMarketingAssetStatusAdmin(asset.id, {
      status: 'publishing',
      lastError: null,
    })

    const connection = await getSocialConnectionSecretByProviderAdmin(asset.user_id, asset.provider)
    if (!connection) {
      await updateMarketingAssetStatusAdmin(asset.id, {
        status: 'needs_reauth',
        lastError: 'No active social connection found for this provider',
      })
      await markPublishJobFailed(job!.id, 'No active social connection found', 'needs_reauth')
      await createPublishAttempt({
        jobId: job!.id,
        assetId: asset.id,
        userId: asset.user_id,
        provider: asset.provider,
        status: 'failed',
        errorMessage: 'No active social connection found',
      })
      summary.reauth += 1
      continue
    }

    try {
      const result = await publishMarketingAsset(asset, connection)
      await applyPublishResultToAsset(asset.id, result)
      await markPublishJobCompleted(job!.id)
      await createPublishAttempt({
        jobId: job!.id,
        assetId: asset.id,
        userId: asset.user_id,
        provider: asset.provider,
        status: 'success',
        providerResponse: result.metadata,
      })
      summary.completed += 1
    } catch (error) {
      const message = getErrorMessage(error)
      const providerError = error instanceof MarketingProviderError ? error : null

      if (providerError?.requiresReauth) {
        await markSocialConnectionStatus(connection.id, 'reauth_required')
        await updateMarketingAssetStatusAdmin(asset.id, {
          status: 'needs_reauth',
          lastError: message,
        })
        await markPublishJobFailed(job!.id, message, 'needs_reauth')
        await createPublishAttempt({
          jobId: job!.id,
          assetId: asset.id,
          userId: asset.user_id,
          provider: asset.provider,
          status: 'failed',
          errorMessage: message,
        })
        summary.reauth += 1
        continue
      }

      if (providerError?.retryable && job!.retry_count + 1 < job!.max_retries) {
        await requeuePublishJob(job!, message)
        await updateMarketingAssetStatusAdmin(asset.id, {
          status: 'scheduled',
          lastError: message,
        })
        await createPublishAttempt({
          jobId: job!.id,
          assetId: asset.id,
          userId: asset.user_id,
          provider: asset.provider,
          status: 'failed',
          errorMessage: message,
        })
        summary.requeued += 1
        continue
      }

      await updateMarketingAssetStatusAdmin(asset.id, {
        status: 'failed',
        lastError: message,
      })
      await markPublishJobFailed(job!.id, message)
      await createPublishAttempt({
        jobId: job!.id,
        assetId: asset.id,
        userId: asset.user_id,
        provider: asset.provider,
        status: 'failed',
        errorMessage: message,
      })
      summary.failed += 1
    }
  }

  return summary
}
