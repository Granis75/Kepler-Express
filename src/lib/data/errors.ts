import type { PostgrestError } from '@supabase/supabase-js'

export class DataLayerError extends Error {
  code?: string
  details?: string
  hint?: string
  raw?: unknown
  status?: number

  constructor(
    message: string,
    options?: {
      code?: string
      details?: string
      hint?: string
      raw?: unknown
      status?: number
    },
  ) {
    super(message)
    this.name = 'DataLayerError'
    this.code = options?.code
    this.details = options?.details
    this.hint = options?.hint
    this.raw = options?.raw
    this.status = options?.status
  }
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'message' in error &&
      'details' in error &&
      'hint' in error &&
      'code' in error
  )
}

function formatPostgrestMessage(error: PostgrestError) {
  return [error.message, error.details ? `Details: ${error.details}` : '', error.hint ? `Hint: ${error.hint}` : '']
    .filter(Boolean)
    .join(' ')
}

export function toDataLayerError(
  error: unknown,
  fallbackMessage = 'Something went wrong while loading data.',
): DataLayerError {
  if (error instanceof DataLayerError) {
    return error
  }

  if (isPostgrestError(error)) {
    return new DataLayerError(formatPostgrestMessage(error), {
      code: error.code ?? undefined,
      details: error.details ?? undefined,
      hint: error.hint ?? undefined,
      raw: error,
    })
  }

  if (error instanceof Error) {
    return new DataLayerError(error.message, {
      raw: error,
    })
  }

  return new DataLayerError(fallbackMessage)
}

export function getErrorMessage(error: unknown) {
  return toDataLayerError(error).message
}
