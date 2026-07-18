import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createUUID } from './utils'
import type { Assignment, Plan, PlanItem, PlanSession, User, UserRole } from '@gym-pilot/types'
import { DexiePersistence, listJsonRecords } from './storage'
import { logger } from './logging'
import { ASSIGNMENTS_KEY, PLANS_KEY } from '../../../apps/web/src/constants/storageKeys'
import { listSupabaseProfiles } from './gymPilotSupabase'
import { normalizeUserRoles } from './utils'

type PlanContextValue = {
  plans: Plan[]
  assignments: Assignment[]
  users: User[]
  visiblePlans: Plan[]
  visibleAssignments: Assignment[]
  visibleUsers: User[]
  createPlan: (planName: string, planSessions?: PlanSession[]) => void
  createPlanForPeople: (personInput: string | string[] | undefined, planSessions?: PlanSession[]) => void
  updatePlan: (planId: string, planName: string, planSessions?: PlanSession[], assignedUserIds?: string[]) => void
  assignUsersToPlan: (planId: string, assignedUserIds: string[]) => void
  updateAssignment: (assignmentId: string, planName: string, planSessions?: PlanSession[]) => void
  updatePlanExercise: (planId: string, exerciseId: string, value: string) => void
  deletePlan: (planId: string) => void
  deleteAssignment: (assignmentId: string) => void
  createUser: (name: string, roles?: UserRole | UserRole[], trainerId?: string | null) => User | undefined
  deleteUser: (userId: string) => void
}

type PlanProviderProps = {
  children: ReactNode
  storageKey?: string
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined)
const persistence = new DexiePersistence()
const CURRENT_USER_ID_STORAGE_KEY = 'gym-pilot-current-user-id'

function buildPlanSlug(name: string, plans: Plan[]) {
  const slugParts = [name]
    .map((value) =>
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    )
    .filter(Boolean)

  const baseSlug = slugParts.join('-') || 'plan'
  const duplicateCount = plans.filter(
    (plan) => (plan.planSlug ?? '').toLowerCase() === baseSlug || (plan.planSlug ?? '').startsWith(`${baseSlug}-`),
  ).length

  return duplicateCount > 0 ? `${baseSlug}-${duplicateCount + 1}` : baseSlug
}

function normalizePlan(plan: Plan): Plan {
  const fallbackName = plan.planName || 'Untitled plan'
  const normalizedSessions = Array.isArray(plan.planSessions) && plan.planSessions.length > 0
    ? plan.planSessions.map((session) => ({
        ...session,
        id: session.id || createUUID(),
        title: session.title?.trim() || 'Day 1',
        planItems: Array.isArray(session.planItems) ? session.planItems.map((item) => normalizePlanItem(item)) : [],
      }))
    : [{ id: createUUID(), title: 'Day 1', planItems: [] }]

  return {
    ...plan,
    planName: fallbackName,
    planSlug: plan.planSlug || buildPlanSlug(fallbackName, []),
    planSessions: normalizedSessions,
  }
}

function normalizeAssignment(assignment: Assignment): Assignment {
  const normalizedSessions = Array.isArray(assignment.planSessions) && assignment.planSessions.length > 0
    ? assignment.planSessions.map((session) => ({
        ...session,
        id: session.id || createUUID(),
        title: session.title?.trim() || 'Day 1',
        planItems: Array.isArray(session.planItems) ? session.planItems.map((item) => normalizePlanItem(item)) : [],
      }))
    : []

  return {
    ...assignment,
    planName: assignment.planName || 'Untitled plan',
    planSlug: assignment.planSlug || buildPlanSlug(assignment.planName || 'Untitled plan', []),
    planSessions: normalizedSessions,
    completedExercises: assignment.completedExercises ?? {},
  }
}

function getCurrentUserIdFromSessionStorage(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  const currentUserId = window.sessionStorage.getItem(CURRENT_USER_ID_STORAGE_KEY)?.trim()

  return currentUserId ? currentUserId : undefined
}

async function resolveCurrentUserContext(): Promise<{ id?: string; role?: UserRole; roles?: UserRole[] }> {
  const sessionUserId = getCurrentUserIdFromSessionStorage()

  const storedSession = await persistence.load<Partial<{ id?: string; role?: UserRole; roles?: UserRole[] }> | null>('gym-pilot-auth-session', null)
  const resolvedUserId = sessionUserId?.trim() || storedSession?.id?.trim()

  if (!resolvedUserId) {
    return {}
  }

  const storedRoles = Array.isArray(storedSession?.roles)
    ? normalizeUserRoles(storedSession.roles)
    : []
  const fallbackRole = storedSession?.role && normalizeUserRoles([storedSession.role])[0]
    ? storedSession.role
    : resolvedUserId === 'mvp-bypass'
      ? 'admin'
      : undefined
  const resolvedRoles = storedRoles.length > 0 ? storedRoles : fallbackRole ? [fallbackRole] : []
  const primaryRole = resolvedRoles[0]

  return {
    id: resolvedUserId,
    role: primaryRole,
    roles: resolvedRoles,
  }
}

function getScopedStorageKey(storageKey: string, ownerUserId?: string) {
  const effectiveUserId = ownerUserId?.trim()

  return effectiveUserId ? `${storageKey}:${effectiveUserId}` : `${storageKey}:anonymous`
}

async function getStoredPlans(storageKey: string): Promise<Plan[]> {
  const matchingKeys = new Set<string>([storageKey])
  const storedRecords = await listJsonRecords()

  storedRecords.forEach((record) => {
    if (typeof record.key === 'string' && (record.key === storageKey || record.key.startsWith(`${storageKey}:`))) {
      matchingKeys.add(record.key)
    }
  })

  const PlanCollections = await Promise.all([...matchingKeys].map((key) => persistence.load<Plan[]>(key, [])))
  const storedPlans = PlanCollections.flatMap((collection) => (Array.isArray(collection) ? collection : []))

  if (!Array.isArray(storedPlans)) {
    return []
  }

  const normalizedPlans = storedPlans.map((plan) => normalizePlan(plan))
  const uniquePlans = new Map<string, Plan>()

  normalizedPlans.forEach((plan) => {
    if (!uniquePlans.has(plan.id)) {
      uniquePlans.set(plan.id, plan)
    }
  })

  return Array.from(uniquePlans.values())
}

async function getStoredAssignments(): Promise<Assignment[]> {
  const stored = await persistence.load<Assignment[]>(ASSIGNMENTS_KEY, [])

  if (!Array.isArray(stored)) {
    return []
  }

  return stored.map((assignment) => normalizeAssignment(assignment))
}

function buildUserSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'user'
}

function userHasRole(user: Partial<User> | undefined, requiredRole: UserRole): boolean {
  return normalizeUserRoles(user?.roles, user?.role).includes(requiredRole)
}

function resolveEffectiveUserRole(currentUserRole?: UserRole, currentUserRoles?: UserRole[]): UserRole | undefined {
  if (currentUserRoles?.includes('admin')) {
    return 'admin'
  }

  if (currentUserRoles?.includes('trainer')) {
    return 'trainer'
  }

  if (currentUserRoles?.includes('client')) {
    return 'client'
  }

  if (currentUserRoles?.includes('guest')) {
    return 'guest'
  }

  return currentUserRole
}

function filterUsersForViewer(users: User[], currentUserId?: string, currentUserRole?: UserRole, currentUserRoles?: UserRole[]): User[] {
  const viewerId = currentUserId?.trim()
  const effectiveRole = resolveEffectiveUserRole(currentUserRole, currentUserRoles)

  if (!effectiveRole || effectiveRole === 'guest') {
    return users
  }

  if (effectiveRole === 'admin') {
    return users
  }

  if (effectiveRole === 'trainer') {
    const assignedClientIds = new Set(users.filter((user) => userHasRole(user, 'client') && user.trainerId === viewerId).map((user) => user.id))

    return users.filter((user) => user.id === viewerId || assignedClientIds.has(user.id))
  }

  if (viewerId) {
    return users.filter((user) => user.id === viewerId)
  }

  return []
}

function filterPlansForViewer(plans: Plan[], users: User[], currentUserId?: string, currentUserRole?: UserRole, currentUserRoles?: UserRole[]): Plan[] {
  const viewerId = currentUserId?.trim()
  const effectiveRole = resolveEffectiveUserRole(currentUserRole, currentUserRoles)

  if (!effectiveRole || effectiveRole === 'guest') {
    return plans
  }

  if (effectiveRole === 'admin') {
    return plans
  }

  const visibleUserIds = new Set(users.filter((user) => userHasRole(user, 'client')).map((user) => user.id))
  const assignedClientIds = new Set(users.filter((user) => userHasRole(user, 'client') && user.trainerId === viewerId).map((user) => user.id))

  if (effectiveRole === 'trainer') {
    return plans.filter((plan) => {
      const creatorId = plan.createdByUserId?.trim()

      if (!creatorId) {
        return true
      }

      return creatorId === viewerId || assignedClientIds.has(creatorId) || visibleUserIds.has(creatorId)
    })
  }

  return plans.filter((plan) => {
    const creatorId = plan.createdByUserId?.trim()

    return !creatorId || creatorId === viewerId
  })
}

function filterAssignmentsForViewer(assignments: Assignment[], users: User[], currentUserId?: string, currentUserRole?: UserRole, currentUserRoles?: UserRole[]): Assignment[] {
  const viewerId = currentUserId?.trim()
  const effectiveRole = resolveEffectiveUserRole(currentUserRole, currentUserRoles)

  if (!effectiveRole || effectiveRole === 'guest') {
    return assignments
  }

  if (effectiveRole === 'admin') {
    return assignments
  }

  const visibleUserIds = new Set(users.filter((user) => userHasRole(user, 'client')).map((user) => user.id))
  const assignedClientIds = new Set(users.filter((user) => userHasRole(user, 'client') && user.trainerId === viewerId).map((user) => user.id))

  if (effectiveRole === 'trainer') {
    return assignments.filter((assignment) => {
      const assignedUserId = assignment.assignedUserId?.trim()

      return Boolean(assignedUserId && (assignedUserId === viewerId || assignedClientIds.has(assignedUserId) || visibleUserIds.has(assignedUserId)))
    })
  }

  return assignments.filter((assignment) => assignment.assignedUserId?.trim() === viewerId)
}

function normalizePlanItem(item: Partial<PlanItem> = {}): PlanItem {
  return {
    id: item.id || createUUID(),
    exercise_id: item.exercise_id || item.id || '',
    exercise_name: item.exercise_name || item.id || 'Untitled exercise',
    reps: item.reps ?? '',
    workingSets: item.workingSets ?? '',
    notes: item.notes ?? '',
  }
}

function createAssignmentCopy(basePlan: Plan, user: User): Assignment {
  return {
    id: createUUID(),
    assignmentName: basePlan.planName + ' - ' + user.name,
    planId: basePlan.id,
    planName: basePlan.planName,
    planSlug: basePlan.planSlug,
    planSessions: (basePlan.planSessions ?? []).map((session) => ({
      ...session,
      id: session.id || createUUID(),
      title: session.title?.trim() || 'Day 1',
      planItems: (session.planItems ?? []).map((item) => normalizePlanItem(item)),
    })),
    assignedUserId: user.id,
    assignedUserName: user.name,
    completedExercises: {},
  }
}

export function PlanProvider({ children, storageKey = PLANS_KEY }: PlanProviderProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [plansHydrated, setPlansHydrated] = useState(false)
  const [assignmentsHydrated, setAssignmentsHydrated] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | undefined>(undefined)
  const [currentUserRoles, setCurrentUserRoles] = useState<UserRole[]>([])

  useEffect(() => {
    let isActive = true

    const syncCurrentUserContext = async () => {
      const resolvedUserContext = await resolveCurrentUserContext()

      if (isActive) {
        setCurrentUserId(resolvedUserContext.id)
        setCurrentUserRole(resolvedUserContext.role)
        setCurrentUserRoles(resolvedUserContext.roles ?? [])
      }
    }

    void syncCurrentUserContext()

    const handleAuthUpdate = () => {
      void syncCurrentUserContext()
    }

    window.addEventListener('gym-pilot-auth-updated', handleAuthUpdate)

    return () => {
      isActive = false
      window.removeEventListener('gym-pilot-auth-updated', handleAuthUpdate)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    void getStoredPlans(storageKey).then((storedPlans) => {
      if (isActive) {
        setPlans(storedPlans)
        setPlansHydrated(true)
      }
    })

    return () => {
      isActive = false
    }
  }, [storageKey])

  useEffect(() => {
    let isActive = true

    void getStoredAssignments().then((storedAssignments) => {
      if (isActive) {
        setAssignments(storedAssignments)
        setAssignmentsHydrated(true)
      }
    })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    let isActive = true

    const loadUsersFromSupabase = async () => {
      const profiles = await listSupabaseProfiles()

      if (!isActive) {
        return
      }

      const resolvedUsers = profiles.map((profile) => {
        const roles = normalizeUserRoles(profile.roles)

        return {
          id: profile.user_id,
          name: profile.friendly_name?.trim() || profile.user_id,
          slug: buildUserSlug(profile.friendly_name?.trim() || profile.user_id),
          role: (roles[0] ?? 'client') as UserRole,
          roles,
          trainerId: profile.trainer_id ?? null,
          applicationName: profile.application_name?.trim() || null,
          gymBrand: profile.gym_brand?.trim() || null,
          gymName: null,
        }
      })

      setUsers(resolvedUsers)
    }

    void loadUsersFromSupabase()

    const handleAuthUpdate = () => {
      void loadUsersFromSupabase()
    }

    window.addEventListener('gym-pilot-auth-updated', handleAuthUpdate)

    return () => {
      isActive = false
      window.removeEventListener('gym-pilot-auth-updated', handleAuthUpdate)
    }
  }, [currentUserId, currentUserRole])

  useEffect(() => {
    if (!plansHydrated) {
      return
    }

    const scopedStorageKey = getScopedStorageKey(storageKey, currentUserId)
    logger.info('[PlanContext] Saving plans', { scopedStorageKey, count: plans.length })

    void persistence.save(PLANS_KEY, plans)
  }, [plans, plansHydrated, storageKey, currentUserId])

  useEffect(() => {
    if (!assignmentsHydrated) {
      return
    }

    logger.info('[PlanContext] Saving assignments', { count: assignments.length })
    void persistence.save(ASSIGNMENTS_KEY, assignments)
  }, [assignments, assignmentsHydrated])

  const createPlan = (planName: string, planSessions?: PlanSession[]) => {
    const trimmedName = planName.trim()

    if (!trimmedName) {
      return
    }

    const normalizedSessions = (planSessions ?? []).map((session, index) => ({
      ...session,
      id: session.id || createUUID(),
      title: session.title?.trim() || `Day ${index + 1}`,
      planItems: (session.planItems ?? []).map((item) => normalizePlanItem(item)),
    }))

    if (!normalizedSessions.some((session) => session.planItems.length > 0)) {
      return
    }

    const newPlan: Plan = {
      id: createUUID(),
      planName: trimmedName,
      planSlug: buildPlanSlug(trimmedName, plans),
      planSessions: normalizedSessions,
      createdByUserId: currentUserId,
    }

    setPlans((current) => [...current, newPlan])
  }

  const createPlanForPeople = (personInput: string | string[] | undefined, planSessions?: PlanSession[]) => {
    const assignedPeople = (Array.isArray(personInput) ? personInput : [personInput ?? ''])
      .map((value) => value.trim())
      .filter(Boolean)

    const normalizedSessions = (planSessions ?? []).map((session, index) => ({
      ...session,
      id: session.id || createUUID(),
      title: session.title?.trim() || `Day ${index + 1}`,
      planItems: (session.planItems ?? []).map((item) => normalizePlanItem(item)),
    }))

    if (!normalizedSessions.some((session) => session.planItems.length > 0)) {
      return
    }

    const fallbackName = assignedPeople.length > 0 ? assignedPeople.join(', ') : 'Untitled plan'
    const newPlanItem: Plan = {
      id: createUUID(),
      planName: fallbackName,
      planSlug: buildPlanSlug(fallbackName, plans),
      planSessions: normalizedSessions,
      createdByUserId: currentUserId,
    }

    setPlans((current) => [...current, newPlanItem])
  }

  const updatePlan = (planId: string, planName: string, planSessions?: PlanSession[], assignedUserIds?: string[]) => {
    const trimmedName = planName.trim()

    if (!trimmedName) {
      return
    }

    void assignedUserIds

    setPlans((current) =>
      current.map((plan) => {
        if (plan.id !== planId) {
          return plan
        }

        const normalizedSessions = (planSessions ?? plan.planSessions ?? []).map((session, index) => ({
          ...session,
          id: session.id || createUUID(),
          title: session.title?.trim() || `Day ${index + 1}`,
          planItems: (session.planItems ?? []).map((item) => normalizePlanItem(item)),
        }))

        const nextSlug = buildPlanSlug(trimmedName, current.filter((item) => item.id !== planId))

        return {
          ...plan,
          planName: trimmedName,
          planSlug: nextSlug,
          planSessions: normalizedSessions,
        }
      }),
    )
  }

  const assignUsersToPlan = (planId: string, assignedUserIds: string[]) => {
    const resolvedAssignedUserIds = (assignedUserIds ?? [])
      .filter((value): value is string => typeof value === 'string' && value.trim() !== '')

    void resolvedAssignedUserIds

    setAssignments((current) => {
      const basePlan = plans.find((plan) => plan.id === planId)

      if (!basePlan) {
        return current
      }

      const existingAssignments = current.filter((assignment) => assignment.planId === planId)
      const nextAssignments: Assignment[] = []
      const assignedUsers = users.filter((user) => resolvedAssignedUserIds.includes(user.id))

      assignedUsers.forEach((user) => {
        const existingAssignment = existingAssignments.find((assignment) => assignment.assignedUserId === user.id)

        if (existingAssignment) {
          nextAssignments.push({
            ...existingAssignment,
            assignedUserName: user.name,
            completedExercises: existingAssignment.completedExercises ?? {},
          })
          return
        }

        nextAssignments.push(createAssignmentCopy(basePlan, user))
      })

      return [...current.filter((assignment) => assignment.planId !== planId), ...nextAssignments]
    })
  }

  const updateAssignment = (assignmentId: string, planName: string, planSessions?: PlanSession[]) => {
    const trimmedName = planName.trim()

    if (!trimmedName) {
      return
    }

    const normalizedSessions = (planSessions ?? []).map((session, index) => ({
      ...session,
      id: session.id || createUUID(),
      title: session.title?.trim() || `Day ${index + 1}`,
      planItems: (session.planItems ?? []).map((item) => normalizePlanItem(item)),
    }))

    if (!normalizedSessions.some((session) => session.planItems.length > 0)) {
      return
    }

    setAssignments((current) =>
      current.map((assignment) => {
        if (assignment.id !== assignmentId) {
          return assignment
        }

        return {
          ...assignment,
          assignmentName: assignment.assignmentName || trimmedName,
          planName: trimmedName,
          planSlug: buildPlanSlug(trimmedName, plans),
          planSessions: normalizedSessions,
        }
      }),
    )
  }

  const updatePlanExercise = (planId: string, exerciseId: string, value: string) => {
    setAssignments((current) =>
      current.map((assignment) => {
        if (assignment.planId !== planId) {
          return assignment
        }

        return {
          ...assignment,
          completedExercises: { ...(assignment.completedExercises ?? {}), [exerciseId]: value },
        }
      }),
    )
  }

  const deletePlan = (planId: string) => {
    setPlans((current) => current.filter((plan) => plan.id !== planId))
    setAssignments((current) => current.filter((assignment) => assignment.planId !== planId))
  }

  const deleteAssignment = (assignmentId: string) => {
    setAssignments((current) => current.filter((assignment) => assignment.id !== assignmentId))
  }

  const createUser = (name: string, roles: UserRole | UserRole[] = 'client', trainerId?: string | null) => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return undefined
    }

    const duplicate = users.find((user) => user.name.toLowerCase() === trimmedName.toLowerCase())

    if (duplicate) {
      return duplicate
    }

    const resolvedRoles: UserRole[] = normalizeUserRoles(Array.isArray(roles) ? roles : [roles])
    const primaryRole: UserRole = resolvedRoles[0] ?? 'client'
    const isClientUser = resolvedRoles.includes('client')

    const nextUser: User = {
      id: createUUID(),
      name: trimmedName,
      slug: buildUserSlug(trimmedName),
      role: primaryRole,
      roles: resolvedRoles,
      trainerId: isClientUser ? trainerId ?? null : null,
      applicationName: null,
      gymBrand: null,
      gymName: null,
    }

    setUsers((current) => [...current, nextUser])
    return nextUser
  }

  const deleteUser = (userId: string) => {
    const trimmedUserId = userId.trim()

    if (!trimmedUserId) {
      return
    }

    const nextUsers = users.filter((user) => user.id !== trimmedUserId)

    setUsers(nextUsers)
    setPlans((current) => current.map((plan) => ({ ...plan })))
    setAssignments((current) => current.filter((assignment) => assignment.assignedUserId !== trimmedUserId))
  }

  const visiblePlans = useMemo(() => filterPlansForViewer(plans, users, currentUserId, currentUserRole, currentUserRoles), [plans, users, currentUserId, currentUserRole, currentUserRoles])
  const visibleAssignments = useMemo(() => filterAssignmentsForViewer(assignments, users, currentUserId, currentUserRole, currentUserRoles), [assignments, users, currentUserId, currentUserRole, currentUserRoles])
  const visibleUsers = useMemo(() => filterUsersForViewer(users, currentUserId, currentUserRole, currentUserRoles), [users, currentUserId, currentUserRole, currentUserRoles])

  const value = useMemo<PlanContextValue>(
    () => ({
      plans,
      assignments,
      users,
      visiblePlans,
      visibleAssignments,
      visibleUsers,
      createPlan,
      createPlanForPeople,
      updatePlan,
      assignUsersToPlan,
      updateAssignment,
      updatePlanExercise,
      deletePlan,
      deleteAssignment,
      createUser,
      deleteUser,
    }),
    [plans, assignments, users],
  )

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan() {
  const context = useContext(PlanContext)

  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider')
  }

  return context
}
