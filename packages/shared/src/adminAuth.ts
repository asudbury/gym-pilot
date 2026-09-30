import { getSupabaseClient } from './supabase'

export type SupabaseAuthUser = {
  id: string
  email: string | null
  created_at?: string
  last_sign_in_at?: string | null
  user_metadata?: Record<string, unknown>
}

type AdminCreateAuthUserPayload = {
  email: string
  password: string
  passwordChangeRequired?: boolean
}

type AdminCreateAuthUserResult = {
  user: SupabaseAuthUser
}

type AdminGetAuthUserResult = {
  user: SupabaseAuthUser | null
}

type AdminListAuthUsersResult = {
  users: SupabaseAuthUser[]
}

async function invokeAdminUserManagement<TResult>(
  action: string,
  payload?: Record<string, unknown>,
): Promise<TResult> {
  const client = getSupabaseClient()
  const { data, error } = await client.functions.invoke('admin-user-management', {
    body: {
      action,
      ...payload,
    },
  })

  if (error) {
    throw error
  }

  return data as TResult
}

export async function createSupabaseAdminAuthUser(
  payload: AdminCreateAuthUserPayload,
): Promise<SupabaseAuthUser> {
  const response = await invokeAdminUserManagement<AdminCreateAuthUserResult>(
    'create-auth-user',
    payload,
  )

  return response.user
}

export async function getSupabaseAuthUserById(userId: string) {
  const response = await invokeAdminUserManagement<AdminGetAuthUserResult>(
    'get-auth-user',
    { userId },
  )

  return response.user
}

export async function listSupabaseAuthUsers(): Promise<SupabaseAuthUser[]> {
  const response =
    await invokeAdminUserManagement<AdminListAuthUsersResult>('list-auth-users')

  return response.users
}
