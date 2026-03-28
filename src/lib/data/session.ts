import { DataLayerError, toDataLayerError } from './errors'
import { getSupabaseClient } from './supabase'

let organizationIdPromise: Promise<string> | null = null

export async function getCurrentUserId() {
  const supabase = getSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw toDataLayerError(error, 'Unable to load the signed-in user.')
  }

  if (!user) {
    throw new DataLayerError('Sign in to access organization data.')
  }

  return user.id
}

export async function getCurrentOrganizationId() {
  if (!organizationIdPromise) {
    organizationIdPromise = (async () => {
      const userId = await getCurrentUserId()
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', userId)
        .single()

      if (error) {
        throw toDataLayerError(error, 'Unable to resolve the current organization.')
      }

      if (!data?.organization_id) {
        throw new DataLayerError('No organization profile is available for the current user.')
      }

      return data.organization_id
    })()
  }

  return organizationIdPromise
}

export function resetOrganizationCache() {
  organizationIdPromise = null
}
