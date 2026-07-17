export type UserRole = 'admin' | 'trainer' | 'client' | 'guest'

export type User = {
  id: string
  name: string
  slug: string
  role?: UserRole
  roles: UserRole[]
  trainerId?: string | null
}
