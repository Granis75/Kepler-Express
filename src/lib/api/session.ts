import { getSupabaseClient } from '../supabase'
import { toUserFacingError } from '../supabase-error'

let organizationIdPromise: Promise<string> | null = null

export async function getAuthorizedOrganizationId() {
  if (!organizationIdPromise) {
    organizationIdPromise = (async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        throw toUserFacingError(authError, 'Unable to resolve the current session.')
      }

      if (!user) {
        throw new Error('Authorized login required.')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError) {
        throw toUserFacingError(profileError, 'Unable to resolve the current organization.')
      }

      if (!profile?.organization_id) {
        throw new Error('Workspace profile not found for this account.')
      }

      return profile.organization_id
    })()
  }

  return organizationIdPromise
}

export function resetAuthorizedOrganizationCache() {
  organizationIdPromise = null
}
