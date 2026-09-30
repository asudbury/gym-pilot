import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/supabaseClient.ts'

type SupabaseAuthUser = {
  id: string
  email: string | null
  created_at?: string
  last_sign_in_at?: string | null
  user_metadata?: Record<string, unknown>
}

type AdminUserManagementRequest =
  | {
      action: 'create-auth-user'
      email: string
      password: string
      passwordChangeRequired?: boolean
    }
  | {
      action: 'get-auth-user'
      userId: string
    }
  | {
      action: 'list-auth-users'
    }

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function createRequestClient(req: Request) {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    return null
  }

  return createClient(
    getRequiredEnv('SUPABASE_URL'),
    getRequiredEnv('SUPABASE_ANON_KEY'),
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

function createAdminClient() {
  return createClient(
    getRequiredEnv('SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function mapAuthUser(user: {
  id: string
  email?: string | null
  created_at?: string
  last_sign_in_at?: string | null
  user_metadata?: Record<string, unknown>
}): SupabaseAuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
    user_metadata: user.user_metadata ?? undefined,
  }
}

async function requireAdminUser(req: Request) {
  const requestClient = createRequestClient(req)

  if (!requestClient) {
    return { error: jsonResponse({ error: 'Unauthorized' }, 401), userId: null }
  }

  const {
    data: { user },
    error: userError,
  } = await requestClient.auth.getUser()

  if (userError || !user) {
    return { error: jsonResponse({ error: 'Unauthorized' }, 401), userId: null }
  }

  const { data: roles, error: rolesError } = await requestClient
    .from('gym_pilot_user_role')
    .select('role')
    .eq('user_id', user.id)

  if (rolesError) {
    return {
      error: jsonResponse({ error: 'Forbidden' }, 403),
      userId: null,
    }
  }

  const isAdmin = (roles ?? []).some((roleRow) => roleRow.role === 'admin')

  if (!isAdmin) {
    return { error: jsonResponse({ error: 'Forbidden' }, 403), userId: null }
  }

  return { error: null, userId: user.id }
}

async function handleCreateAuthUser(
  adminClient: ReturnType<typeof createAdminClient>,
  payload: Extract<AdminUserManagementRequest, { action: 'create-auth-user' }>,
) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: {
      password_change_required: Boolean(payload.passwordChangeRequired),
    },
  })

  if (error || !data.user) {
    return jsonResponse({ error: 'Could not create auth user.' }, 400)
  }

  return jsonResponse({
    user: mapAuthUser(data.user),
  })
}

async function handleGetAuthUser(
  adminClient: ReturnType<typeof createAdminClient>,
  payload: Extract<AdminUserManagementRequest, { action: 'get-auth-user' }>,
) {
  const { data, error } = await adminClient.auth.admin.getUserById(payload.userId)

  if (error) {
    return jsonResponse({ error: 'Could not load auth user.' }, 400)
  }

  return jsonResponse({
    user: data.user ? mapAuthUser(data.user) : null,
  })
}

async function handleListAuthUsers(
  adminClient: ReturnType<typeof createAdminClient>,
) {
  const { data, error } = await adminClient.auth.admin.listUsers()

  if (error) {
    return jsonResponse({ error: 'Could not list auth users.' }, 400)
  }

  return jsonResponse({
    users: (data.users ?? []).map(mapAuthUser),
  })
}

export default {
  async fetch(req: Request) {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const { error } = await requireAdminUser(req)

    if (error) {
      return error
    }

    try {
      const payload = (await req.json()) as AdminUserManagementRequest
      const adminClient = createAdminClient()

      switch (payload.action) {
        case 'create-auth-user':
          return await handleCreateAuthUser(adminClient, payload)
        case 'get-auth-user':
          return await handleGetAuthUser(adminClient, payload)
        case 'list-auth-users':
          return await handleListAuthUsers(adminClient)
        default:
          return jsonResponse({ error: 'Unsupported action' }, 400)
      }
    } catch (error) {
      return jsonResponse(
        { error: 'Internal server error' },
        500,
      )
    }
  },
}
