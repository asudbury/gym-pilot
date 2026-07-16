import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createUUID } from './utils'
import type { Assignment, Plan, PlanItem, PlanSession, User, UserRole } from '@gym-pilot/types'
import { DexiePersistence } from './storage'
import { ASSIGNMENTS_KEY, PLANS_KEY } from '../../../apps/web/src/constants/storageKeys'

type PlanContextValue = {
  plans: Plan[]
  assignments: Assignment[]
  users: User[]
  createPlan: (planName: string, planSessions?: PlanSession[]) => void
  createPlanForPeople: (personInput: string | string[] | undefined, planSessions?: PlanSession[]) => void
  updatePlan: (planId: string, planName: string, planSessions?: PlanSession[], assignedUserIds?: string[]) => void
  assignUsersToPlan: (planId: string, assignedUserIds: string[]) => void
  updateAssignment: (assignmentId: string, planName: string, planSessions?: PlanSession[]) => void
  updatePlanExercise: (planId: string, exerciseId: string, value: string) => void
  deletePlan: (planId: string) => void
  deleteAssignment: (assignmentId: string) => void
  createUser: (name: string, role?: UserRole) => User | undefined
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
  return {
    ...assignment,
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

async function resolveCurrentUserId(): Promise<string | undefined> {
  const sessionUserId = getCurrentUserIdFromSessionStorage()

  if (sessionUserId) {
    return sessionUserId
  }

  const storedSession = await persistence.load<Partial<{ id?: string }> | null>('gym-pilot-auth-session', null)

  if (!storedSession?.id) {
    return undefined
  }

  return storedSession.id.trim()
}

function getScopedStorageKey(storageKey: string, ownerUserId?: string) {
  const effectiveUserId = ownerUserId?.trim()

  return effectiveUserId ? `${storageKey}:${effectiveUserId}` : `${storageKey}:anonymous`
}

async function getStoredPlans(storageKey: string, ownerUserId?: string): Promise<Plan[]> {
  const scopedStorageKey = getScopedStorageKey(storageKey, ownerUserId)
  const legacyStored = await persistence.load<Plan[]>(storageKey, [])
  const scopedStored = await persistence.load<Plan[]>(scopedStorageKey, [])

  const storedPlans = Array.isArray(scopedStored) && scopedStored.length > 0
    ? scopedStored
    : Array.isArray(legacyStored) && legacyStored.length > 0
      ? legacyStored
      : []

  if (!Array.isArray(storedPlans)) {
    return []
  }

  const normalizedPlans = storedPlans.map((plan) => normalizePlan(plan))

  if (!ownerUserId) {
    return normalizedPlans.filter((plan) => !plan.createdByUserId)
  }

  return normalizedPlans.filter((plan) => !plan.createdByUserId || plan.createdByUserId === ownerUserId)
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
  const [usersHydrated, setUsersHydrated] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    let isActive = true

    const syncCurrentUserId = async () => {
      const resolvedUserId = await resolveCurrentUserId()

      if (isActive) {
        setCurrentUserId(resolvedUserId)
      }
    }

    void syncCurrentUserId()

    const handleAuthUpdate = () => {
      void syncCurrentUserId()
    }

    window.addEventListener('gym-pilot-auth-updated', handleAuthUpdate)

    return () => {
      isActive = false
      window.removeEventListener('gym-pilot-auth-updated', handleAuthUpdate)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    void getStoredPlans(storageKey, currentUserId).then((storedPlans) => {
      if (isActive) {
        setPlans(storedPlans)
        setPlansHydrated(true)
      }
    })

    return () => {
      isActive = false
    }
  }, [storageKey, currentUserId])

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

    void persistence.load<User[]>('gym-pilot-users', []).then((storedUsers) => {
      if (isActive) {
        setUsers(Array.isArray(storedUsers) ? storedUsers : [])
        setUsersHydrated(true)
      }
    })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!plansHydrated) {
      return
    }

    const scopedStorageKey = getScopedStorageKey(storageKey, currentUserId)

    void persistence.save(scopedStorageKey, plans)
  }, [plans, plansHydrated, storageKey, currentUserId])

  useEffect(() => {
    if (!assignmentsHydrated) {
      return
    }

    void persistence.save('gym-pilot-assignments', assignments)
  }, [assignments, assignmentsHydrated])

  useEffect(() => {
    if (!usersHydrated) {
      return
    }

    void persistence.save('gym-pilot-users', users)
  }, [users, usersHydrated])

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

  const createUser = (name: string, role: UserRole = 'client') => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return undefined
    }

    const duplicate = users.find((user) => user.name.toLowerCase() === trimmedName.toLowerCase())

    if (duplicate) {
      return duplicate
    }

    const nextUser: User = {
      id: createUUID(),
      name: trimmedName,
      slug: buildUserSlug(trimmedName),
      role,
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

  const value = useMemo<PlanContextValue>(
    () => ({
      plans,
      assignments,
      users,
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
