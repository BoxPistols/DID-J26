/**
 * Safe Async Utilities
 *
 * Wrapper functions for async operations with unified error handling
 */

import { AppError, normalizeError } from './errors'
import { logger } from './logger'

/**
 * Result type for async operations
 */
export type AsyncResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: AppError }

/**
 * Execute async function with fallback value on error
 *
 * @example
 * ```typescript
 * const data = await safeAsync(
 *   () => fetchUserData(userId),
 *   { name: 'Unknown', id: '' }
 * )
 * // Always returns data, never throws
 * ```
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    const normalizedError = normalizeError(error)
    logger.error(
      context ?? 'Async operation failed',
      normalizedError,
      { context: context ?? 'safeAsync' }
    )
    return fallback
  }
}

/**
 * Execute async function and return result with error info
 *
 * @example
 * ```typescript
 * const result = await safeAsyncResult(() => fetchUserData(userId))
 *
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error(result.error.message)
 * }
 * ```
 */
export async function safeAsyncResult<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<AsyncResult<T>> {
  try {
    const data = await fn()
    return { success: true, data, error: null }
  } catch (error) {
    const normalizedError = normalizeError(error)
    logger.error(
      context ?? 'Async operation failed',
      normalizedError,
      { context: context ?? 'safeAsyncResult' }
    )
    return { success: false, data: null, error: normalizedError }
  }
}

/**
 * Execute async function with retry logic
 *
 * @example
 * ```typescript
 * const data = await retryAsync(
 *   () => fetchWithTimeout(url),
 *   { maxRetries: 3, delayMs: 1000 }
 * )
 * ```
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    delayMs?: number
    context?: string
    shouldRetry?: (error: AppError) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    context,
    shouldRetry = () => true
  } = options

  let lastError: AppError | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = normalizeError(error)

      if (attempt < maxRetries && shouldRetry(lastError)) {
        logger.warn(
          `Attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs}ms`,
          { context: context ?? 'retryAsync', details: { error: lastError.message } }
        )
        await delay(delayMs)
      }
    }
  }

  logger.error(
    `All ${maxRetries} attempts failed`,
    lastError,
    { context: context ?? 'retryAsync' }
  )
  throw lastError
}

/**
 * Execute async function with timeout
 *
 * @example
 * ```typescript
 * const data = await withTimeout(
 *   () => fetchData(url),
 *   5000 // 5 seconds
 * )
 * ```
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  context?: string
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new AppError('TIMEOUT', `Operation timed out after ${timeoutMs}ms`))
        })
      })
    ])
    clearTimeout(timeoutId)
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    const normalizedError = normalizeError(error)
    logger.error(
      `Operation timed out after ${timeoutMs}ms`,
      normalizedError,
      { context: context ?? 'withTimeout' }
    )
    throw normalizedError
  }
}

/**
 * Helper function for delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Batch execute multiple async operations
 *
 * @example
 * ```typescript
 * const results = await batchAsync([
 *   () => fetchUser(1),
 *   () => fetchUser(2),
 *   () => fetchUser(3)
 * ], { concurrency: 2 })
 * ```
 */
export async function batchAsync<T>(
  fns: Array<() => Promise<T>>,
  options: { concurrency?: number; context?: string } = {}
): Promise<AsyncResult<T>[]> {
  const { concurrency = 5, context } = options
  const results: AsyncResult<T>[] = []

  for (let i = 0; i < fns.length; i += concurrency) {
    const batch = fns.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map((fn) => safeAsyncResult(fn, context))
    )
    results.push(...batchResults)
  }

  return results
}
