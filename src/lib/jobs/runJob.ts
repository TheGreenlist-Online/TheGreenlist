import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export type JobStatus = 'running' | 'success' | 'partial' | 'error'

export type JobResult = {
  status: 'success' | 'partial' | 'error'
  itemsProcessed: number
  message: string
  [key: string]: unknown
}

/**
 * Generic lifecycle wrapper for background automations.
 *
 * Handles the `automation_jobs` bookkeeping (insert a `running` row, then
 * update it to `success` / `partial` / `error` once the job function
 * settles) so individual jobs only need to implement their own logic and
 * return a `JobResult`. Future automations should follow this pattern:
 *
 *   await runJob('some-job-name', async () => {
 *     // ... do work ...
 *     return { status: 'success', itemsProcessed: 10, message: 'Did the thing.' }
 *   })
 */
export async function runJob<T extends JobResult>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const admin = createSupabaseAdminClient()
  const startedAt = new Date().toISOString()

  let jobId: string | null = null

  try {
    const { data, error } = await admin
      .from('automation_jobs')
      .insert({
        name,
        status: 'running',
        items_processed: 0,
        started_at: startedAt,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`[runJob:${name}] Failed to create automation_jobs row:`, error.message)
    } else {
      jobId = data?.id ?? null
    }
  } catch (insertError) {
    console.error(`[runJob:${name}] Unexpected error creating automation_jobs row:`, insertError)
  }

  try {
    const result = await fn()

    if (jobId) {
      await admin
        .from('automation_jobs')
        .update({
          status: result.status,
          items_processed: result.itemsProcessed,
          message: result.message,
          finished_at: new Date().toISOString(),
        })
        .eq('id', jobId)
    }

    return result
  } catch (jobError) {
    const message = jobError instanceof Error ? jobError.message : 'Unknown job error.'

    if (jobId) {
      await admin
        .from('automation_jobs')
        .update({
          status: 'error',
          items_processed: 0,
          message,
          finished_at: new Date().toISOString(),
        })
        .eq('id', jobId)
    }

    throw jobError
  }
}
