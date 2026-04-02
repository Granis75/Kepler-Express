import type { AuthError, PostgrestError } from '@supabase/supabase-js'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    isObject(error) &&
    typeof error.message === 'string' &&
    'details' in error &&
    'hint' in error &&
    'code' in error
  )
}

function isAuthError(error: unknown): error is AuthError {
  return isObject(error) && typeof error.message === 'string' && typeof error.name === 'string'
}

function normalizeAuthMessage(error: AuthError) {
  const message = error.message.toLowerCase()

  if (message.includes('invalid login credentials')) {
    return 'The email address or password is incorrect.'
  }

  if (message.includes('email not confirmed')) {
    return 'Confirm the email address before signing in.'
  }

  if (message.includes('user already registered')) {
    return 'An account already exists for this email address.'
  }

  if (message.includes('password should be at least')) {
    return 'The password does not meet the minimum security requirements.'
  }

  return error.message
}

function normalizePostgrestMessage(error: PostgrestError, fallbackMessage: string) {
  switch (error.code) {
    case '23505':
      return 'This record conflicts with an existing value. Check unique fields and try again.'
    case '23503':
      return 'This action references data that is missing or no longer available.'
    case '23514':
      return 'One of the values does not pass validation. Review the form and try again.'
    case '42501':
      return 'You do not have permission to perform this action in the current workspace.'
    case 'PGRST116':
      return fallbackMessage
    default:
      return error.message || fallbackMessage
  }
}

export function toUserFacingMessage(error: unknown, fallbackMessage: string) {
  if (isPostgrestError(error)) {
    return normalizePostgrestMessage(error, fallbackMessage)
  }

  if (isAuthError(error)) {
    return normalizeAuthMessage(error)
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage
  }

  return fallbackMessage
}

export function toUserFacingError(error: unknown, fallbackMessage: string) {
  return new Error(toUserFacingMessage(error, fallbackMessage))
}
