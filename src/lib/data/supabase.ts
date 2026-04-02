import { createClient, PostgrestError } from '@supabase/supabase-js'
import type { PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../constants'
import type { Database } from './database'
import { DataLayerError } from './errors'

type DatabaseClient = SupabaseClient<Database>
type MonitoredMutation = 'insert' | 'update'

interface MutationContext {
  client: DatabaseClient
  table: string
  operation: MonitoredMutation
  payload: unknown
}

interface SessionSnapshot {
  sessionError: Error | null
  userId: string | null
}

let supabaseClient: DatabaseClient | null = null

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

function isPromiseLike<T = unknown>(value: unknown): value is PromiseLike<T> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'then' in value &&
      typeof (value as { then?: unknown }).then === 'function'
  )
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

function hasPostgrestFailure(
  response: unknown,
): response is PostgrestSingleResponse<unknown> & { error: PostgrestError } {
  return Boolean(
    response &&
      typeof response === 'object' &&
      'error' in response &&
      isPostgrestError((response as { error: unknown }).error)
  )
}

function serializePayload(payload: unknown) {
  if (payload === undefined) {
    return 'undefined'
  }

  try {
    return JSON.stringify(
      payload,
      (_, value) => (typeof value === 'bigint' ? value.toString() : value),
      2
    )
  } catch {
    return String(payload)
  }
}

async function getSessionSnapshot(client: DatabaseClient): Promise<SessionSnapshot> {
  try {
    const { data, error } = await client.auth.getSession()

    return {
      sessionError: error ?? null,
      userId: data.session?.user?.id ?? null,
    }
  } catch (error) {
    return {
      sessionError: error instanceof Error ? error : new Error('Unknown session lookup failure'),
      userId: null,
    }
  }
}

function logMutationFailure(
  context: MutationContext,
  response: {
    status: number
    statusText: string
    error: PostgrestError
  },
  session: SessionSnapshot,
) {
  const label = `[Supabase Monitor] ${context.operation.toUpperCase()} failed on ${context.table}`

  console.groupCollapsed(label)
  console.table([
    {
      table: context.table,
      operation: context.operation,
      payload: serializePayload(context.payload),
      status: response.status,
      code: response.error.code ?? '',
      message: response.error.message,
      details: response.error.details ?? '',
      hint: response.error.hint ?? '',
    },
  ])

  if (session.sessionError) {
    console.warn('[Supabase Monitor] Session validation failed before mutation.', {
      table: context.table,
      operation: context.operation,
      error: session.sessionError,
    })
  }

  if (session.userId) {
    console.warn('Potential RLS Breach', {
      table: context.table,
      operation: context.operation,
      userId: session.userId,
      status: response.status,
      code: response.error.code ?? '',
    })
  } else {
    console.warn('[Supabase Monitor] No authenticated user found before mutation.', {
      table: context.table,
      operation: context.operation,
    })
  }

  console.error('[Supabase Monitor] Raw mutation failure', {
    table: context.table,
    operation: context.operation,
    payload: context.payload,
    sessionUserId: session.userId,
    status: response.status,
    statusText: response.statusText,
    error: response.error,
  })
  console.groupEnd()
}

function logThrownMutationFailure(
  context: MutationContext,
  error: unknown,
  session: SessionSnapshot,
) {
  const postgrestError = isPostgrestError(error)
    ? new PostgrestError(error)
    : new PostgrestError({
        message: error instanceof Error ? error.message : 'Unknown Supabase mutation error',
        details: error instanceof Error ? error.stack ?? '' : '',
        hint: '',
        code: '',
      })

  logMutationFailure(
    context,
    {
      status: 0,
      statusText: 'THROW_ON_ERROR',
      error: postgrestError,
    },
    session,
  )
}

async function executeMonitoredMutation<Response>(
  builder: PromiseLike<Response>,
  context: MutationContext,
) {
  const session = await getSessionSnapshot(context.client)

  try {
    const response = await Promise.resolve(builder)

    if (hasPostgrestFailure(response)) {
      logMutationFailure(context, response, session)
    }

    return response
  } catch (error) {
    logThrownMutationFailure(context, error, session)
    throw error
  }
}

function wrapMutationBuilder<T extends object>(builder: T, context: MutationContext): T {
  let monitoredPromise: Promise<unknown> | null = null

  const getMonitoredPromise = () => {
    if (!monitoredPromise) {
      monitoredPromise = executeMonitoredMutation(builder as PromiseLike<unknown>, context)
    }

    return monitoredPromise
  }

  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return getMonitoredPromise().then.bind(getMonitoredPromise())
      }

      if (prop === 'catch') {
        return getMonitoredPromise().catch.bind(getMonitoredPromise())
      }

      if (prop === 'finally') {
        return getMonitoredPromise().finally.bind(getMonitoredPromise())
      }

      const value = Reflect.get(target, prop, receiver)

      if (typeof value !== 'function') {
        return value
      }

      return (...args: unknown[]) => {
        const result = value.apply(target, args)
        return isPromiseLike(result) ? wrapMutationBuilder(result as object, context) : result
      }
    },
  }) as T
}

function wrapQueryBuilder<T extends object>(
  builder: T,
  client: DatabaseClient,
  table: string,
): T {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)

      if (prop !== 'insert' && prop !== 'update') {
        return typeof value === 'function' ? value.bind(target) : value
      }

      return (payload: unknown, ...args: unknown[]) => {
        const nextBuilder = (value as (...params: unknown[]) => object).apply(target, [
          payload,
          ...args,
        ])

        return wrapMutationBuilder(nextBuilder, {
          client,
          table,
          operation: prop,
          payload,
        })
      }
    },
  }) as T
}

function createMonitoredSupabaseClient(client: DatabaseClient): DatabaseClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === 'from') {
        return ((relation: string) =>
          wrapQueryBuilder(
            (target.from as (relation: string) => object)(relation),
            target,
            relation,
          )) as DatabaseClient['from']
      }

      const value = Reflect.get(target, prop, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    },
  }) as DatabaseClient
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new DataLayerError(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    )
  }

  if (!supabaseClient) {
    const baseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
    supabaseClient = createMonitoredSupabaseClient(baseClient)
  }

  return supabaseClient
}
