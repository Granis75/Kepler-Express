import type { PostgrestError } from '@supabase/supabase-js'

export class DataLayerError extends Error {
  code?: string
  status?: number

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message)
    this.name = 'DataLayerError'
    this.code = options?.code
    this.status = options?.status
  }
}

export function toDataLayerError(
  error: unknown,
  fallbackMessage = 'Something went wrong while loading data.',
): DataLayerError {
  if (error instanceof DataLayerError) {
    return error
  }

  const postgrestError = error as PostgrestError | null

  if (postgrestError?.message) {
    return new DataLayerError(postgrestError.message, {
      code: postgrestError.code,
    })
  }

  if (error instanceof Error) {
    return new DataLayerError(error.message)
  }

  return new DataLayerError(fallbackMessage)
}

export function getErrorMessage(error: unknown) {
  return toDataLayerError(error).message
}
